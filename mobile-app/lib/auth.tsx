import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { API_URL } from './constants';

// Use actual AsyncStorage package
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'react-native-base64';

export interface User {
  id?: number;
  email?: string;
  role?: 'ADMIN' | 'SELLER' | 'PROMOTER' | 'GUEST' | 'STEWARD';
  memberId?: number | null;
  sellerId?: number | null;
  promoterId?: number | null;
  stewardId?: number | null;
  is_fraternity_member?: boolean;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
  name?: string | null;
  headshot_url?: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@1kappa:token';
const USER_KEY = '@1kappa:user';
const REFRESH_TOKEN_KEY = '@1kappa:refresh_token';
const REMEMBER_ME_KEY = '@1kappa:remember_me';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSession();
  }, []);

  const getSession = async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      const rememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);

      // If we have a token and user, use them
      if (storedToken && storedUser) {
          // Check if token is expired (basic check - decode JWT exp)
          try {
            const payload = JSON.parse(decode(storedToken.split('.')[1]));
          const expirationTime = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();
          
          // If token is expired or expires in less than 5 minutes, try to refresh
          if (expirationTime - now < 5 * 60 * 1000 && storedRefreshToken && rememberMe === 'true') {
            // Try to refresh token
            try {
              const refreshResponse = await fetch(`${API_URL}/api/members/cognito/refresh`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: storedRefreshToken }),
              });

              if (refreshResponse.ok) {
                const { tokens, user: refreshedUser } = await refreshResponse.json();
                
                // Store new tokens
                await AsyncStorage.setItem(TOKEN_KEY, tokens.idToken);
                await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken || storedRefreshToken);
                await AsyncStorage.setItem(USER_KEY, JSON.stringify({
                  ...refreshedUser,
                  is_fraternity_member: !!refreshedUser.memberId,
                  is_seller: !!refreshedUser.sellerId,
                  is_promoter: !!refreshedUser.promoterId,
                  is_steward: !!refreshedUser.stewardId,
                }));
                
                setToken(tokens.idToken);
                setUser({
                  ...refreshedUser,
                  is_fraternity_member: !!refreshedUser.memberId,
                  is_seller: !!refreshedUser.sellerId,
                  is_promoter: !!refreshedUser.promoterId,
                  is_steward: !!refreshedUser.stewardId,
                });
                return;
              }
            } catch (refreshError) {
              console.error('Error refreshing token:', refreshError);
              // Fall through to use stored token or clear
            }
          }
          
          // Token is still valid, use stored values
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (parseError) {
          // Token format invalid, clear everything
          await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, REFRESH_TOKEN_KEY]);
          setToken(null);
          setUser(null);
        }
      } else if (storedRefreshToken && rememberMe === 'true') {
        // No token but have refresh token and remember me is enabled - try to refresh
        try {
          const refreshResponse = await fetch(`${API_URL}/api/members/cognito/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
          });

          if (refreshResponse.ok) {
            const { tokens, user: refreshedUser } = await refreshResponse.json();
            
            // Store new tokens
            await AsyncStorage.setItem(TOKEN_KEY, tokens.idToken);
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken || storedRefreshToken);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify({
              ...refreshedUser,
              is_fraternity_member: !!refreshedUser.memberId,
              is_seller: !!refreshedUser.sellerId,
              is_promoter: !!refreshedUser.promoterId,
              is_steward: !!refreshedUser.stewardId,
            }));
            
            setToken(tokens.idToken);
            setUser({
              ...refreshedUser,
              is_fraternity_member: !!refreshedUser.memberId,
              is_seller: !!refreshedUser.sellerId,
              is_promoter: !!refreshedUser.promoterId,
              is_steward: !!refreshedUser.stewardId,
            });
            return;
          }
        } catch (refreshError) {
          console.error('Error refreshing token on session load:', refreshError);
          // Clear invalid refresh token
          await AsyncStorage.multiRemove([REFRESH_TOKEN_KEY, REMEMBER_ME_KEY]);
        }
      }
      
      // No valid session
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error getting session:', error);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Import Cognito service
      let cognitoModule;
      try {
        cognitoModule = await import('./cognito');
      } catch (importError: any) {
        console.error('Failed to import Cognito module:', importError);
        throw new Error('Cognito authentication not available. Please ensure amazon-cognito-identity-js is properly installed and configured.');
      }
      
      if (!cognitoModule || !cognitoModule.signIn) {
        throw new Error('Cognito signIn function not available. Please check your Cognito configuration.');
      }
      
      const { signIn } = cognitoModule;
      
      // Authenticate with Cognito directly
      const { tokens, user } = await signIn(email, password);
      
      // Store tokens and user info
      await AsyncStorage.setItem(TOKEN_KEY, tokens.idToken);
      if (tokens.refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
      await AsyncStorage.setItem(USER_KEY, JSON.stringify({
        ...user,
        is_fraternity_member: !!user.memberId,
        is_seller: !!user.sellerId,
        is_promoter: !!user.promoterId,
        is_steward: !!user.stewardId,
      }));
      
      // Update state
      setToken(tokens.idToken);
      setUser({
        ...user,
        is_fraternity_member: !!user.memberId,
        is_seller: !!user.sellerId,
        is_promoter: !!user.promoterId,
        is_steward: !!user.stewardId,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      // If Cognito service is not available, fall back to error message
      if (error.message?.includes('not yet implemented') || error.message?.includes('Failed to fetch')) {
        throw new Error('Authentication not yet implemented. Please use the web app to login.');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Cognito if user email exists
      if (user?.email) {
        try {
          const { signOut } = await import('./cognito');
          await signOut(user.email);
        } catch (error) {
          // Continue with local logout even if Cognito signout fails
          console.debug('Cognito signout error (continuing with local logout):', error);
        }
      }
      
      // Clear local storage
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, REFRESH_TOKEN_KEY]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !!token,
    isLoading,
    isGuest: !user && !isLoading,
    token,
    login,
    logout,
    getSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

