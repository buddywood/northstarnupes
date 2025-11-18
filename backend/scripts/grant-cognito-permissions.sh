#!/bin/bash

# Script to grant Cognito admin permissions to the 1kappa_user IAM user
# This allows the service account to create/manage Cognito users for seeding
# 
# Usage: Run with admin credentials (buddy@ebilly.com or root)
# The script will grant permissions to the 1kappa_user IAM user

set -e

# Use 1kappa_user profile by default for the target user
IAM_USER_NAME="${IAM_USER_NAME:-1kappa_user}"
USER_POOL_ID="${COGNITO_USER_POOL_ID:-us-east-1_zUtF081P3}"
POLICY_NAME="CognitoAdminAccess"

echo "🔐 Granting Cognito permissions to IAM user: $IAM_USER_NAME"
echo "📋 User Pool ID: $USER_POOL_ID"
echo "📋 Current AWS Identity:"
aws sts get-caller-identity --output table || exit 1
echo ""

# Check if user exists
if ! aws iam get-user --user-name "$IAM_USER_NAME" 2>/dev/null; then
  echo "❌ Error: IAM user '$IAM_USER_NAME' not found!"
  echo ""
  echo "Available IAM users:"
  aws iam list-users --query 'Users[].UserName' --output table || echo "  (Could not list users)"
  echo ""
  echo "💡 Options:"
  echo "   1. Set IAM_USER_NAME environment variable:"
  echo "      IAM_USER_NAME=your-actual-user-name ./scripts/grant-cognito-permissions.sh"
  echo ""
  echo "   2. Create the user first:"
  echo "      aws iam create-user --user-name $IAM_USER_NAME"
  echo ""
  exit 1
fi
echo ""

# Create IAM policy document for Cognito admin access
cat > /tmp/cognito-admin-policy.json <<EOF
{
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
      "Resource": "arn:aws:cognito-idp:*:*:userpool/${USER_POOL_ID}"
    }
  ]
}
EOF

echo "📝 Policy document created:"
cat /tmp/cognito-admin-policy.json
echo ""

# Check if policy already exists
if aws iam get-policy --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME" 2>/dev/null; then
  echo "⚠️  Policy $POLICY_NAME already exists. Updating..."
  POLICY_VERSION=$(aws iam create-policy-version \
    --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME" \
    --policy-document file:///tmp/cognito-admin-policy.json \
    --set-as-default \
    --query 'PolicyVersion.VersionId' \
    --output text)
  echo "✅ Policy updated to version: $POLICY_VERSION"
else
  echo "📦 Creating new policy: $POLICY_NAME"
  POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document file:///tmp/cognito-admin-policy.json \
    --query 'Policy.Arn' \
    --output text)
  echo "✅ Policy created: $POLICY_ARN"
fi

# Attach policy to user
echo ""
echo "🔗 Attaching policy to user: $IAM_USER_NAME"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/$POLICY_NAME"

# Check if policy is already attached
if aws iam list-attached-user-policies --user-name "$IAM_USER_NAME" --query "AttachedPolicies[?PolicyArn=='$POLICY_ARN']" --output text | grep -q "$POLICY_ARN"; then
  echo "✅ Policy already attached to user"
else
  aws iam attach-user-policy \
    --user-name "$IAM_USER_NAME" \
    --policy-arn "$POLICY_ARN"
  echo "✅ Policy attached successfully"
fi

# Clean up
rm -f /tmp/cognito-admin-policy.json

echo ""
echo "✅ Done! The IAM user $IAM_USER_NAME now has Cognito admin permissions."
echo ""
echo "💡 You can now run: npm run seed:test-users"

