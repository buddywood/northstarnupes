# Test Users Documentation

This document describes the test users available in the 1Kappa application for development and testing purposes.

## Overview

The test users are prefixed with `buddy+` and use the `@ebilly.com` domain. All test users share the same password for convenience during development.

## Test User Credentials

**Password for all test users:** `TestPassword123!`

## Test Users

### 1. Buddy Seller
- **Email:** `buddy+seller@ebilly.com`
- **Name:** Buddy Seller
- **Role:** SELLER
- **Membership Number:** `KAP-TEST-SELLER`
- **Business Name:** Buddy's Kappa Gear
- **Vendor License:** `VL-TEST-SELLER`
- **Status:** APPROVED
- **Database Records:**
  - ✅ Fraternity Member (if membership_number provided)
  - ✅ Seller record (APPROVED status)
  - ✅ User record with SELLER role
  - ⚠️ Note: `fraternity_member_id` is NULL in users table (sellers don't require membership)

**Access:**
- Seller Dashboard (`/seller-dashboard`)
- Can create and manage product listings
- Can view orders and metrics
- Can set up Stripe for payouts

---

### 2. Buddy Member
- **Email:** `buddy+member@ebilly.com`
- **Name:** Buddy Member
- **Role:** CONSUMER
- **Membership Number:** `KAP-TEST-MEMBER`
- **Status:** VERIFIED (member verification)
- **Database Records:**
  - ✅ Fraternity Member (VERIFIED)
  - ✅ User record with CONSUMER role
  - ✅ `fraternity_member_id` is NOT NULL (required for CONSUMER role)

**Access:**
- Shop and browse products
- Purchase items
- Favorite items
- View notifications
- Access steward marketplace
- Claim steward listings

---

### 3. Buddy Steward
- **Email:** `buddy+steward@ebilly.com`
- **Name:** Buddy Steward
- **Role:** STEWARD
- **Membership Number:** `KAP-TEST-STEWARD`
- **Status:** APPROVED
- **Database Records:**
  - ✅ Fraternity Member (VERIFIED)
  - ✅ Steward record (APPROVED status)
  - ✅ User record with STEWARD role
  - ✅ `fraternity_member_id` is NOT NULL (required for STEWARD role)

**Access:**
- Steward Dashboard (`/steward-dashboard`)
- Can create and manage steward listings (legacy fraternity paraphernalia)
- Can view claims and donations generated
- Can browse steward marketplace
- Can also be a seller or promoter (if linked)

---

### 4. Buddy Promoter
- **Email:** `buddy+promoter@ebilly.com`
- **Name:** Buddy Promoter
- **Role:** PROMOTER
- **Membership Number:** `KAP-TEST-PROMOTER`
- **Status:** APPROVED
- **Database Records:**
  - ✅ Fraternity Member (VERIFIED)
  - ✅ Promoter record (APPROVED status)
  - ✅ User record with PROMOTER role
  - ✅ `fraternity_member_id` is NOT NULL (required for PROMOTER role)

**Access:**
- Promoter Dashboard (`/promoter-dashboard`)
- Can create and manage events
- Can view event analytics and metrics
- Can also be a seller or steward (if linked)

---

## Seeding Test Users

### Prerequisites

1. **Database:** Ensure your database is set up and migrations have been run
2. **Chapters:** At least one chapter must exist in the database (the script will assign users to random chapters)
3. **AWS Cognito (Optional):** For full functionality, you need admin access to Cognito

### Running the Seed Script

#### With Cognito Access (Recommended)

If you have admin credentials for AWS Cognito, the script will create users in both Cognito and the database:

```bash
# Using AWS Profile (recommended)
AWS_PROFILE=your-admin-profile npm run seed:test-users

# Or using explicit credentials
AWS_ACCESS_KEY_ID=your-key AWS_SECRET_ACCESS_KEY=your-secret npm run seed:test-users
```

#### Without Cognito Access

If you don't have Cognito admin permissions, the script will:
- ⚠️ Skip Cognito user creation
- ✅ Still create database records with placeholder `cognito_sub` values
- ⚠️ Users will need to be created in Cognito manually or by an admin

```bash
npm run seed:test-users
```

### Granting Cognito Permissions

If you need to grant Cognito admin permissions to an IAM user, use the provided script:

```bash
cd backend
./scripts/grant-cognito-permissions.sh
```

Or set a custom IAM user name:

```bash
IAM_USER_NAME=your-iam-user ./scripts/grant-cognito-permissions.sh
```

See `backend/scripts/grant-cognito-permissions.md` for more details.

---

## Test User Features

### What Gets Created

For each test user, the seed script creates:

1. **Cognito User** (if permissions available)
   - Email verified
   - Permanent password set
   - User confirmed

2. **Fraternity Member Record** (if applicable)
   - Email, name, membership number
   - Assigned to a random active collegiate chapter
   - Verification status: VERIFIED
   - Registration status: COMPLETE

3. **Role-Specific Records**
   - **Seller:** Seller record with business info, APPROVED status
   - **Steward:** Steward record linked to member, APPROVED status
   - **Promoter:** Promoter record linked to member, APPROVED status

4. **User Record**
   - Links Cognito sub to database
   - Sets appropriate role (SELLER, CONSUMER, STEWARD, PROMOTER)
   - Sets onboarding status to ONBOARDING_FINISHED
   - Links to role-specific records (seller_id, steward_id, promoter_id)
   - Sets `fraternity_member_id` according to role requirements

### Role Constraints

The database enforces specific constraints for each role:

- **SELLER:** `fraternity_member_id` can be NULL (sellers don't need to be members)
- **CONSUMER:** `fraternity_member_id` must NOT be NULL (must be a member)
- **STEWARD:** `fraternity_member_id` must NOT be NULL (must be a member)
- **PROMOTER:** `fraternity_member_id` must NOT be NULL (must be a member)

---

## Test Data Relationships

### Chapters
- Test users are assigned to random active collegiate chapters
- If no collegiate chapters exist, any available chapter is used
- The script requires at least one chapter to exist

### Notifications
Test notifications can be seeded separately:

```bash
npm run seed:notifications
```

This creates sample notifications for the test users, including:
- Purchase blocked notifications
- Item available notifications
- Order confirmed notifications

---

## Usage Examples

### Testing Seller Flow
1. Log in as `buddy+seller@ebilly.com`
2. Navigate to Seller Dashboard
3. Create product listings
4. Set up Stripe account
5. View orders and metrics

### Testing Consumer Flow
1. Log in as `buddy+member@ebilly.com`
2. Browse shop and collections
3. Favorite items
4. Attempt to purchase items
5. View notifications

### Testing Steward Flow
1. Log in as `buddy+steward@ebilly.com`
2. Navigate to Steward Dashboard
3. Create steward listings
4. View claims and donations
5. Browse marketplace

### Testing Promoter Flow
1. Log in as `buddy+promoter@ebilly.com`
2. Navigate to Promoter Dashboard
3. Create events
4. View event metrics
5. Manage event details

---

## Troubleshooting

### Users Not Created in Cognito

If you see warnings about Cognito permissions:
1. Check your AWS credentials
2. Ensure you're using an admin profile: `AWS_PROFILE=admin-profile npm run seed:test-users`
3. Grant permissions using `backend/scripts/grant-cognito-permissions.sh`
4. Users can still be created manually in Cognito console

### Database Errors

If you encounter database constraint errors:
1. Ensure migrations have been run: `npm run migrate`
2. Check that chapters exist: `npm run seed:chapters`
3. Verify the database connection in `.env.local`

### Duplicate User Errors

The script handles existing users gracefully:
- If a user exists in Cognito, it uses the existing user
- If a database record exists, it updates it
- The script is idempotent and can be run multiple times safely

---

## Security Notes

⚠️ **Important:** These test users are for development and testing only.

- All users share the same password
- Users are created with APPROVED status
- Email verification is automatically set to true
- These credentials should **never** be used in production

---

## Related Documentation

- `LOCAL_SETUP.md` - Local development setup
- `QUICK_START.md` - Quick start guide
- `backend/scripts/grant-cognito-permissions.md` - Cognito permissions setup
- `NEON_TEST_DB_SETUP.md` - Database setup for testing

---

## Script Location

The test user seeding script is located at:
`backend/src/scripts/seed-test-users.ts`

To modify test users, edit the `testUsers` array in this file.

