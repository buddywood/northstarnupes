# Grant Cognito Permissions to Service Account

This script grants the necessary Cognito admin permissions to the `1kappa_user` IAM user so it can create and manage Cognito users for seeding test data.

## Prerequisites

- AWS CLI installed and configured
- Admin/root AWS credentials or credentials with IAM permissions
- `COGNITO_USER_POOL_ID` environment variable set (or defaults to `us-east-1_zUtF081P3`)

## Usage

### Option 1: Run the script directly

```bash
cd backend
./scripts/grant-cognito-permissions.sh
```

### Option 2: Manual AWS CLI commands

If you prefer to run the commands manually:

```bash
# Set variables
IAM_USER_NAME="1kappa_user"
USER_POOL_ID="us-east-1_zUtF081P3"  # Your actual user pool ID
POLICY_NAME="CognitoAdminAccess"

# Create policy
aws iam create-policy \
  --policy-name "$POLICY_NAME" \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminConfirmSignUp",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminDeleteUser",
          "cognito-idp:ListUsers"
        ],
        "Resource": "arn:aws:cognito-idp:*:*:userpool/'$USER_POOL_ID'"
      }
    ]
  }'

# Get the policy ARN (replace ACCOUNT_ID with your AWS account ID)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/$POLICY_NAME"

# Attach policy to user
aws iam attach-user-policy \
  --user-name "$IAM_USER_NAME" \
  --policy-arn "$POLICY_ARN"
```

## Permissions Granted

The policy grants the following Cognito operations:
- `AdminCreateUser` - Create new Cognito users
- `AdminGetUser` - Get user details
- `AdminSetUserPassword` - Set user passwords
- `AdminConfirmSignUp` - Confirm user signups
- `AdminUpdateUserAttributes` - Update user attributes
- `AdminDeleteUser` - Delete users (for cleanup)
- `ListUsers` - List users in the pool

## Verification

After running the script, verify the permissions:

```bash
# List attached policies
aws iam list-attached-user-policies --user-name 1kappa_user

# Test by running the seed script
npm run seed:test-users
```

## Troubleshooting

If you get permission errors:

1. **Ensure you're using admin credentials**: The script needs IAM permissions to create/attach policies
2. **Check the user pool ID**: Make sure `COGNITO_USER_POOL_ID` matches your actual user pool
3. **Verify IAM user exists**: `aws iam get-user --user-name 1kappa_user`


