import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signIn, refreshTokens } from '@/lib/cognito';

// Simple JWT decode function (doesn't verify, just decodes)
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Cognito',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Authenticate with Cognito
          const cognitoResult = await signIn(credentials.email, credentials.password);

          // Upsert user and update last_login
          const upsertResponse = await fetch(`${API_URL}/api/users/upsert-on-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cognitoResult.idToken}`,
            },
            body: JSON.stringify({
              cognito_sub: cognitoResult.userSub,
              email: cognitoResult.email,
            }),
          });

          let userData;
          if (upsertResponse.ok) {
            userData = await upsertResponse.json();
          } else {
            // Fallback: try to get user info from /me endpoint
            const userResponse = await fetch(`${API_URL}/api/users/me`, {
              headers: {
                Authorization: `Bearer ${cognitoResult.idToken}`,
              },
            });

            if (userResponse.ok) {
              userData = await userResponse.json();
            } else {
              // If user doesn't exist in backend, create a basic user object
              // The upsert will happen on next login attempt
              return {
                id: cognitoResult.userSub,
                email: cognitoResult.email,
                cognitoSub: cognitoResult.userSub,
                accessToken: cognitoResult.accessToken,
                idToken: cognitoResult.idToken,
                refreshToken: cognitoResult.refreshToken,
                role: 'CONSUMER', // Default role
                onboarding_status: 'PRE_COGNITO',
              };
            }
          }

          return {
            id: userData.id.toString(),
            email: userData.email,
            cognitoSub: userData.cognito_sub,
            accessToken: cognitoResult.accessToken,
            idToken: cognitoResult.idToken,
            refreshToken: cognitoResult.refreshToken,
            role: userData.role,
            memberId: userData.fraternity_member_id,
            sellerId: userData.seller_id,
            promoterId: userData.promoter_id,
            stewardId: userData.steward_id,
            features: userData.features,
            name: userData.name,
            onboarding_status: userData.onboarding_status || 'PRE_COGNITO',
          };
        } catch (error: any) {
          console.error('Authentication error:', error);
          console.error('Error details:', {
            code: error.code,
            name: error.name,
            message: error.message,
            toString: error.toString(),
            keys: Object.keys(error || {})
          });
          
          // If password change is required, return a special object that NextAuth will treat as an error
          // but we can check for it in the login page
          if (error.message?.includes('NEW_PASSWORD_REQUIRED')) {
            // Return null but we'll handle this differently
            // Actually, we need to throw a specific error that NextAuth will pass through
            const customError = new Error('NEW_PASSWORD_REQUIRED');
            (customError as any).code = 'NEW_PASSWORD_REQUIRED';
            throw customError;
          }
          
          // If user is not confirmed, throw a specific error - check all possible ways
          const errorMessage = error.message || error.toString() || '';
          const errorCode = error.code || error.name || '';
          const isUserNotConfirmed = 
            errorCode === 'UserNotConfirmedException' ||
            error.name === 'UserNotConfirmedException' ||
            errorMessage.includes('UserNotConfirmedException') ||
            errorMessage.includes('User is not confirmed') ||
            errorMessage.includes('not confirmed');
          
          if (isUserNotConfirmed) {
            console.log('✅ UserNotConfirmedException detected in NextAuth, throwing custom error');
            // Throw error with a specific message that we can check in the frontend
            // NextAuth will pass this through in result.error
            const customError = new Error('UserNotConfirmedException');
            (customError as any).code = 'UserNotConfirmedException';
            (customError as any).type = 'UserNotConfirmedException';
            throw customError;
          }
          
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login', // Redirect errors to login page
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // This callback is called before the user is signed in
      // We can use it to handle errors, but errors from authorize are already handled
      return true;
    },
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.cognitoSub = (user as any).cognitoSub;
        token.accessToken = (user as any).accessToken;
        token.idToken = (user as any).idToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role || 'CONSUMER';
        token.memberId = (user as any).memberId;
        token.sellerId = (user as any).sellerId;
        token.promoterId = (user as any).promoterId;
        token.stewardId = (user as any).stewardId;
        token.features = (user as any).features || {};
        token.name = (user as any).name;
        token.onboarding_status = (user as any).onboarding_status;
        return token;
      }

      // Check if token is expired and refresh if needed
      if (token.idToken) {
        try {
          const decoded = decodeJWT(token.idToken as string) as any;
          if (decoded && decoded.exp) {
            const expirationTime = decoded.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const timeUntilExpiry = expirationTime - now;
            
            // Refresh if token expires in less than 5 minutes (300000 ms)
            if (timeUntilExpiry < 300000 && token.refreshToken && token.email) {
              try {
                const refreshed = await refreshTokens(
                  token.refreshToken as string,
                  token.email as string
                );
                
                // Update tokens
                token.accessToken = refreshed.accessToken;
                token.idToken = refreshed.idToken;
                token.refreshToken = refreshed.refreshToken;
                
                // Optionally refresh user data from backend
                try {
                  const userResponse = await fetch(`${API_URL}/api/users/me`, {
                    headers: {
                      Authorization: `Bearer ${refreshed.idToken}`,
                    },
                  });
                  
                  if (userResponse.ok) {
                    const userData = await userResponse.json();
                    token.role = userData.role;
                    token.memberId = userData.fraternity_member_id;
                    token.sellerId = userData.seller_id;
                    token.promoterId = userData.promoter_id;
                    token.stewardId = userData.steward_id;
                    token.features = userData.features || {};
                    token.name = userData.name;
                    token.onboarding_status = userData.onboarding_status;
                  }
                } catch (err) {
                  console.error('Error refreshing user data:', err);
                  // Continue with refreshed tokens even if user data refresh fails
                }
              } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
                // If refresh fails, token will be invalid and user will need to re-login
                // Return null to force re-authentication
                return null as any;
              }
            }
          }
        } catch (err) {
          console.error('Error checking token expiration:', err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).cognitoSub = token.cognitoSub as string;
        (session.user as any).role = token.role as string;
        (session.user as any).memberId = token.memberId as number | null;
        (session.user as any).sellerId = token.sellerId as number | null;
        (session.user as any).promoterId = token.promoterId as number | null;
        (session.user as any).stewardId = token.stewardId as number | null;
        (session.user as any).features = token.features as Record<string, any>;
        (session.user as any).name = token.name as string | null;
        (session.user as any).onboarding_status = token.onboarding_status as string;
        (session as any).accessToken = token.accessToken as string;
        (session as any).idToken = token.idToken as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

