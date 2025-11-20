import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import pool from '../db/connection';
import { uploadToS3 } from '../services/s3';
import { sendWelcomeEmail } from '../services/email';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand, AdminGetUserCommand, AdminConfirmSignUpCommand, ResendConfirmationCodeCommand, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getUserByCognitoSub, createUser, linkUserToMember, updateUserOnboardingStatusByCognitoSub } from '../db/queries';

const router: ExpressRouter = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for headshots
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
});

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

// Cognito SignUp endpoint
router.post('/cognito/signup', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists in Cognito
    try {
      const listUsersCommand = new ListUsersCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Filter: `email = "${email}"`,
        Limit: 1,
      });
      const existingUsers = await cognitoClient.send(listUsersCommand);
      
      if (existingUsers.Users && existingUsers.Users.length > 0) {
        const existingUser = existingUsers.Users[0];
        const userStatus = existingUser.UserStatus;
        
        // If user exists but is unconfirmed, we can resend the code
        if (userStatus === 'UNCONFIRMED') {
          // Try to resend confirmation code
          try {
            const resendCommand = new ResendConfirmationCodeCommand({
              ClientId: COGNITO_CLIENT_ID,
              Username: email,
            });
            const resendResponse = await cognitoClient.send(resendCommand);
            
            return res.status(200).json({
              userSub: existingUser.Username,
              codeDeliveryDetails: resendResponse.CodeDeliveryDetails,
              message: 'Verification code resent to your email',
              existingUser: true,
            });
          } catch (resendError: any) {
            console.error('Error resending confirmation code:', resendError);
            // Fall through to return error
          }
        }
        
        // User exists and is confirmed or in another state
        return res.status(400).json({ 
          error: 'An account with this email already exists',
          code: 'USER_ALREADY_EXISTS',
          userStatus: userStatus,
        });
      }
    } catch (checkError: any) {
      // If checking fails, continue with signup attempt
      console.log('Could not check for existing user, proceeding with signup:', checkError.message);
    }

    // User doesn't exist, proceed with signup
    const command = new SignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
      ],
    });

    const response = await cognitoClient.send(command);
    
    res.json({
      userSub: response.UserSub,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    });
  } catch (error: any) {
    console.error('Cognito SignUp error:', error);
    if (error.name === 'UsernameExistsException') {
      // Double-check the user status
      try {
        const listUsersCommand = new ListUsersCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Filter: `email = "${req.body.email}"`,
          Limit: 1,
        });
        const existingUsers = await cognitoClient.send(listUsersCommand);
        
        if (existingUsers.Users && existingUsers.Users.length > 0) {
          const existingUser = existingUsers.Users[0];
          const userStatus = existingUser.UserStatus;
          
          if (userStatus === 'UNCONFIRMED') {
            // Try to resend confirmation code
            try {
              const resendCommand = new ResendConfirmationCodeCommand({
                ClientId: COGNITO_CLIENT_ID,
                Username: req.body.email,
              });
              const resendResponse = await cognitoClient.send(resendCommand);
              
              return res.status(200).json({
                userSub: existingUser.Username,
                codeDeliveryDetails: resendResponse.CodeDeliveryDetails,
                message: 'Verification code resent to your email',
                existingUser: true,
              });
            } catch (resendError: any) {
              console.error('Error resending confirmation code:', resendError);
            }
          }
        }
      } catch (checkError) {
        console.error('Error checking user status:', checkError);
      }
      
      return res.status(400).json({ 
        error: 'An account with this email already exists',
        code: 'USER_ALREADY_EXISTS'
      });
    }
    res.status(400).json({ 
      error: error.message || 'Failed to create account'
    });
  }
});

// Cognito ConfirmSignUp endpoint
router.post('/cognito/verify', async (req: Request, res: Response) => {
  try {
    const { email, code, cognito_sub } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // First, check if user is already confirmed
    let userStatus = 'UNKNOWN';
    try {
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: email,
      });
      const userDetails = await cognitoClient.send(getUserCommand);
      userStatus = userDetails.UserStatus || 'UNKNOWN';
      console.log(`📋 User ${email} current status: ${userStatus}`);
      
      // If already confirmed, we can skip the confirmation step
      if (userStatus === 'CONFIRMED') {
        console.log(`✅ User ${email} is already confirmed, skipping confirmation`);
        // Still update our database status
        if (cognito_sub) {
          try {
            let user = await getUserByCognitoSub(cognito_sub);
            if (!user) {
              await createUser({
                cognito_sub: cognito_sub,
                email: email,
                role: 'CONSUMER',
                onboarding_status: 'COGNITO_CONFIRMED',
              });
            } else {
              await updateUserOnboardingStatusByCognitoSub(cognito_sub, 'COGNITO_CONFIRMED');
            }
          } catch (err: any) {
            console.error('Error updating user onboarding status:', err);
          }
        }
        return res.json({ success: true, alreadyConfirmed: true });
      }
    } catch (statusError: any) {
      if (statusError.name !== 'UserNotFoundException') {
        console.error('Error checking user status before confirmation:', statusError);
      }
      // Continue with confirmation attempt
    }

    // Attempt to confirm with the verification code
    const command = new ConfirmSignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });

    console.log(`🔐 Attempting to confirm Cognito user: ${email}`);
    let confirmationSucceeded = false;
    try {
      const response = await cognitoClient.send(command);
      console.log(`✅ ConfirmSignUpCommand succeeded for: ${email}`, response);
      confirmationSucceeded = true;
    } catch (confirmError: any) {
      // If the error is that the user is already confirmed, that's okay
      if (confirmError.name === 'NotAuthorizedException' && confirmError.message?.includes('already confirmed')) {
        console.log(`ℹ️ User ${email} is already confirmed (from error message)`);
        confirmationSucceeded = true;
        userStatus = 'CONFIRMED';
      } else if (confirmError.name === 'CodeMismatchException') {
        console.error(`❌ Invalid verification code for ${email}`);
        return res.status(400).json({ 
          error: 'Invalid verification code. Please check your email and try again.',
          code: 'CodeMismatchException'
        });
      } else if (confirmError.name === 'ExpiredCodeException') {
        console.error(`❌ Expired verification code for ${email}`);
        return res.status(400).json({ 
          error: 'Verification code has expired. Please request a new code.',
          code: 'ExpiredCodeException'
        });
      } else {
        // For other errors, check if user is actually confirmed
        console.error(`⚠️ ConfirmSignUpCommand failed for ${email}:`, confirmError.name, confirmError.message);
        try {
          const getUserCommand = new AdminGetUserCommand({
            UserPoolId: COGNITO_USER_POOL_ID,
            Username: email,
          });
          const userDetails = await cognitoClient.send(getUserCommand);
          userStatus = userDetails.UserStatus || 'UNKNOWN';
          if (userStatus === 'CONFIRMED') {
            console.log(`✅ User ${email} is actually confirmed despite error`);
            confirmationSucceeded = true;
          }
        } catch (checkError: any) {
          // If we can't check, throw the original error
          throw confirmError;
        }
        
        if (!confirmationSucceeded) {
          throw confirmError;
        }
      }
    }
    
    // Verify the user is actually confirmed by checking their status
    if (confirmationSucceeded) {
      try {
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: COGNITO_USER_POOL_ID,
          Username: email,
        });
        const userDetails = await cognitoClient.send(getUserCommand);
        userStatus = userDetails.UserStatus || 'UNKNOWN';
        console.log(`📋 User status after confirmation: ${userStatus} for ${email}`);
        
        if (userStatus !== 'CONFIRMED') {
          console.warn(`⚠️ Warning: User ${email} status is ${userStatus}, not CONFIRMED after verification`);
          // Use AdminConfirmSignUpCommand as a fallback to force confirmation
          console.log(`🔄 Attempting to force confirm user ${email} using AdminConfirmSignUpCommand`);
          try {
            const adminConfirmCommand = new AdminConfirmSignUpCommand({
              UserPoolId: COGNITO_USER_POOL_ID,
              Username: email,
            });
            await cognitoClient.send(adminConfirmCommand);
            console.log(`✅ Successfully force-confirmed user ${email}`);
            
            // Verify again
            const verifyCommand = new AdminGetUserCommand({
              UserPoolId: COGNITO_USER_POOL_ID,
              Username: email,
            });
            const verifiedUser = await cognitoClient.send(verifyCommand);
            if (verifiedUser.UserStatus === 'CONFIRMED') {
              console.log(`✅ Verified: User ${email} is now CONFIRMED`);
            }
          } catch (adminConfirmError: any) {
            console.error(`❌ Failed to force-confirm user ${email}:`, adminConfirmError.message);
            return res.status(500).json({ 
              error: 'Account verification completed but status check failed. Please try logging in or contact support.',
              code: 'VERIFICATION_STATUS_ERROR'
            });
          }
        }
      } catch (statusError: any) {
        console.error('Error checking user status after confirmation:', statusError);
        // Continue anyway - the confirmation might have succeeded
      }
    }
    
    // Create or update user onboarding status to COGNITO_CONFIRMED if cognito_sub is provided
    if (cognito_sub) {
      try {
        let user = await getUserByCognitoSub(cognito_sub);
        if (!user) {
          // Create user record with COGNITO_CONFIRMED status
          await createUser({
            cognito_sub: cognito_sub,
            email: email,
            role: 'CONSUMER',
            onboarding_status: 'COGNITO_CONFIRMED',
          });
        } else {
          // Update existing user status
          await updateUserOnboardingStatusByCognitoSub(cognito_sub, 'COGNITO_CONFIRMED');
        }
      } catch (err: any) {
        console.error('Error creating/updating user onboarding status:', err);
        console.error('Error details:', {
          message: err.message,
          code: err.code,
          detail: err.detail,
          constraint: err.constraint,
        });
        // Continue anyway - user creation is not critical for verification
        // But log the error so we can debug
      }
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Cognito ConfirmSignUp error:', error);
    res.status(400).json({ 
      error: error.name === 'CodeMismatchException'
        ? 'Invalid verification code'
        : error.message || 'Failed to verify account'
    });
  }
});

// Forgot Password endpoint
router.post('/cognito/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const command = new ForgotPasswordCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
    });

    const response = await cognitoClient.send(command);
    
    res.json({ 
      success: true,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    });
  } catch (error: any) {
    console.error('Cognito ForgotPassword error:', error);
    
    // Check if user exists but email is not verified
    if (error.name === 'InvalidParameterException' && 
        error.message?.includes('no registered/verified email')) {
      // Try to check if user exists
      try {
        const adminGetUserCommand = new AdminGetUserCommand({
          UserPoolId: COGNITO_USER_POOL_ID,
          Username: req.body.email,
        });
        await cognitoClient.send(adminGetUserCommand);
        
        // User exists but email not verified
        return res.status(400).json({ 
          error: 'Your email address has not been verified. Please verify your email first or request a new verification code.',
          code: 'EMAIL_NOT_VERIFIED',
          canResendCode: true
        });
      } catch (adminError: any) {
        if (adminError.name === 'UserNotFoundException') {
          return res.status(400).json({ 
            error: 'No account found with this email address'
          });
        }
      }
    }
    
    res.status(400).json({ 
      error: error.name === 'UserNotFoundException'
        ? 'No account found with this email address'
        : error.message || 'Failed to send password reset code'
    });
  }
});

// Resend verification code endpoint
router.post('/cognito/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const command = new ResendConfirmationCodeCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
    });

    const response = await cognitoClient.send(command);
    
    res.json({ 
      success: true,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    });
  } catch (error: any) {
    console.error('Cognito ResendConfirmationCode error:', error);
    res.status(400).json({ 
      error: error.name === 'UserNotFoundException'
        ? 'No account found with this email address'
        : error.name === 'InvalidParameterException'
        ? 'This account may already be verified or does not exist'
        : error.message || 'Failed to resend verification code'
    });
  }
});

// Confirm Forgot Password endpoint
router.post('/cognito/confirm-forgot-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const command = new ConfirmForgotPasswordCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    await cognitoClient.send(command);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Cognito ConfirmForgotPassword error:', error);
    res.status(400).json({ 
      error: error.name === 'CodeMismatchException'
        ? 'Invalid verification code'
        : error.name === 'ExpiredCodeException'
        ? 'Verification code has expired. Please request a new one.'
        : error.message || 'Failed to reset password'
    });
  }
});

// Helper function to build update fields for draft member updates
function buildDraftUpdateFields(
  parsedData: any,
  headshotUrl: string | undefined,
  options: { updateCognitoSub?: boolean; cognitoSub?: string; updateEmail?: boolean; email?: string }
): { updateFields: string[]; values: any[]; paramCount: number } {
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  // Update cognito_sub if requested
  if (options.updateCognitoSub && options.cognitoSub) {
    updateFields.push(`cognito_sub = $${paramCount}`);
    values.push(options.cognitoSub);
    paramCount++;
  }

  // Update email if requested
  if (options.updateEmail && options.email) {
    updateFields.push(`email = $${paramCount}`);
    values.push(options.email);
    paramCount++;
  }

  // Update fields with consistent logic
  if (parsedData.name) {
    updateFields.push(`name = $${paramCount}`);
    values.push(parsedData.name);
    paramCount++;
  }
  if (parsedData.membership_number) {
    updateFields.push(`membership_number = $${paramCount}`);
    values.push(parsedData.membership_number);
    paramCount++;
  }
  if (parsedData.initiated_chapter_id) {
    updateFields.push(`initiated_chapter_id = $${paramCount}`);
    values.push(parsedData.initiated_chapter_id);
    paramCount++;
  }
  if (parsedData.initiated_season !== undefined) {
    updateFields.push(`initiated_season = $${paramCount}`);
    values.push(parsedData.initiated_season);
    paramCount++;
  }
  if (parsedData.initiated_year !== undefined) {
    updateFields.push(`initiated_year = $${paramCount}`);
    values.push(parsedData.initiated_year);
    paramCount++;
  }
  if (parsedData.ship_name !== undefined) {
    updateFields.push(`ship_name = $${paramCount}`);
    values.push(parsedData.ship_name);
    paramCount++;
  }
  if (parsedData.line_name !== undefined) {
    updateFields.push(`line_name = $${paramCount}`);
    values.push(parsedData.line_name);
    paramCount++;
  }
  if (parsedData.location !== undefined) {
    updateFields.push(`location = $${paramCount}`);
    values.push(parsedData.location);
    paramCount++;
  }
  if (parsedData.address !== undefined && parsedData.address !== null && parsedData.address !== '') {
    updateFields.push(`address = $${paramCount}`);
    values.push(parsedData.address);
    paramCount++;
  }
  // Always update address_is_private if provided (handles both true and false)
  if (parsedData.address_is_private !== undefined) {
    updateFields.push(`address_is_private = $${paramCount}`);
    values.push(parsedData.address_is_private);
    paramCount++;
  }
  if (parsedData.phone_number !== undefined) {
    updateFields.push(`phone_number = $${paramCount}`);
    values.push(parsedData.phone_number);
    paramCount++;
  }
  // Always update phone_is_private if provided (handles both true and false)
  if (parsedData.phone_is_private !== undefined) {
    updateFields.push(`phone_is_private = $${paramCount}`);
    values.push(parsedData.phone_is_private);
    paramCount++;
  }
  if (parsedData.industry !== undefined) {
    updateFields.push(`industry = $${paramCount}`);
    values.push(parsedData.industry);
    paramCount++;
  }
  if (parsedData.job_title !== undefined) {
    updateFields.push(`job_title = $${paramCount}`);
    values.push(parsedData.job_title);
    paramCount++;
  }
  if (parsedData.bio !== undefined) {
    updateFields.push(`bio = $${paramCount}`);
    values.push(parsedData.bio);
    paramCount++;
  }
  if (headshotUrl) {
    updateFields.push(`headshot_url = $${paramCount}`);
    values.push(headshotUrl);
    paramCount++;
  }
  if (parsedData.social_links) {
    updateFields.push(`social_links = $${paramCount}::jsonb`);
    values.push(JSON.stringify(parsedData.social_links));
    paramCount++;
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

  return { updateFields, values, paramCount };
}

// Save draft registration progress (incremental saves after Step 1)
router.post('/draft', upload.single('headshot'), async (req: Request, res: Response) => {
  try {
    const { cognito_sub, email } = req.body;

    if (!cognito_sub) {
      return res.status(400).json({ error: 'Cognito sub is required' });
    }

    // Check if draft already exists by cognito_sub, email, or membership_number
    // Parse membership_number from body if available
    const membershipNumber = req.body.membership_number;
    let existingDraft;
    if (membershipNumber) {
      existingDraft = await pool.query(
        'SELECT id, cognito_sub, registration_status FROM fraternity_members WHERE cognito_sub = $1 OR email = $2 OR (membership_number = $3 AND registration_status = \'DRAFT\')',
        [cognito_sub, email, membershipNumber]
      );
    } else {
      existingDraft = await pool.query(
        'SELECT id, cognito_sub, registration_status FROM fraternity_members WHERE cognito_sub = $1 OR email = $2',
        [cognito_sub, email]
      );
    }

    // Upload headshot to S3 if provided
    let headshotUrl: string | undefined;
    if (req.file) {
      // Validate image dimensions
      try {
        // Use dynamic import for image-size
        const { default: sizeOf } = await import('image-size');
        const dimensions = sizeOf(req.file.buffer);
        const MIN_DIMENSION = 200;
        const MAX_DIMENSION = 2000;

        if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
          return res.status(400).json({ 
            error: `Image is too small. Minimum dimensions are ${MIN_DIMENSION}x${MIN_DIMENSION} pixels.` 
          });
        }

        if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
          return res.status(400).json({ 
            error: `Image is too large. Maximum dimensions are ${MAX_DIMENSION}x${MAX_DIMENSION} pixels.` 
          });
        }
      } catch (err) {
        return res.status(400).json({ error: 'Invalid image file. Please upload a valid image.' });
      }

      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'headshots'
      );
      headshotUrl = uploadResult.url;
    }

    // Parse form data
    const parsedData: any = {
      ...req.body,
      initiated_chapter_id: req.body.initiated_chapter_id ? parseInt(req.body.initiated_chapter_id) : null,
      initiated_season: req.body.initiated_season || null,
      initiated_year: req.body.initiated_year ? parseInt(req.body.initiated_year) : null,
      // Convert string 'true'/'false' to boolean, or keep boolean as-is, or undefined if not provided
      address_is_private: req.body.address_is_private !== undefined 
        ? (req.body.address_is_private === 'true' || req.body.address_is_private === true)
        : undefined,
      phone_is_private: req.body.phone_is_private !== undefined
        ? (req.body.phone_is_private === 'true' || req.body.phone_is_private === true)
        : undefined,
      social_links: req.body.social_links ? JSON.parse(req.body.social_links) : {},
    };

    if (existingDraft.rows.length > 0) {
      // Update existing draft
      // Filter to only DRAFT records, or if none found, use the first one
      const draftRecords = existingDraft.rows.filter((row: any) => row.registration_status === 'DRAFT');
      const existingMember = draftRecords.length > 0 
        ? (draftRecords.find((row: any) => row.cognito_sub === cognito_sub) || draftRecords.find((row: any) => row.email === email) || draftRecords[0])
        : existingDraft.rows[0];
      
      // Use the existing member's ID for the WHERE clause
      const whereId = existingMember.id;
      
      // Build update fields using helper function
      const { updateFields, values, paramCount } = buildDraftUpdateFields(
        parsedData,
        headshotUrl,
        {
          updateCognitoSub: existingMember.cognito_sub !== cognito_sub,
          cognitoSub: cognito_sub,
        }
      );

      // Use ID for WHERE clause to ensure we update the correct record
      values.push(whereId);
      const whereClause = `WHERE id = $${paramCount}`;

      const result = await pool.query(
        `UPDATE fraternity_members SET ${updateFields.join(', ')} ${whereClause} RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } else {
      // Create new draft (requires at least email and cognito_sub)
      if (!email) {
        return res.status(400).json({ error: 'Email is required for new draft' });
      }

      // Check if a draft with this membership_number already exists (for a different cognito_sub)
      // If so, we should update that draft instead of creating a duplicate
      if (parsedData.membership_number) {
        const existingDraftByMembership = await pool.query(
          `SELECT id FROM fraternity_members 
           WHERE membership_number = $1 
           AND registration_status = 'DRAFT'`,
          [parsedData.membership_number]
        );
        
        if (existingDraftByMembership.rows.length > 0) {
          // Update the existing draft instead of creating a new one
          const existingDraftId = existingDraftByMembership.rows[0].id;
          
          // Build update fields using helper function
          const { updateFields, values, paramCount } = buildDraftUpdateFields(
            parsedData,
            headshotUrl,
            {
              updateCognitoSub: !!cognito_sub,
              cognitoSub: cognito_sub,
              updateEmail: true,
              email: email,
            }
          );
          
          values.push(existingDraftId);
          const whereClause = `WHERE id = $${paramCount}`;
          
          const result = await pool.query(
            `UPDATE fraternity_members SET ${updateFields.join(', ')} ${whereClause} RETURNING *`,
            values
          );
          
          res.json(result.rows[0]);
          return;
        }
      }

      // Build dynamic INSERT query - only include fields that have values
      const fields: string[] = ['email', 'cognito_sub', 'registration_status'];
      const values: any[] = [email, cognito_sub, 'DRAFT'];
      let paramCount = 3;

      // Only add fields that have actual values (not null/empty)
      if (parsedData.name) {
        fields.push('name');
        values.push(parsedData.name);
        paramCount++;
      }
      if (parsedData.membership_number) {
        fields.push('membership_number');
        values.push(parsedData.membership_number);
        paramCount++;
      }
      if (parsedData.initiated_chapter_id) {
        fields.push('initiated_chapter_id');
        values.push(parsedData.initiated_chapter_id);
        paramCount++;
      }
      if (parsedData.initiated_season) {
        fields.push('initiated_season');
        values.push(parsedData.initiated_season);
        paramCount++;
      }
      if (parsedData.initiated_year) {
        fields.push('initiated_year');
        values.push(parsedData.initiated_year);
        paramCount++;
      }
      if (parsedData.ship_name) {
        fields.push('ship_name');
        values.push(parsedData.ship_name);
        paramCount++;
      }
      if (parsedData.line_name) {
        fields.push('line_name');
        values.push(parsedData.line_name);
        paramCount++;
      }
      if (parsedData.location) {
        fields.push('location');
        values.push(parsedData.location);
        paramCount++;
      }
      if (parsedData.address !== undefined && parsedData.address !== null && parsedData.address !== '') {
        fields.push('address');
        values.push(parsedData.address);
        paramCount++;
      }
      fields.push('address_is_private');
      values.push(parsedData.address_is_private || false);
      paramCount++;
      if (parsedData.phone_number) {
        fields.push('phone_number');
        values.push(parsedData.phone_number);
        paramCount++;
      }
      fields.push('phone_is_private');
      values.push(parsedData.phone_is_private || false);
      paramCount++;
      if (parsedData.industry) {
        fields.push('industry');
        values.push(parsedData.industry);
        paramCount++;
      }
      if (parsedData.job_title) {
        fields.push('job_title');
        values.push(parsedData.job_title);
        paramCount++;
      }
      if (parsedData.bio) {
        fields.push('bio');
        values.push(parsedData.bio);
        paramCount++;
      }
      if (headshotUrl) {
        fields.push('headshot_url');
        values.push(headshotUrl);
        paramCount++;
      }
      fields.push('social_links');
      values.push(JSON.stringify(parsedData.social_links || {}));
      paramCount++;

      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO fraternity_members (${fields.join(', ')})
         VALUES (${placeholders})
         RETURNING *`,
        values
      );

      // Update user onboarding status to ONBOARDING_STARTED when they start filling out the form
      if (cognito_sub) {
        try {
          await updateUserOnboardingStatusByCognitoSub(cognito_sub, 'ONBOARDING_STARTED');
        } catch (err) {
          // User might not exist yet, that's okay
          console.log('User not found for onboarding status update:', err);
        }
      }

      res.json(result.rows[0]);
    }
  } catch (error: any) {
    // Log technical details to console
    console.error('Error saving draft:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
      body: req.body,
    });

    // Provide user-friendly error messages
    let userMessage = 'Unable to save your progress. Please try again.';
    let statusCode = 500;

    if (error.code === '23505') {
      // Unique constraint violation
      userMessage = 'This email is already registered. Please use a different email or contact support if you believe this is an error.';
      statusCode = 409;
    } else if (error.code === '23503') {
      // Foreign key constraint violation
      userMessage = 'Invalid information provided. Please check your chapter selection and try again.';
      statusCode = 400;
    } else if (error.code === '23502') {
      // Not null constraint violation
      userMessage = 'Some required information is missing. Please fill in all required fields.';
      statusCode = 400;
    } else if (error.code === '42P18') {
      // Could not determine data type
      userMessage = 'There was an issue processing your information. Please refresh the page and try again.';
      statusCode = 400;
    } else if (error.message?.includes('duplicate key')) {
      userMessage = 'This information is already in use. Please check your details and try again.';
      statusCode = 409;
    } else if (error.message?.includes('constraint')) {
      userMessage = 'Some of the information provided is invalid. Please review your entries and try again.';
      statusCode = 400;
    }

    res.status(statusCode).json({ error: userMessage });
  }
});

// Get draft registration by cognito_sub
router.get('/draft/:cognitoSub', async (req: Request, res: Response) => {
  try {
    const { cognitoSub } = req.params;

    const result = await pool.query(
      'SELECT * FROM fraternity_members WHERE cognito_sub = $1 AND registration_status = $2',
      [cognitoSub, 'DRAFT']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const member = result.rows[0];
    if (member.social_links && typeof member.social_links === 'string') {
      member.social_links = JSON.parse(member.social_links);
    }

    res.json(member);
  } catch (error: any) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
});

const memberRegistrationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  membership_number: z.string().min(1),
  cognito_sub: z.string().optional(), // Cognito user ID
  initiated_chapter_id: z.number().int().positive(),
  initiated_season: z.string().optional().nullable(),
  initiated_year: z.number().int().positive().optional().nullable(),
  ship_name: z.string().optional().nullable(),
  line_name: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  address_is_private: z.boolean().default(false),
  phone_number: z.string().optional().nullable(),
  phone_is_private: z.boolean().default(false),
  industry: z.string().optional().nullable(),
  profession_id: z.number().int().positive().optional().nullable(),
  job_title: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  social_links: z.record(z.string()).optional(),
});

router.post('/register', upload.single('headshot'), async (req: Request, res: Response) => {
  try {
    // Helper to convert empty strings to null
    const toNullIfEmpty = (value: any) => {
      if (value === undefined || value === null || value === '') return null;
      return value;
    };

    // Parse form data first
    const parsedBody = {
      ...req.body,
      initiated_chapter_id: parseInt(req.body.initiated_chapter_id),
      initiated_season: toNullIfEmpty(req.body.initiated_season),
      initiated_year: req.body.initiated_year && req.body.initiated_year !== '' 
        ? parseInt(req.body.initiated_year) 
        : null,
      ship_name: toNullIfEmpty(req.body.ship_name),
      line_name: toNullIfEmpty(req.body.line_name),
      location: toNullIfEmpty(req.body.location),
      address: toNullIfEmpty(req.body.address),
      phone_number: toNullIfEmpty(req.body.phone_number),
      industry: toNullIfEmpty(req.body.industry),
      profession_id: req.body.profession_id && req.body.profession_id !== '' 
        ? parseInt(req.body.profession_id) 
        : null,
      job_title: toNullIfEmpty(req.body.job_title),
      bio: toNullIfEmpty(req.body.bio),
      address_is_private: req.body.address_is_private === 'true' || req.body.address_is_private === true,
      phone_is_private: req.body.phone_is_private === 'true' || req.body.phone_is_private === true,
      social_links: req.body.social_links ? JSON.parse(req.body.social_links) : {},
      cognito_sub: toNullIfEmpty(req.body.cognito_sub),
    };

    // Validate request body
    const body = memberRegistrationSchema.parse(parsedBody);

    // Check if draft exists first (before duplicate check)
    // Only check if cognito_sub is provided
    let existingDraft = { rows: [] };
    let existingHeadshotUrl: string | null = null;
    if (body.cognito_sub) {
      existingDraft = await pool.query(
        'SELECT id, registration_status, headshot_url FROM fraternity_members WHERE cognito_sub = $1',
        [body.cognito_sub]
      );
      if (existingDraft.rows.length > 0) {
        existingHeadshotUrl = (existingDraft.rows[0] as { headshot_url: string | null }).headshot_url;
      }
    }

    // Check if member already exists (excluding DRAFT records and the current user's draft)
    // This prevents duplicate registrations while allowing users to complete their own drafts
    // NOTE: Sellers can register as members, so we check if they already have a member profile linked
    let existingMemberQuery;
    let existingMemberParams;
    let existingSeller: { id: number; fraternity_member_id: number | null } | null = null;
    
    // Check if user is already a seller (sellers can register as members)
    const sellerCheck = await pool.query(
      'SELECT id, fraternity_member_id FROM sellers WHERE email = $1',
      [body.email]
    );
    
    if (sellerCheck.rows.length > 0) {
      existingSeller = sellerCheck.rows[0];
      // If seller already has a member profile, block registration
      if (existingSeller.fraternity_member_id) {
        return res.status(400).json({ 
          error: 'You already have a member profile linked to your seller account' 
        });
      }
      // Otherwise, allow registration and we'll link it after creation
    }
    
    if (body.cognito_sub) {
      // If cognito_sub exists, exclude this user's draft from the check
      // Check promoters by email, and check members by email or membership_number
      // Also check if membership_number is used by any seller or promoter through member_id
      // NOTE: We skip sellers check here since we already handled it above
      existingMemberQuery = `SELECT id FROM promoters WHERE email = $1 
       UNION 
       SELECT s.id FROM sellers s 
       INNER JOIN fraternity_members m ON s.fraternity_member_id = m.id 
       WHERE m.membership_number = $2
       UNION
       SELECT p.id FROM promoters p 
       INNER JOIN fraternity_members m ON p.fraternity_member_id = m.id 
       WHERE m.membership_number = $2
       UNION 
       SELECT id FROM fraternity_members 
       WHERE (email = $1 OR membership_number = $2) 
       AND registration_status != 'DRAFT' 
       AND (cognito_sub IS NULL OR cognito_sub != $3)`;
      existingMemberParams = [body.email, body.membership_number, body.cognito_sub];
    } else {
      // If no cognito_sub, check all non-DRAFT records
      // NOTE: We skip sellers check here since we already handled it above
      existingMemberQuery = `SELECT id FROM promoters WHERE email = $1 
       UNION 
       SELECT s.id FROM sellers s 
       INNER JOIN fraternity_members m ON s.fraternity_member_id = m.id 
       WHERE m.membership_number = $2
       UNION
       SELECT p.id FROM promoters p 
       INNER JOIN fraternity_members m ON p.fraternity_member_id = m.id 
       WHERE m.membership_number = $2
       UNION 
       SELECT id FROM fraternity_members 
       WHERE (email = $1 OR membership_number = $2) 
       AND registration_status != 'DRAFT'`;
      existingMemberParams = [body.email, body.membership_number];
    }
    
    const existingMember = await pool.query(existingMemberQuery, existingMemberParams);

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'A member with this email or membership number already exists' });
    }

    // Upload headshot to S3 if new file provided, otherwise preserve existing
    let headshotUrl: string | null = null;
    if (req.file) {
      // Validate image dimensions
      try {
        const { default: sizeOf } = await import('image-size');
        const dimensions = sizeOf(req.file.buffer);
        const MIN_DIMENSION = 200;
        const MAX_DIMENSION = 2000;

        if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
          return res.status(400).json({ 
            error: `Image is too small. Minimum dimensions are ${MIN_DIMENSION}x${MIN_DIMENSION} pixels.` 
          });
        }

        if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
          return res.status(400).json({ 
            error: `Image is too large. Maximum dimensions are ${MAX_DIMENSION}x${MAX_DIMENSION} pixels.` 
          });
        }
      } catch (err) {
        return res.status(400).json({ error: 'Invalid image file. Please upload a valid image.' });
      }

      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'headshots'
      );
      headshotUrl = uploadResult.url;
    } else if (existingHeadshotUrl) {
      // Preserve existing headshot URL if no new file uploaded
      headshotUrl = existingHeadshotUrl;
    }

    // Use existingDraft from earlier check
    let result;
    if (existingDraft.rows.length > 0) {
      // Update existing draft to complete
      result = await pool.query(
        `UPDATE fraternity_members SET
          name = $1, email = $2, membership_number = $3, initiated_chapter_id = $4,
          initiated_season = $5, initiated_year = $6, ship_name = $7, line_name = $8,
          location = $9, address = $10, address_is_private = $11, phone_number = $12, phone_is_private = $13,
          industry = $14, profession_id = $15, job_title = $16, bio = $17, headshot_url = $18, social_links = $19,
          registration_status = 'COMPLETE', updated_at = CURRENT_TIMESTAMP
        WHERE cognito_sub = $20
        RETURNING *`,
        [
          body.name,
          body.email,
          body.membership_number,
          body.initiated_chapter_id,
          body.initiated_season, // Already converted to null if empty by toNullIfEmpty
          body.initiated_year, // Already converted to null if empty by toNullIfEmpty
          body.ship_name, // Already converted to null if empty by toNullIfEmpty
          body.line_name, // Already converted to null if empty by toNullIfEmpty
          body.location, // Already converted to null if empty by toNullIfEmpty
          body.address, // Already converted to null if empty by toNullIfEmpty
          body.address_is_private,
          body.phone_number, // Already converted to null if empty by toNullIfEmpty
          body.phone_is_private,
          body.industry, // Already converted to null if empty by toNullIfEmpty
          body.profession_id, // Already converted to null if empty
          body.job_title, // Already converted to null if empty by toNullIfEmpty
          body.bio, // Already converted to null if empty by toNullIfEmpty
          headshotUrl,
          JSON.stringify(body.social_links || {}),
          body.cognito_sub,
        ]
      );
    } else {
      // Create new complete registration
      result = await pool.query(
        `INSERT INTO fraternity_members (
          name, email, membership_number, cognito_sub, initiated_chapter_id,
          initiated_season, initiated_year, ship_name, line_name,
          location, address, address_is_private, phone_number, phone_is_private,
          industry, profession_id, job_title, bio, headshot_url, social_links, registration_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *`,
        [
          body.name,
          body.email,
          body.membership_number,
          body.cognito_sub || null,
          body.initiated_chapter_id,
          body.initiated_season, // Already converted to null if empty by toNullIfEmpty
          body.initiated_year, // Already converted to null if empty by toNullIfEmpty
          body.ship_name, // Already converted to null if empty by toNullIfEmpty
          body.line_name, // Already converted to null if empty by toNullIfEmpty
          body.location, // Already converted to null if empty by toNullIfEmpty
          body.address, // Already converted to null if empty by toNullIfEmpty
          body.address_is_private,
          body.phone_number, // Already converted to null if empty by toNullIfEmpty
          body.phone_is_private,
          body.industry, // Already converted to null if empty by toNullIfEmpty
          body.profession_id, // Already converted to null if empty
          body.job_title, // Already converted to null if empty by toNullIfEmpty
          body.bio, // Already converted to null if empty by toNullIfEmpty
          headshotUrl,
          JSON.stringify(body.social_links || {}),
          'COMPLETE', // registration_status
        ]
      );
    }

    const member = result.rows[0];

    // If user is a seller, link the seller account to the member profile
    if (existingSeller && !existingSeller.fraternity_member_id) {
      try {
        await pool.query(
          'UPDATE sellers SET fraternity_member_id = $1 WHERE id = $2',
          [member.id, existingSeller.id]
        );
        console.log(`Linked seller ${existingSeller.id} to member ${member.id}`);
      } catch (sellerLinkError: any) {
        console.error('Error linking seller to member:', sellerLinkError);
        // Don't fail registration - seller can be linked later
      }
    }

    // Create or update user record and link to member
    // This is critical - if this fails, we have an orphaned member record
    // NOTE: If user is a seller, we don't change their role - they remain a SELLER
    // The seller's fraternity_member_id is set above, but the user's fraternity_member_id
    // must stay null due to SELLER role constraint. The seller table has the link.
    if (body.cognito_sub) {
      try {
        let user = await getUserByCognitoSub(body.cognito_sub);
        if (!user) {
          // Create new user record
          // If user is a seller, create with SELLER role, otherwise CONSUMER
          const userRole = existingSeller ? 'SELLER' : 'CONSUMER';
          user = await createUser({
            cognito_sub: body.cognito_sub,
            email: body.email,
            role: userRole,
            onboarding_status: 'ONBOARDING_FINISHED',
            fraternity_member_id: existingSeller ? null : member.id, // SELLER role constraint requires null
            seller_id: existingSeller ? existingSeller.id : null,
          });
        } else {
          // Link existing user to member and update onboarding status
          // If user is a seller, we can't set fraternity_member_id on user due to constraint
          // but the seller table already has it linked (done above)
          if (user.role === 'SELLER') {
            // For sellers, just update onboarding status - fraternity_member_id stays null on user
            // but is set on the seller table (done above)
            await updateUserOnboardingStatusByCognitoSub(body.cognito_sub, 'ONBOARDING_FINISHED');
          } else {
            // For non-sellers, link member normally
            await linkUserToMember(user.id, member.id);
            await updateUserOnboardingStatusByCognitoSub(body.cognito_sub, 'ONBOARDING_FINISHED');
          }
        }
      } catch (userError: any) {
        console.error('Error creating/linking user record:', userError);
        console.error('Error details:', {
          message: userError.message,
          code: userError.code,
          detail: userError.detail,
          constraint: userError.constraint,
        });
        
        // If user linking fails, we have an orphaned member record
        // Try to clean up the member record we just created
        try {
          await pool.query('DELETE FROM fraternity_members WHERE id = $1', [member.id]);
          console.log(`Cleaned up orphaned member record ${member.id} due to user linking failure`);
        } catch (cleanupError) {
          console.error('Failed to clean up orphaned member record:', cleanupError);
        }
        
        // Fail the registration since user linking is critical
        return res.status(500).json({ 
          error: 'Failed to link user account. Please try again.',
          code: 'USER_LINKING_FAILED'
        });
      }
    }

    // Send welcome email (don't fail registration if email fails)
    try {
      await sendWelcomeEmail(body.email, body.name);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Continue - email failure shouldn't break registration
    }

    res.status(201).json(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating member registration:', error);
    res.status(500).json({ error: 'Failed to create member registration' });
  }
});

// Get all members (for connect page) - requires authentication
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { location, chapter_id, industry, profession_id } = req.query;
    
    let query = `
      SELECT 
        m.id,
        m.email,
        m.name,
        m.membership_number,
        m.initiated_chapter_id,
        c.name as chapter_name,
        m.initiated_season,
        m.initiated_year,
        m.ship_name,
        m.line_name,
        m.location,
        m.industry,
        m.profession_id,
        p.name as profession_name,
        m.job_title,
        m.bio,
        m.headshot_url,
        m.social_links,
        m.verification_status,
        m.created_at,
        m.updated_at,
        CASE WHEN s.id IS NOT NULL AND s.status = 'APPROVED' THEN true ELSE false END as is_seller,
        CASE WHEN pr.id IS NOT NULL AND pr.status = 'APPROVED' THEN true ELSE false END as is_promoter,
        CASE WHEN st.id IS NOT NULL AND st.status = 'APPROVED' THEN true ELSE false END as is_steward
      FROM fraternity_members m
      LEFT JOIN chapters c ON m.initiated_chapter_id = c.id
      LEFT JOIN professions p ON m.profession_id = p.id
      LEFT JOIN sellers s ON m.id = s.fraternity_member_id AND s.status = 'APPROVED'
      LEFT JOIN promoters pr ON m.id = pr.fraternity_member_id AND pr.status = 'APPROVED'
      LEFT JOIN stewards st ON m.id = st.fraternity_member_id AND st.status = 'APPROVED'
      WHERE m.verification_status = 'VERIFIED'
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    if (location) {
      query += ` AND LOWER(m.location) LIKE $${paramCount}`;
      params.push(`%${(location as string).toLowerCase()}%`);
      paramCount++;
    }
    
    if (chapter_id) {
      query += ` AND m.initiated_chapter_id = $${paramCount}`;
      params.push(parseInt(chapter_id as string));
      paramCount++;
    }
    
    if (industry) {
      query += ` AND LOWER(m.industry) LIKE $${paramCount}`;
      params.push(`%${(industry as string).toLowerCase()}%`);
      paramCount++;
    }
    
    if (profession_id) {
      query += ` AND m.profession_id = $${paramCount}`;
      params.push(parseInt(profession_id as string));
      paramCount++;
    }
    
    query += ` ORDER BY m.name ASC`;
    
    const result = await pool.query(query, params);
    
    // Parse social_links if they're strings
    const members = result.rows.map(member => {
      if (typeof member.social_links === 'string') {
        try {
          member.social_links = JSON.parse(member.social_links);
        } catch (e) {
          member.social_links = {};
        }
      }
      return member;
    });
    
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Get current member profile
router.get('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.memberId) {
      return res.status(404).json({ error: 'Member profile not found' });
    }

    const result = await pool.query(
      `SELECT m.*, c.name as chapter_name, p.name as profession_name
       FROM fraternity_members m
       LEFT JOIN chapters c ON m.initiated_chapter_id = c.id
       LEFT JOIN professions p ON m.profession_id = p.id
       WHERE m.id = $1`,
      [req.user.memberId]
    );

    if (result.rows.length === 0) {
      // Member doesn't exist but user has fraternity_member_id set - this is an orphaned reference
      // Clear it so user can complete registration
      console.warn(`Orphaned fraternity_member_id detected: user ${req.user.id} has fraternity_member_id ${req.user.memberId} but fraternity_member doesn't exist`);
      try {
        await pool.query(
          `UPDATE users 
           SET fraternity_member_id = NULL, 
               onboarding_status = 'ONBOARDING_STARTED',
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [req.user.id]
        );
      } catch (cleanupError) {
        console.error('Error clearing orphaned fraternity_member_id:', cleanupError);
      }
      return res.status(404).json({ 
        error: 'Member profile not found',
        code: 'MEMBER_NOT_FOUND',
        requiresRegistration: true 
      });
    }

    const member = result.rows[0];
    // Parse social_links if it's a string
    if (typeof member.social_links === 'string') {
      member.social_links = JSON.parse(member.social_links);
    }

    res.json(member);
  } catch (error) {
    console.error('Error fetching member profile:', error);
    res.status(500).json({ error: 'Failed to fetch member profile' });
  }
});

// Update member profile
const memberUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  initiated_chapter_id: z.number().int().positive().optional(),
  initiated_season: z.string().optional().nullable(),
  initiated_year: z.number().int().positive().optional().nullable(),
  ship_name: z.string().optional().nullable(),
  line_name: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  address_is_private: z.boolean().optional(),
  phone_number: z.string().optional().nullable(),
  phone_is_private: z.boolean().optional(),
  industry: z.string().optional().nullable(),
  profession_id: z.number().int().positive().optional().nullable(),
  job_title: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  social_links: z.record(z.string()).optional(),
});

router.put('/profile', authenticate, upload.single('headshot'), async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.memberId) {
      return res.status(404).json({ error: 'Member profile not found' });
    }

    // Helper to convert empty strings to null
    const toNullIfEmpty = (value: any) => {
      if (value === undefined || value === null || value === '') return null;
      return value;
    };

    // Parse form data
    const parsedBody = {
      ...req.body,
      initiated_chapter_id: req.body.initiated_chapter_id ? parseInt(req.body.initiated_chapter_id) : undefined,
      initiated_season: toNullIfEmpty(req.body.initiated_season),
      initiated_year: req.body.initiated_year && req.body.initiated_year !== '' 
        ? parseInt(req.body.initiated_year) 
        : undefined,
      ship_name: toNullIfEmpty(req.body.ship_name),
      line_name: toNullIfEmpty(req.body.line_name),
      location: toNullIfEmpty(req.body.location),
      address: toNullIfEmpty(req.body.address),
      phone_number: toNullIfEmpty(req.body.phone_number),
      industry: toNullIfEmpty(req.body.industry),
      profession_id: req.body.profession_id && req.body.profession_id !== '' 
        ? parseInt(req.body.profession_id) 
        : undefined,
      job_title: toNullIfEmpty(req.body.job_title),
      bio: toNullIfEmpty(req.body.bio),
      address_is_private: req.body.address_is_private === 'true' || req.body.address_is_private === true,
      phone_is_private: req.body.phone_is_private === 'true' || req.body.phone_is_private === true,
      social_links: req.body.social_links ? JSON.parse(req.body.social_links) : undefined,
    };

    // Validate request body
    const body = memberUpdateSchema.parse(parsedBody);

    // Handle headshot upload
    let headshotUrl: string | undefined;
    if (req.file) {
      // Validate image dimensions
      try {
        const { default: sizeOf } = await import('image-size');
        const dimensions = sizeOf(req.file.buffer);
        const MIN_DIMENSION = 200;
        const MAX_DIMENSION = 2000;

        if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
          return res.status(400).json({ 
            error: `Image is too small. Minimum dimensions are ${MIN_DIMENSION}x${MIN_DIMENSION} pixels.` 
          });
        }

        if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
          return res.status(400).json({ 
            error: `Image is too large. Maximum dimensions are ${MAX_DIMENSION}x${MAX_DIMENSION} pixels.` 
          });
        }
      } catch (err) {
        return res.status(400).json({ error: 'Invalid image file. Please upload a valid image.' });
      }

      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'headshots'
      );
      headshotUrl = uploadResult.url;
    }

    // Build dynamic UPDATE query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (body.name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      values.push(body.name);
      paramCount++;
    }
    if (body.initiated_chapter_id !== undefined) {
      updateFields.push(`initiated_chapter_id = $${paramCount}`);
      values.push(body.initiated_chapter_id);
      paramCount++;
    }
    if (body.initiated_season !== undefined) {
      updateFields.push(`initiated_season = $${paramCount}`);
      values.push(body.initiated_season);
      paramCount++;
    }
    if (body.initiated_year !== undefined) {
      updateFields.push(`initiated_year = $${paramCount}`);
      values.push(body.initiated_year);
      paramCount++;
    }
    if (body.ship_name !== undefined) {
      updateFields.push(`ship_name = $${paramCount}`);
      values.push(body.ship_name);
      paramCount++;
    }
    if (body.line_name !== undefined) {
      updateFields.push(`line_name = $${paramCount}`);
      values.push(body.line_name);
      paramCount++;
    }
    if (body.location !== undefined) {
      updateFields.push(`location = $${paramCount}`);
      values.push(body.location);
      paramCount++;
    }
    if (body.address !== undefined) {
      updateFields.push(`address = $${paramCount}`);
      values.push(body.address);
      paramCount++;
    }
    if (body.address_is_private !== undefined) {
      updateFields.push(`address_is_private = $${paramCount}`);
      values.push(body.address_is_private);
      paramCount++;
    }
    if (body.phone_number !== undefined) {
      updateFields.push(`phone_number = $${paramCount}`);
      values.push(body.phone_number);
      paramCount++;
    }
    if (body.phone_is_private !== undefined) {
      updateFields.push(`phone_is_private = $${paramCount}`);
      values.push(body.phone_is_private);
      paramCount++;
    }
    if (body.industry !== undefined) {
      updateFields.push(`industry = $${paramCount}`);
      values.push(body.industry);
      paramCount++;
    }
    if (body.profession_id !== undefined) {
      updateFields.push(`profession_id = $${paramCount}`);
      values.push(body.profession_id);
      paramCount++;
    }
    if (body.job_title !== undefined) {
      updateFields.push(`job_title = $${paramCount}`);
      values.push(body.job_title);
      paramCount++;
    }
    if (body.bio !== undefined) {
      updateFields.push(`bio = $${paramCount}`);
      values.push(body.bio);
      paramCount++;
    }
    if (headshotUrl) {
      updateFields.push(`headshot_url = $${paramCount}`);
      values.push(headshotUrl);
      paramCount++;
    }
    if (body.social_links !== undefined) {
      updateFields.push(`social_links = $${paramCount}::jsonb`);
      values.push(JSON.stringify(body.social_links));
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(req.user.memberId);
    const whereClause = `WHERE id = $${paramCount}`;

    const result = await pool.query(
      `UPDATE fraternity_members SET ${updateFields.join(', ')} ${whereClause}
       RETURNING *`,
      values
    );

    const updatedMember = result.rows[0];
    // Parse social_links if it's a string
    if (typeof updatedMember.social_links === 'string') {
      updatedMember.social_links = JSON.parse(updatedMember.social_links);
    }

    // Get chapter name
    if (updatedMember.initiated_chapter_id) {
      const chapterResult = await pool.query(
        'SELECT name FROM chapters WHERE id = $1',
        [updatedMember.initiated_chapter_id]
      );
      updatedMember.chapter_name = chapterResult.rows[0]?.name || null;
    }

    res.json(updatedMember);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating member profile:', error);
    res.status(500).json({ error: 'Failed to update member profile' });
  }
});

export default router;

