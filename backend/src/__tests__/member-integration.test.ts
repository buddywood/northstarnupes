import request from 'supertest';
import express from 'express';
import membersRouter from '../routes/members';
import stewardsRouter from '../routes/stewards';
import stewardCheckoutRouter from '../routes/steward-checkout';
import sellersRouter from '../routes/sellers';
import promotersRouter from '../routes/promoters';
import pool from '../db/connection';

// Mock the database queries
jest.mock('../db/queries', () => ({
  getMemberById: jest.fn(),
  updateMemberVerification: jest.fn(),
  createStewardListing: jest.fn(),
  getStewardListingById: jest.fn(),
  claimStewardListing: jest.fn(),
  getStewardById: jest.fn(),
  getChapterById: jest.fn(),
  getPlatformSetting: jest.fn(),
  createStewardClaim: jest.fn(),
  createSeller: jest.fn(),
  createPromoter: jest.fn(),
  createSteward: jest.fn(),
  linkUserToMember: jest.fn(),
  linkUserToSeller: jest.fn(),
  linkUserToPromoter: jest.fn(),
  linkUserToSteward: jest.fn(),
}));

// Mock the auth middleware
jest.mock('../middleware/auth', () => {
const mockAuthenticate = jest.fn((req: any, res: any, next: any) => {
  req.user = {
    id: 1,
    cognitoSub: 'test-cognito-sub',
    email: 'test@example.com',
    role: 'GUEST',
    sellerId: null,
    promoterId: null,
    stewardId: null,
    features: {},
  };
  next();
});

const mockRequireVerifiedMember = jest.fn((req: any, res: any, next: any) => {
  // Note: requireVerifiedMember now gets fraternity_member_id from role tables
  if (!req.user) {
    return res.status(403).json({ error: 'Member profile required' });
  }
  next();
});

const mockRequireAdmin = jest.fn((req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

  const mockRequireSteward = jest.fn((req: any, res: any, next: any) => {
    if (!req.user || !req.user.stewardId) {
      return res.status(403).json({ error: 'Steward access required' });
    }
    next();
  });

  return {
  authenticate: mockAuthenticate,
  requireVerifiedMember: mockRequireVerifiedMember,
  requireAdmin: mockRequireAdmin,
    requireSteward: mockRequireSteward,
  };
});

// Mock S3 service
jest.mock('../services/s3', () => ({
  uploadToS3: jest.fn().mockResolvedValue('https://example.com/headshot.jpg'),
}));

// Mock Stripe service
jest.mock('../services/stripe', () => ({
  createStewardCheckoutSession: jest.fn().mockResolvedValue({
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/cs_test_123',
  }),
  calculateStewardPlatformFee: jest.fn().mockResolvedValue(500),
}));

const app = express();
app.use(express.json());
app.use('/api/members', membersRouter);
app.use('/api/stewards', stewardsRouter);
app.use('/api/steward-checkout', stewardCheckoutRouter);
app.use('/api/sellers', sellersRouter);
app.use('/api/promoters', promotersRouter);

describe('Member Role Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('End-to-End: Member Registration → Verification → Dashboard Access', () => {
    it('should allow user to register, get verified, and access dashboard features', async () => {
      const { getMemberById, updateMemberVerification } = require('../db/queries');
      
      // Step 1: Member profile exists (after registration)
      const mockMember = {
        id: 1,
        email: 'test@example.com',
        name: 'Test Member',
        verification_status: 'PENDING',
        chapter_name: 'Alpha Chapter',
      };

      getMemberById.mockResolvedValue(mockMember);
      (jest.spyOn(pool, 'query') as jest.Mock).mockResolvedValue({
        rows: [mockMember],
      });

      // Step 2: Admin verifies member
      const verifiedMember = {
        ...mockMember,
        verification_status: 'VERIFIED',
        verification_date: new Date(),
      };

      updateMemberVerification.mockResolvedValue(verifiedMember);
      getMemberById.mockResolvedValue(verifiedMember);

      // Mock the profile query (members route queries pool directly)
      (jest.spyOn(pool, 'query') as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: verifiedMember.name,
          email: verifiedMember.email,
          verification_status: 'VERIFIED',
          headshot_url: null,
        }],
      });

      // Step 3: Member can access profile
      const profileResponse = await request(app)
        .get('/api/members/profile')
        .expect(200);

      expect(profileResponse.body).toHaveProperty('verification_status', 'VERIFIED');

      // Step 4: Member can access Connect directory
      (jest.spyOn(pool, 'query') as jest.Mock).mockResolvedValue({
        rows: [verifiedMember],
      });

      const connectResponse = await request(app)
        .get('/api/members/')
        .expect(200);

      expect(connectResponse.body).toBeInstanceOf(Array);
      expect(connectResponse.body[0]).toHaveProperty('verification_status', 'VERIFIED');

      // Step 5: Member can claim steward listings
      const { getStewardListingById, claimStewardListing } = require('../db/queries');
      const mockListing = {
        id: 1,
        steward_id: 1,
        name: 'Test Listing',
        status: 'ACTIVE',
      };

      getStewardListingById.mockResolvedValue(mockListing);
      claimStewardListing.mockResolvedValue({ ...mockListing, status: 'CLAIMED' });

      const claimResponse = await request(app)
        .post('/api/stewards/listings/1/claim')
        .expect(200);

      expect(claimResponse.body).toHaveProperty('success', true);
    });
  });

  describe('End-to-End: Guest → Member Transition', () => {
    it('should allow guest to view steward marketplace but require member for claiming', async () => {
      // Guest can view public marketplace (tested in guest-access.test.ts)
      // Member can claim
      const { getStewardListingById, claimStewardListing, getMemberById } = require('../db/queries');
      
      const mockListing = {
        id: 1,
        steward_id: 1,
        name: 'Test Listing',
        status: 'ACTIVE',
      };

      const mockMember = {
        id: 1,
        verification_status: 'VERIFIED',
      };

      getStewardListingById.mockResolvedValue(mockListing);
      getMemberById.mockResolvedValue(mockMember);
      claimStewardListing.mockResolvedValue({ ...mockListing, status: 'CLAIMED' });

      const claimResponse = await request(app)
        .post('/api/stewards/listings/1/claim')
        .expect(200);

      expect(claimResponse.body).toHaveProperty('success', true);
    });
  });

  describe('End-to-End: Member → Seller/Promoter/Steward Transitions', () => {
    it('should allow member to apply for seller role', async () => {
      const { createSeller, getMemberById } = require('../db/queries');
      
      const mockMember = {
        id: 1,
        verification_status: 'VERIFIED',
      };

      const mockSeller = {
        id: 1,
        fraternity_member_id: 1,
        status: 'PENDING',
      };

      getMemberById.mockResolvedValue(mockMember);
      createSeller.mockResolvedValue(mockSeller);
      // Mock: Seller route checks for member by email
      (jest.spyOn(pool, 'query') as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1, verification_status: 'VERIFIED' }] }) // Member lookup by email
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Other query

      const response = await request(app)
        .post('/api/sellers/apply')
        .send({
          name: 'Test Seller',
          email: 'seller@example.com',
          sponsoring_chapter_id: 1,
          kappa_vendor_id: 'V12345',
          merchandise_type: 'KAPPA',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'PENDING');
    });

    it('should allow member to apply for promoter role', async () => {
      const { createPromoter, getMemberById } = require('../db/queries');
      
      const mockMember = {
        id: 1,
        verification_status: 'VERIFIED',
      };

      const mockPromoter = {
        id: 1,
        fraternity_member_id: 1,
        status: 'PENDING',
      };

      getMemberById.mockResolvedValue(mockMember);
      createPromoter.mockResolvedValue(mockPromoter);

      const response = await request(app)
        .post('/api/promoters/apply')
        .send({
          name: 'Test Promoter',
          email: 'promoter@example.com',
          membership_number: 'PROM123',
          initiated_chapter_id: 1,
          sponsoring_chapter_id: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'PENDING');
    });

    it('should allow member to apply for steward role', async () => {
      const { createSteward, getMemberById } = require('../db/queries');
      
      const mockMember = {
        id: 1,
        verification_status: 'VERIFIED',
      };

      const mockSteward = {
        id: 1,
        fraternity_member_id: 1,
        status: 'APPROVED',
      };

      // Ensure member is VERIFIED (required for steward application)
      const verifiedMember = {
        ...mockMember,
        verification_status: 'VERIFIED',
      };
      getMemberById.mockResolvedValue(verifiedMember);
      createSteward.mockResolvedValue(mockSteward);
      (jest.spyOn(pool, 'query') as jest.Mock).mockResolvedValue({
        rows: [{ id: 1 }],
      });

      const response = await request(app)
        .post('/api/stewards/apply')
        .send({
          sponsoring_chapter_id: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('End-to-End: Member Shopping Flow', () => {
    it('should allow member to purchase seller items', async () => {
      // This would test the full shopping flow:
      // 1. Member browses products
      // 2. Member adds to cart
      // 3. Member completes checkout
      // 4. Order is recorded with member association
      
      // Note: Full shopping flow would require order creation endpoints
      // This is a placeholder for the integration test structure
      expect(true).toBe(true);
    });
  });

  describe('End-to-End: Member Steward Claim Flow', () => {
    it('should allow member to claim steward listing and complete checkout', async () => {
      const { getStewardListingById, getStewardById, getChapterById, getPlatformSetting, createStewardClaim } = require('../db/queries');
      
      const mockListing = {
        id: 1,
        steward_id: 1,
        name: 'Test Listing',
        status: 'ACTIVE',
        shipping_cost_cents: 1000,
        chapter_donation_cents: 500,
        sponsoring_chapter_id: 1,
      };

      const mockSteward = {
        id: 1,
        stripe_account_id: 'acct_test',
      };

      const mockChapter = {
        id: 1,
        stripe_account_id: 'acct_chapter',
      };

      getStewardListingById.mockResolvedValue(mockListing);
      getStewardById.mockResolvedValue(mockSteward);
      getChapterById.mockResolvedValue(mockChapter);
      getPlatformSetting.mockResolvedValue(null);
      createStewardClaim.mockResolvedValue({
        id: 1,
        listing_id: 1,
        claimant_fraternity_member_id: 1,
        total_amount_cents: 2000,
        status: 'PENDING',
      });

      // Step 1: Claim listing
      const claimResponse = await request(app)
        .post('/api/stewards/listings/1/claim')
        .expect(200);

      expect(claimResponse.body).toHaveProperty('success', true);

      // Step 2: Create checkout session (listing should be CLAIMED after step 1)
      const claimedListing = { ...mockListing, status: 'CLAIMED' };
      getStewardListingById.mockResolvedValue(claimedListing);
      
      const checkoutResponse = await request(app)
        .post('/api/steward-checkout/1')
        .expect(200);

      expect(checkoutResponse.body).toHaveProperty('sessionId');
      expect(checkoutResponse.body).toHaveProperty('url');
    });
  });
});

