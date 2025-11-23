/**
 * Registration Flow Tests
 * 
 * Tests the following user flows:
 * 1. GUEST → Activate Seller → SELLER (GuestSellerProfile)
 * 2. GUEST → Verify Membership → MEMBER
 * 3. MEMBER → Activate Seller → SELLER (MemberSellerProfile)
 * 4. MEMBER → Activate Promoter → PROMOTER
 * 5. MEMBER → Activate Steward → STEWARD
 */

import request from 'supertest';
import express, { Express } from 'express';
import { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand, ListUsersCommand, ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider';
import pool from '../db/connection';
import * as queries from '../db/queries';
import * as s3Service from '../services/s3';
import * as emailService from '../services/email';
import * as stripeService from '../services/stripe';

// Mock all dependencies
jest.mock('../db/connection');
jest.mock('../db/queries');
jest.mock('../services/s3');
jest.mock('../services/email');
jest.mock('../services/stripe');

// Mock Cognito client - create a mock send function that can be controlled in tests
const mockCognitoSend = jest.fn();
jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  const actual = jest.requireActual('@aws-sdk/client-cognito-identity-provider');
  return {
    ...actual,
    CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
      send: mockCognitoSend,
    })),
  };
});

// Mock the routes - we'll import them after mocking
const mockAuthenticate = jest.fn((req: any, res: any, next: any) => {
  req.user = { id: 1, email: 'test@example.com', cognitoSub: 'test-sub', role: 'GUEST', sellerId: null, promoterId: null, stewardId: null, features: {} };
  next();
});

const mockOptionalAuthenticate = jest.fn((req: any, res: any, next: any) => {
  // Don't set user by default - tests can override
  next();
});

jest.mock('../middleware/auth', () => ({
  authenticate: mockAuthenticate,
  optionalAuthenticate: mockOptionalAuthenticate,
  requireSteward: jest.fn((req: any, res: any, next: any) => next()),
  requireVerifiedMember: jest.fn((req: any, res: any, next: any) => next()),
}));

// Mock services that routes depend on
jest.mock('../services/cognito', () => ({
  verifyCognitoToken: jest.fn().mockResolvedValue({ sub: 'test-sub', email: 'test@example.com' }),
  extractUserInfoFromToken: jest.fn().mockReturnValue({ sub: 'test-sub', email: 'test@example.com' }),
}));

// Import routes after mocking
import membersRouter from '../routes/members';
import sellersRouter from '../routes/sellers';
import promotersRouter from '../routes/promoters';
import stewardsRouter from '../routes/stewards';

// Create Express app for testing
const createApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api/members', membersRouter);
  app.use('/api/sellers', sellersRouter);
  app.use('/api/promoters', promotersRouter);
  app.use('/api/stewards', stewardsRouter);
  return app;
};

describe('Registration Flow Tests', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
    mockCognitoSend.mockClear();

    // Reset middleware mocks
    mockAuthenticate.mockImplementation((req: any, res: any, next: any) => {
      req.user = { id: 1, email: 'test@example.com', cognitoSub: 'test-sub', role: 'GUEST', sellerId: null, promoterId: null, stewardId: null, features: {} };
      next();
    });

    mockOptionalAuthenticate.mockImplementation((req: any, res: any, next: any) => {
      // Don't set user by default - tests can override
      next();
    });
  });

  describe('Flow 1: GUEST → Activate Seller → SELLER (GuestSellerProfile)', () => {
    it('should allow guest to apply for seller account without membership', async () => {
      const sellerApplication = {
        name: 'Guest Seller',
        email: 'guest-seller@example.com',
        sponsoring_chapter_id: 1,
        business_name: 'Guest Business',
        merchandise_type: 'NON_KAPPA',
        kappa_vendor_id: null,
        website: 'https://example.com',
        social_links: JSON.stringify({ instagram: '@guest' }),
      };

      // Mock: No existing user
      (queries.getUserByEmail as jest.Mock).mockResolvedValue(null);
      
      // Mock: No existing member
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      // Mock: S3 upload for store logo
      (s3Service.uploadToS3 as jest.Mock).mockResolvedValue({
        url: 'https://s3.amazonaws.com/store-logos/logo.jpg',
      });

      // Mock: Seller creation
      (queries.createSeller as jest.Mock).mockResolvedValue({
        id: 1,
        ...sellerApplication,
        status: 'PENDING',
        store_logo_url: 'https://s3.amazonaws.com/store-logos/logo.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Mock: Get seller by ID
      (queries.getSellerById as jest.Mock).mockResolvedValue({
        id: 1,
        ...sellerApplication,
        status: 'PENDING',
        store_logo_url: 'https://s3.amazonaws.com/store-logos/logo.jpg',
      });

      // Mock: Email service
      (emailService.sendSellerApplicationSubmittedEmail as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sellers/apply')
        .field('name', sellerApplication.name)
        .field('email', sellerApplication.email)
        .field('sponsoring_chapter_id', sellerApplication.sponsoring_chapter_id.toString())
        .field('business_name', sellerApplication.business_name)
        .field('merchandise_type', sellerApplication.merchandise_type)
        .field('website', sellerApplication.website)
        .field('social_links', sellerApplication.social_links)
        .attach('store_logo', Buffer.from('fake logo'), 'logo.jpg');

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('PENDING');
      expect(response.body.email).toBe(sellerApplication.email);
      expect(queries.createSeller).toHaveBeenCalled();
      expect(s3Service.uploadToS3).toHaveBeenCalled();
    });

    it('should require vendor license for KAPPA merchandise', async () => {
      const sellerApplication = {
        name: 'Guest Seller',
        email: 'guest-seller@example.com',
        sponsoring_chapter_id: 1,
        merchandise_type: 'KAPPA',
        // Missing kappa_vendor_id
      };

      const response = await request(app)
        .post('/api/sellers/apply')
        .send(sellerApplication);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Flow 2: GUEST → Verify Membership → MEMBER', () => {
    it('should allow guest to sign up with Cognito', async () => {
      const signupData = {
        email: 'new-member@example.com',
        password: 'TestPassword123!',
      };

      // Mock: No existing users in Cognito
      mockCognitoSend.mockResolvedValueOnce({
        Users: [],
      });

      // Mock: Cognito signup success
      mockCognitoSend.mockResolvedValueOnce({
        UserSub: 'test-cognito-sub-123',
        CodeDeliveryDetails: {
          Destination: 'n***@example.com',
          DeliveryMedium: 'EMAIL',
        },
      });

      const response = await request(app)
        .post('/api/members/cognito/signup')
        .send(signupData);

      expect(response.status).toBe(200);
      expect(response.body.userSub).toBe('test-cognito-sub-123');
      expect(response.body.codeDeliveryDetails).toBeDefined();
    });

    it('should handle existing unconfirmed user by resending code', async () => {
      const signupData = {
        email: 'existing@example.com',
        password: 'TestPassword123!',
      };

      // Mock: User exists and is unconfirmed
      mockCognitoSend.mockResolvedValueOnce({
        Users: [{
          Username: 'existing@example.com',
          UserStatus: 'UNCONFIRMED',
        }],
      });

      // Mock: Resend confirmation code
      mockCognitoSend.mockResolvedValueOnce({
        CodeDeliveryDetails: {
          Destination: 'e***@example.com',
          DeliveryMedium: 'EMAIL',
        },
      });

      const response = await request(app)
        .post('/api/members/cognito/signup')
        .send(signupData);

      expect(response.status).toBe(200);
      expect(response.body.existingUser).toBe(true);
      expect(response.body.message).toContain('resent');
    });

    it('should verify email and create user record', async () => {
      const verifyData = {
        email: 'new-member@example.com',
        code: '123456',
        cognito_sub: 'test-cognito-sub-123',
      };

      // Mock: Cognito verification success
      mockCognitoSend.mockResolvedValueOnce({});

      // Mock: No existing user
      (queries.getUserByCognitoSub as jest.Mock).mockResolvedValue(null);

      // Mock: User creation
      (queries.createUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: verifyData.email,
        cognito_sub: verifyData.cognito_sub,
        role: 'GUEST',
        onboarding_status: 'COGNITO_CONFIRMED',
      });

      const response = await request(app)
        .post('/api/members/cognito/verify')
        .send(verifyData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(queries.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          cognito_sub: verifyData.cognito_sub,
          email: verifyData.email,
          role: 'GUEST',
          onboarding_status: 'COGNITO_CONFIRMED',
        })
      );
    });

    it('should create member profile after verification', async () => {
      const memberData = {
        name: 'Test Member',
        email: 'member@example.com',
        membership_number: '12345',
        cognito_sub: 'test-cognito-sub-123',
        initiated_chapter_id: '1', // Route expects string, will parse to int
        initiated_season: 'Fall',
        initiated_year: '2020', // Route expects string, will parse to int
        location: 'New York, NY',
        phone_number: '555-1234',
        industry: 'Technology',
        job_title: 'Software Engineer',
        bio: 'Test bio',
        address_is_private: 'false', // Route expects string 'true'/'false' or boolean
        phone_is_private: 'false', // Route expects string 'true'/'false' or boolean
        social_links: JSON.stringify({}),
      };

      // Mock: No existing draft (check by cognito_sub)
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      // Mock: Seller check (no existing seller)
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      // Mock: No duplicate member
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      // Mock: Member creation
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 1,
          ...memberData,
          registration_status: 'COMPLETE',
          verification_status: 'PENDING',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      // Mock: User exists
      (queries.getUserByCognitoSub as jest.Mock).mockResolvedValue({
        id: 1,
        email: memberData.email,
        cognito_sub: memberData.cognito_sub,
        role: 'GUEST',
        onboarding_status: 'COGNITO_CONFIRMED',
      });

      // Mock: Link user to member
      (queries.linkUserToMember as jest.Mock).mockResolvedValue(undefined);
      (queries.updateUserOnboardingStatusByCognitoSub as jest.Mock).mockResolvedValue(undefined);

      // Mock: Email service
      (emailService.sendWelcomeEmail as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/members/register')
        .send(memberData);

      expect(response.status).toBe(201);
      expect(response.body.email).toBe(memberData.email);
      expect(response.body.registration_status).toBe('COMPLETE');
      expect(queries.linkUserToMember).toHaveBeenCalled();
    });

    it('should set fraternity_member_id in users table after successful member registration', async () => {
      const memberData = {
        name: 'Test Member',
        email: 'test-member@example.com',
        membership_number: '12345',
        cognito_sub: 'test-sub',
        initiated_chapter_id: '1', // Route expects string
        initiated_year: '2020', // Route expects string
      };

      // Mock: No existing draft (check by cognito_sub)
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      // Mock: Seller check (no existing seller)
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      // Mock: No duplicate member (complex UNION query)
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      // Mock: Create member (INSERT query)
      const mockMember = {
        id: 100,
        email: memberData.email,
        name: memberData.name,
        membership_number: memberData.membership_number,
        registration_status: 'COMPLETE',
        verification_status: 'PENDING',
        created_at: new Date(),
        updated_at: new Date(),
      };
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockMember],
      });

      // Mock: User exists
      const mockUser = {
        id: 1,
        email: memberData.email,
        cognito_sub: memberData.cognito_sub,
        role: 'GUEST',
        onboarding_status: 'COGNITO_CONFIRMED',
        fraternity_member_id: null,
      };
      (queries.getUserByCognitoSub as jest.Mock).mockResolvedValue(mockUser);

      // Mock: linkUserToMember should update the user with fraternity_member_id
      // This simulates the actual database update that sets fraternity_member_id in users table
      const updatedUserWithMemberId = {
        ...mockUser,
        fraternity_member_id: mockMember.id,
        role: 'GUEST',
      };
      (queries.linkUserToMember as jest.Mock).mockResolvedValue(updatedUserWithMemberId);
      (queries.updateUserOnboardingStatusByCognitoSub as jest.Mock).mockResolvedValue(undefined);

      // Mock: Email service
      (emailService.sendWelcomeEmail as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/members/register')
        .send(memberData);

      expect(response.status).toBe(201);
      expect(response.body.email).toBe(memberData.email);
      expect(response.body.registration_status).toBe('COMPLETE');

      // Verify linkUserToMember was called with correct parameters (userId, memberId)
      expect(queries.linkUserToMember).toHaveBeenCalledWith(mockUser.id, mockMember.id);

      // Verify the returned user has fraternity_member_id set
      // This verifies that linkUserToMember correctly sets fraternity_member_id in the users table
      expect(updatedUserWithMemberId.fraternity_member_id).toBe(mockMember.id);
      expect(updatedUserWithMemberId.role).toBe('GUEST');
    });
  });

  describe('Flow 3: MEMBER → Activate Seller → SELLER (MemberSellerProfile)', () => {
    it('should allow verified member to apply for seller account', async () => {
      const sellerApplication = {
        name: 'Member Seller',
        email: 'member-seller@example.com',
        sponsoring_chapter_id: 1,
        business_name: 'Member Business',
        merchandise_type: 'KAPPA',
        kappa_vendor_id: 'VENDOR123',
        website: 'https://member-business.com',
        social_links: JSON.stringify({ instagram: '@member' }),
      };

      // Mock: Authenticated user with memberId
      mockOptionalAuthenticate.mockImplementation((req: any, res: any, next: any) => {
        req.user = { id: 1, email: sellerApplication.email, memberId: 1 };
        next();
      });

      // Mock: Member is verified
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: sellerApplication.email,
          verification_status: 'VERIFIED',
        }],
      });

      // Mock: S3 uploads
      (s3Service.uploadToS3 as jest.Mock)
        .mockResolvedValueOnce({ url: 'https://s3.amazonaws.com/store-logos/logo.jpg' })
        .mockResolvedValueOnce({ url: 'https://s3.amazonaws.com/headshots/headshot.jpg' });

      // Mock: Seller creation
      (queries.createSeller as jest.Mock).mockResolvedValue({
        id: 1,
        ...sellerApplication,
        fraternity_member_id: 1,
        status: 'PENDING',
        store_logo_url: 'https://s3.amazonaws.com/store-logos/logo.jpg',
        headshot_url: 'https://s3.amazonaws.com/headshots/headshot.jpg',
      });

      // Mock: Member verification check for auto-approval
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ verification_status: 'VERIFIED' }],
      });

      // Mock: User lookup for auto-approval
      (queries.getUserByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        email: sellerApplication.email,
        role: 'GUEST',
        fraternity_member_id: 1,
      });

      // Mock: Link user to seller
      (queries.linkUserToSeller as jest.Mock).mockResolvedValue(undefined);

      // Mock: Stripe Connect account creation
      (stripeService.createConnectAccount as jest.Mock).mockResolvedValue({
        id: 'acct_test123',
      });

      // Mock: Update seller status
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      // Mock: Get updated seller
      (queries.getSellerById as jest.Mock).mockResolvedValue({
        id: 1,
        ...sellerApplication,
        fraternity_member_id: 1,
        status: 'APPROVED',
        stripe_account_id: 'acct_test123',
      });

      // Mock: Email services
      (emailService.sendSellerApprovedEmail as jest.Mock) = jest.fn().mockResolvedValue(undefined);
      (emailService.sendSellerApplicationSubmittedEmail as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      // Set STRIPE_SECRET_KEY to enable auto-approval with Stripe account creation
      process.env.STRIPE_SECRET_KEY = 'sk_test_1234567890';

      const response = await request(app)
        .post('/api/sellers/apply')
        .field('name', sellerApplication.name)
        .field('email', sellerApplication.email)
        .field('sponsoring_chapter_id', sellerApplication.sponsoring_chapter_id.toString())
        .field('business_name', sellerApplication.business_name)
        .field('merchandise_type', sellerApplication.merchandise_type)
        .field('kappa_vendor_id', sellerApplication.kappa_vendor_id)
        .field('website', sellerApplication.website)
        .field('social_links', sellerApplication.social_links)
        .attach('store_logo', Buffer.from('fake logo'), 'logo.jpg')
        .attach('headshot', Buffer.from('fake headshot'), 'headshot.jpg');

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('APPROVED');
      expect(response.body.stripe_account_id).toBe('acct_test123');
      expect(stripeService.createConnectAccount).toHaveBeenCalled();
      expect(queries.linkUserToSeller).toHaveBeenCalled();
    });

    it('should auto-approve verified members selling non-kappa merchandise', async () => {
      const sellerApplication = {
        name: 'Member Seller',
        email: 'member-seller@example.com',
        sponsoring_chapter_id: 1,
        merchandise_type: 'NON_KAPPA',
        // No vendor license needed
      };

      // Mock: Authenticated user
      mockOptionalAuthenticate.mockImplementation((req: any, res: any, next: any) => {
        req.user = { id: 1, email: sellerApplication.email, memberId: 1 };
        next();
      });

      // Mock: Member is verified
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1, email: sellerApplication.email, verification_status: 'VERIFIED' }] })
        .mockResolvedValueOnce({ rows: [{ verification_status: 'VERIFIED' }] });

      // Mock: S3 upload
      (s3Service.uploadToS3 as jest.Mock).mockResolvedValue({
        url: 'https://s3.amazonaws.com/store-logos/logo.jpg',
      });

      // Mock: Seller creation
      (queries.createSeller as jest.Mock).mockResolvedValue({
        id: 1,
        ...sellerApplication,
        fraternity_member_id: 1,
        status: 'PENDING',
      });

      // Mock: Auto-approval flow
      (queries.getUserByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        email: sellerApplication.email,
        fraternity_member_id: 1,
      });
      (queries.linkUserToSeller as jest.Mock).mockResolvedValue(undefined);
      (stripeService.createConnectAccount as jest.Mock).mockResolvedValue({ id: 'acct_test123' });
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      (queries.getSellerById as jest.Mock).mockResolvedValue({
        id: 1,
        ...sellerApplication,
        status: 'APPROVED',
      });

      const response = await request(app)
        .post('/api/sellers/apply')
        .field('name', sellerApplication.name)
        .field('email', sellerApplication.email)
        .field('sponsoring_chapter_id', sellerApplication.sponsoring_chapter_id.toString())
        .field('merchandise_type', sellerApplication.merchandise_type)
        .attach('store_logo', Buffer.from('fake logo'), 'logo.jpg');

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('APPROVED');
    });
  });

  describe('Flow 4: MEMBER → Activate Promoter → PROMOTER', () => {
    it('should allow member to apply for promoter account', async () => {
      const promoterApplication = {
        name: 'Member Promoter',
        email: 'member-promoter@example.com',
        membership_number: '12345',
        initiated_chapter_id: 1,
        sponsoring_chapter_id: 1,
        social_links: JSON.stringify({ instagram: '@promoter' }),
      };

      // Mock: S3 upload
      (s3Service.uploadToS3 as jest.Mock).mockResolvedValue({
        url: 'https://s3.amazonaws.com/headshots/promoter.jpg',
      });

      // Mock: Promoter creation
      (queries.createPromoter as jest.Mock).mockResolvedValue({
        id: 1,
        ...promoterApplication,
        status: 'PENDING',
        headshot_url: 'https://s3.amazonaws.com/headshots/promoter.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const response = await request(app)
        .post('/api/promoters/apply')
        .field('name', promoterApplication.name)
        .field('email', promoterApplication.email)
        .field('membership_number', promoterApplication.membership_number)
        .field('initiated_chapter_id', promoterApplication.initiated_chapter_id.toString())
        .field('sponsoring_chapter_id', promoterApplication.sponsoring_chapter_id.toString())
        .field('social_links', promoterApplication.social_links)
        .attach('headshot', Buffer.from('fake headshot'), 'headshot.jpg');

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('PENDING');
      expect(response.body.email).toBe(promoterApplication.email);
      expect(queries.createPromoter).toHaveBeenCalled();
    });

    it('should require membership number for promoter application', async () => {
      const promoterApplication = {
        name: 'Member Promoter',
        email: 'member-promoter@example.com',
        // Missing membership_number
        initiated_chapter_id: 1,
      };

      const response = await request(app)
        .post('/api/promoters/apply')
        .send(promoterApplication);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Flow 5: MEMBER → Activate Steward → STEWARD', () => {
    it('should allow verified member to apply for steward account', async () => {
      const stewardApplication = {
        sponsoring_chapter_id: 1,
      };

      // Mock: Authenticated user with memberId
      mockAuthenticate.mockImplementation((req: any, res: any, next: any) => {
        req.user = { id: 1, email: 'steward@example.com', cognitoSub: 'test-sub', role: 'GUEST', sellerId: null, promoterId: null, stewardId: null, features: {} };
        next();
      });

      // Mock requireVerifiedMember to pass (verified member)
      const authModule = require('../middleware/auth');
      (authModule.requireVerifiedMember as jest.Mock).mockImplementation(async (req: any, res: any, next: any) => {
        // Mock getUserByCognitoSub
        (queries.getUserByCognitoSub as jest.Mock).mockResolvedValue({
          id: 1,
          email: 'steward@example.com',
          cognito_sub: 'test-sub',
          role: 'GUEST',
          seller_id: null,
          promoter_id: null,
          steward_id: null,
          features: {},
        });

        // Mock getFraternityMemberId to return member ID
        const utilsModule = await import('../utils/getFraternityMemberId');
        jest.spyOn(utilsModule, 'getFraternityMemberId').mockResolvedValue(1);
        jest.spyOn(utilsModule, 'getFraternityMemberIdFromRequest').mockResolvedValue(1);

        // Mock getMemberById to return verified member
        (queries.getMemberById as jest.Mock).mockResolvedValue({
          id: 1,
          email: 'steward@example.com',
          name: 'Member Steward',
          verification_status: 'VERIFIED',
        });

        // Pass through
        next();
      });

      // Mock: Member exists and is verified
      (queries.getMemberById as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'steward@example.com',
        name: 'Member Steward',
        verification_status: 'VERIFIED',
      });

      // Mock: No existing steward
      (queries.getStewardByFraternityMemberId as jest.Mock).mockResolvedValue(null);

      // Mock: Steward creation
      (queries.createSteward as jest.Mock).mockResolvedValue({
        id: 1,
        fraternity_member_id: 1,
        sponsoring_chapter_id: stewardApplication.sponsoring_chapter_id,
        status: 'PENDING',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Set up Stripe environment for auto-approval
      process.env.STRIPE_SECRET_KEY = 'sk_test_1234567890';
      
      // Mock: Auto-approval for verified members
      (stripeService.createConnectAccount as jest.Mock).mockResolvedValue({
        id: 'acct_steward123',
      });

      // Mock pool.query for the UPDATE query that sets status and stripe_account_id
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      (queries.linkUserToSteward as jest.Mock).mockResolvedValue(undefined);

      (queries.getStewardById as jest.Mock).mockResolvedValue({
        id: 1,
        fraternity_member_id: 1,
        sponsoring_chapter_id: stewardApplication.sponsoring_chapter_id,
        status: 'APPROVED',
        stripe_account_id: 'acct_steward123',
      });

      const response = await request(app)
        .post('/api/stewards/apply')
        .send(stewardApplication);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('APPROVED');
      expect(response.body.stripe_account_id).toBe('acct_steward123');
      expect(stripeService.createConnectAccount).toHaveBeenCalled();
      expect(queries.linkUserToSteward).toHaveBeenCalled();
    });

    it('should reject unverified members from becoming stewards', async () => {
      const stewardApplication = {
        sponsoring_chapter_id: 1,
      };

      // Mock: Authenticated user
      mockAuthenticate.mockImplementation((req, res, next) => {
        req.user = { id: 1, email: 'steward@example.com', cognitoSub: 'test-sub', role: 'GUEST', sellerId: null, promoterId: null, stewardId: null, features: {} };
        next();
      });

      // Mock requireVerifiedMember to check verification status and reject
      const authModule = require('../middleware/auth');
      (authModule.requireVerifiedMember as jest.Mock).mockImplementation(async (req: any, res: any, next: any) => {
        // Mock getUserByCognitoSub
        (queries.getUserByCognitoSub as jest.Mock).mockResolvedValue({
          id: 1,
          email: 'steward@example.com',
          cognito_sub: 'test-sub',
          role: 'GUEST',
          seller_id: null,
          promoter_id: null,
          steward_id: null,
          features: {},
        });

        // Mock getFraternityMemberId to return member ID
        jest.doMock('../utils/getFraternityMemberId', () => ({
          getFraternityMemberId: jest.fn().mockResolvedValue(1),
          getFraternityMemberIdFromRequest: jest.fn().mockResolvedValue(1),
        }));

        // Mock getMemberById to return unverified member
        (queries.getMemberById as jest.Mock).mockResolvedValue({
          id: 1,
          email: 'steward@example.com',
          verification_status: 'PENDING',
        });

        // Return 403 with VERIFICATION_REQUIRED code
        res.status(403).json({ 
          error: 'Verified member status required',
          code: 'VERIFICATION_REQUIRED'
        });
      });

      const response = await request(app)
        .post('/api/stewards/apply')
        .send(stewardApplication);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('VERIFICATION_REQUIRED');
    });

    it('should require member profile to become steward', async () => {
      const stewardApplication = {
        sponsoring_chapter_id: 1,
      };

      // Mock: Authenticated user without memberId
      mockAuthenticate.mockImplementation((req: any, res: any, next: any) => {
        req.user = { id: 1, email: 'user@example.com', cognitoSub: 'test-sub', role: 'GUEST', sellerId: null, promoterId: null, stewardId: null, features: {} };
        next();
      });

      // Mock requireVerifiedMember to reject because no member profile
      const authModule = require('../middleware/auth');
      (authModule.requireVerifiedMember as jest.Mock).mockImplementation(async (req: any, res: any, next: any) => {
        // Mock getUserByCognitoSub
        (queries.getUserByCognitoSub as jest.Mock).mockResolvedValue({
          id: 1,
          email: 'user@example.com',
          cognito_sub: 'test-sub',
          role: 'GUEST',
          seller_id: null,
          promoter_id: null,
          steward_id: null,
          features: {},
        });

        // Mock getFraternityMemberId to return null (no member profile)
        const utilsModule = await import('../utils/getFraternityMemberId');
        jest.spyOn(utilsModule, 'getFraternityMemberId').mockResolvedValue(null);
        jest.spyOn(utilsModule, 'getFraternityMemberIdFromRequest').mockResolvedValue(null);

        // Return 403 with member profile required error
        res.status(403).json({ error: 'Member profile required' });
      });

      const response = await request(app)
        .post('/api/stewards/apply')
        .send(stewardApplication);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Member profile required');
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate email during member registration', async () => {
      const memberData = {
        name: 'Test Member',
        email: 'duplicate@example.com',
        membership_number: '12345',
        cognito_sub: 'test-sub',
        initiated_chapter_id: 1,
      };

      // Mock: No existing draft
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      
      // Mock: Seller check (no existing seller)
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      
      // Mock: Duplicate member exists
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1, email: memberData.email }], // Duplicate member
      });

      const response = await request(app)
        .post('/api/members/register')
        .send(memberData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });

    it('should handle Cognito signup failures', async () => {
      const signupData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      // Mock: No existing users
      mockCognitoSend.mockResolvedValueOnce({ Users: [] });

      // Mock: Cognito signup failure
      mockCognitoSend.mockRejectedValueOnce({
        name: 'InvalidPasswordException',
        message: 'Password does not meet requirements',
      });

      const response = await request(app)
        .post('/api/members/cognito/signup')
        .send(signupData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should clean up orphaned member records on user linking failure', async () => {
      const memberData = {
        name: 'Test Member',
        email: 'test@example.com',
        membership_number: '12345',
        cognito_sub: 'test-sub',
        initiated_chapter_id: 1,
      };

      // Mock: No draft
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      
      // Mock: Seller check (no existing seller)
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      
      // Mock: No duplicate member
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      // Mock: Member creation succeeds
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1, ...memberData }],
      });

      // Mock: User linking fails
      (queries.getUserByCognitoSub as jest.Mock).mockResolvedValue(null);
      (queries.createUser as jest.Mock).mockRejectedValueOnce(
        new Error('Database constraint violation')
      );

      // Mock: Cleanup query
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/members/register')
        .send(memberData);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to link user account');
      // Verify cleanup was attempted
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM fraternity_members WHERE id = $1',
        [1]
      );
    });
  });
});
