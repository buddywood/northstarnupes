import {
  CognitoIdentityProviderClient,
  UpdateUserPoolCommand,
  DescribeUserPoolCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Set AWS profile if not already set (AWS SDK will pick this up automatically)
// The profile name should match what's in ~/.aws/credentials
// Default to 1kappa_user (with underscore) as that's what exists in AWS config
if (!process.env.AWS_PROFILE) {
  process.env.AWS_PROFILE = '1kappa_user';
}

const AWS_REGION = process.env.COGNITO_REGION || process.env.AWS_REGION || 'us-east-1';

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://yourdomain.com';

// Remove trailing slash
const cleanFrontendUrl = FRONTEND_URL.replace(/\/$/, '');

// Verification email template
const verificationEmailSubject = 'Your 1Kappa Verification Code';
const verificationEmailMessage = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
      <img src="${cleanFrontendUrl}/horizon-logo.png" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px;">
      <p style="font-size: 16px;">Hello,</p>
      
      <p style="font-size: 16px;">
        Thank you for registering with 1Kappa! Please use the verification code below to complete your registration:
      </p>
      
      <div style="background-color: #fff; border: 2px solid #dc143c; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="font-size: 32px; font-weight: bold; color: #dc143c; margin: 0; letter-spacing: 5px;">
          {####}
        </p>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        This code will expire in 24 hours. If you didn't request this code, please ignore this email.
      </p>
      
      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        Best regards,<br>
        The 1Kappa Team
      </p>
    </div>
    
    <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
      <p style="color: #fff; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} 1Kappa. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

// Password reset email template
const passwordResetEmailSubject = 'Reset Your 1Kappa Password';
const passwordResetEmailMessage = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #1a1a2e; padding: 30px; text-align: center;">
      <img src="${cleanFrontendUrl}/horizon-logo.png" alt="1Kappa Logo" style="max-width: 300px; height: auto; margin-bottom: 20px;" />
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px;">
      <p style="font-size: 16px;">Hello,</p>
      
      <p style="font-size: 16px;">
        You requested to reset your password for your 1Kappa account.
      </p>
      
      <div style="background-color: #fff; border: 2px solid #dc143c; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="font-size: 32px; font-weight: bold; color: #dc143c; margin: 0; letter-spacing: 5px;">
          {####}
        </p>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        This code will expire in 1 hour. If you didn't request a password reset, please ignore this email.
      </p>
      
      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        Best regards,<br>
        The 1Kappa Team
      </p>
    </div>
    
    <div style="background-color: #1a1a2e; padding: 20px; text-align: center;">
      <p style="color: #fff; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} 1Kappa. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

async function updateCognitoEmailTemplates() {
  try {
    // Initialize Cognito client
    const client = new CognitoIdentityProviderClient({
      region: AWS_REGION,
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
    });

    if (!COGNITO_USER_POOL_ID) {
      console.error('❌ COGNITO_USER_POOL_ID is not set in environment variables');
      console.log('\nPlease set it in your .env.local file:');
      console.log('  COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx');
      process.exit(1);
    }

    console.log('🚀 Updating Cognito Email Templates\n');
    console.log('📋 Configuration:');
    console.log(`  AWS Profile: ${process.env.AWS_PROFILE || 'default'}`);
    console.log(`  User Pool ID: ${COGNITO_USER_POOL_ID}`);
    console.log(`  Frontend URL: ${cleanFrontendUrl}`);
    console.log(`  Region: ${AWS_REGION}\n`);

    // First, get the current user pool configuration to preserve other settings
    console.log('📥 Fetching current User Pool configuration...');
    const getUserPoolCommand = new DescribeUserPoolCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
    });
    
    const currentPool = await client.send(getUserPoolCommand);
    const userPool = currentPool.UserPool;

    if (!userPool) {
      throw new Error('User Pool not found');
    }

    console.log('✅ User Pool found:', userPool.Name);

    // Update the user pool with new email templates
    console.log('\n📧 Updating email templates...');
    
    const updateCommand = new UpdateUserPoolCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      VerificationMessageTemplate: {
        EmailMessage: verificationEmailMessage,
        EmailSubject: verificationEmailSubject,
      },
      // Note: Password reset templates are typically configured separately
      // This updates the verification (signup) email template
    });

    await client.send(updateCommand);
    
    console.log('✅ Verification email template updated successfully!');
    console.log('\n⚠️  Note: Password reset email template needs to be updated manually in AWS Console');
    console.log('   Go to: Cognito → User Pools → Your Pool → Messaging → Email');
    console.log('   Update the "Forgot password" message template\n');
    
    console.log('🔗 AWS Console Link:');
    console.log(`   https://console.aws.amazon.com/cognito/v2/idp/user-pools/${COGNITO_USER_POOL_ID}/messaging\n`);
    
    console.log('📝 Password Reset Template:');
    console.log('   Subject:', passwordResetEmailSubject);
    console.log('   Copy the HTML template from COGNITO_EMAIL_CUSTOMIZATION.md\n');
    
    console.log('✅ Done! Test by registering a new user or requesting a password reset.');

  } catch (error: any) {
    console.error('\n❌ Error updating Cognito email templates:', error.message);
    
    if (error.name === 'NotAuthorizedException') {
      console.error('\n💡 Make sure your AWS credentials have the following permissions:');
      console.error('   - cognito-idp:GetUserPool');
      console.error('   - cognito-idp:UpdateUserPool');
    } else if (error.name === 'ResourceNotFoundException') {
      console.error('\n💡 Make sure COGNITO_USER_POOL_ID is correct');
    }
    
    process.exit(1);
  }
}

updateCognitoEmailTemplates()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

