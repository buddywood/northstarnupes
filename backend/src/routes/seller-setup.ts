import { Router, Request, Response } from 'express';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { z } from 'zod';
import { getSellerByInvitationToken, createUser, linkUserToSeller, updateSellerInvitationToken, getUserByEmail } from '../db/queries';

const router = Router();

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

const sellerSetupSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

// Validate invitation token
router.get('/validate/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }

    const seller = await getSellerByInvitationToken(token);
    
    if (!seller) {
      return res.status(404).json({ 
        error: 'Invalid or expired invitation token',
        code: 'INVALID_TOKEN'
      });
    }

    res.json({
      valid: true,
      seller: {
        email: seller.email,
        name: seller.name,
      },
    });
  } catch (error) {
    console.error('Error validating invitation token:', error);
    res.status(500).json({ error: 'Failed to validate invitation token' });
  }
});

// Complete seller account setup
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const body = sellerSetupSchema.parse(req.body);
    
    // Validate token and get seller
    const seller = await getSellerByInvitationToken(body.token);
    
    if (!seller) {
      return res.status(404).json({ 
        error: 'Invalid or expired invitation token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(seller.email);
    if (existingUser) {
      return res.status(400).json({ 
        error: 'An account with this email already exists. Please log in instead.',
        code: 'USER_ALREADY_EXISTS'
      });
    }

    // Create Cognito user using AdminCreateUser (no email verification needed)
    try {
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: seller.email,
        UserAttributes: [
          { Name: 'email', Value: seller.email },
          { Name: 'email_verified', Value: 'true' },
        ],
        MessageAction: 'SUPPRESS', // Don't send welcome email
      });

      await cognitoClient.send(createUserCommand);

      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: seller.email,
        Password: body.password,
        Permanent: true,
      });

      await cognitoClient.send(setPasswordCommand);

      // Get the Cognito user sub (we need to fetch it)
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: seller.email,
      });
      const cognitoUser = await cognitoClient.send(getUserCommand);
      const cognitoSub = cognitoUser.UserAttributes?.find(
        attr => attr.Name === 'sub'
      )?.Value;

      if (!cognitoSub) {
        throw new Error('Failed to get Cognito user sub');
      }

      // Create user record with SELLER role
      const user = await createUser({
        cognito_sub: cognitoSub,
        email: seller.email,
        role: 'SELLER',
        onboarding_status: 'ONBOARDING_FINISHED',
        seller_id: seller.id,
      });

      // Clear invitation token
      await updateSellerInvitationToken(seller.id, null);

      res.json({
        success: true,
        message: 'Seller account created successfully',
        user: {
          email: seller.email,
          name: seller.name,
        },
      });
    } catch (cognitoError: any) {
      console.error('Cognito error:', cognitoError);
      
      if (cognitoError.name === 'UsernameExistsException') {
        return res.status(400).json({ 
          error: 'An account with this email already exists',
          code: 'USER_ALREADY_EXISTS'
        });
      }
      
      throw cognitoError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error completing seller setup:', error);
    res.status(500).json({ error: 'Failed to complete seller account setup' });
  }
});

export default router;

