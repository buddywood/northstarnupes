import request from "supertest";
import express from "express";
import membersRouter from "../routes/members";
import stewardsRouter from "../routes/stewards";
import stewardCheckoutRouter from "../routes/steward-checkout";
import adminRouter from "../routes/admin";
import sellersRouter from "../routes/sellers";
import promotersRouter from "../routes/promoters";
import pool from "../db/connection";

// Mock the database queries
jest.mock("../db/queries", () => ({
  getMemberById: jest.fn(),
  updateMemberVerification: jest.fn(),
  getPendingMembersForVerification: jest.fn(),
  createStewardListing: jest.fn(),
  getStewardListingById: jest.fn(),
  getActiveStewardListings: jest.fn(),
  claimStewardListing: jest.fn(),
  getStewardById: jest.fn(),
  getChapterById: jest.fn(),
  getPlatformSetting: jest.fn(),
  createStewardClaim: jest.fn(),
  createSeller: jest.fn(),
  createPromoter: jest.fn(),
  createSteward: jest.fn(),
  getUserByCognitoSub: jest.fn(),
}));

// Mock the auth middleware
jest.mock("../middleware/auth", () => {
  const mockAuthenticate = jest.fn((req: any, res: any, next: any) => {
    req.user = {
      id: 1,
      cognitoSub: "test-cognito-sub",
      email: "test@example.com",
      role: "GUEST",
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
      return res.status(403).json({ error: "Member profile required" });
    }
    next();
  });

  const mockRequireAdmin = jest.fn((req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  });

  const mockRequireSteward = jest.fn((req: any, res: any, next: any) => {
    if (!req.user || !req.user.stewardId) {
      return res.status(403).json({ error: "Steward access required" });
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
jest.mock("../services/s3", () => ({
  uploadToS3: jest.fn().mockResolvedValue("https://example.com/headshot.jpg"),
}));

// Mock Stripe service
jest.mock("../services/stripe", () => ({
  createStewardCheckoutSession: jest.fn().mockResolvedValue({
    id: "cs_test_123",
    url: "https://checkout.stripe.com/cs_test_123",
  }),
  calculateStewardPlatformFee: jest.fn().mockResolvedValue(500),
}));

const app = express();
app.use(express.json());
app.use("/api/members", membersRouter);
app.use("/api/stewards", stewardsRouter);
app.use("/api/steward-checkout", stewardCheckoutRouter);
app.use("/api/admin", adminRouter);
app.use("/api/sellers", sellersRouter);
app.use("/api/promoters", promotersRouter);

describe("Member Role Functionality", () => {
  let mockAuthenticate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mocked authenticate function
    const authModule = require("../middleware/auth");
    mockAuthenticate = authModule.authenticate as jest.Mock;

    // Reset default user for each test
    mockAuthenticate.mockImplementation((req: any, res: any, next: any) => {
      req.user = {
        id: 1,
        cognitoSub: "test-cognito-sub",
        email: "test@example.com",
        role: "GUEST",
        sellerId: null,
        promoterId: null,
        stewardId: null,
        features: {},
      };
      next();
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Member Profile Retrieval", () => {
    it("should retrieve member profile for authenticated member", async () => {
      const { getMemberById, getUserByCognitoSub } = require("../db/queries");

      const mockMember = {
        id: 1,
        email: "test@example.com",
        name: "Test Member",
        membership_number: "12345",
        initiated_chapter_id: 1,
        chapter_name: "Alpha Chapter",
        initiated_year: 2020,
        industry: "Technology",
        profession_id: 1,
        profession_name: "Software Engineer",
        verification_status: "VERIFIED",
        headshot_url: "https://example.com/headshot.jpg",
        social_links: { linkedin: "https://linkedin.com/test" },
      };

      // Mock getUserByCognitoSub to return a user (GUEST role)
      getUserByCognitoSub.mockResolvedValue({
        id: 1,
        cognito_sub: "test-cognito-sub",
        email: "test@example.com",
        role: "GUEST",
        seller_id: null,
        promoter_id: null,
        steward_id: null,
        features: {},
      });

      getMemberById.mockResolvedValue(mockMember);

      // Mock pool.query for getFraternityMemberId (looks up fraternity_member by email/cognito_sub)
      (jest.spyOn(pool, "query") as jest.Mock).mockImplementation(
        (query: string) => {
          if (query.includes("fraternity_members") && query.includes("email")) {
            // Return member ID for getFraternityMemberId lookup
            return Promise.resolve({ rows: [{ id: 1 }] });
          }
          // Return full member for profile query
          return Promise.resolve({ rows: [mockMember] });
        }
      );

      const response = await request(app)
        .get("/api/members/profile")
        .expect(200);

      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("name", "Test Member");
      expect(response.body).toHaveProperty("verification_status", "VERIFIED");
    });

    it("should return 404 if member profile not found", async () => {
      const authModule = require("../middleware/auth");
      (authModule.authenticate as jest.Mock).mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = {
            id: 1,
            cognitoSub: "test-cognito-sub",
            email: "test@example.com",
            role: "GUEST",
            sellerId: null,
            promoterId: null,
            stewardId: null,
            features: {},
          };
          next();
        }
      );

      // Mock getFraternityMemberIdFromRequest to return null (no member profile)
      const utilsModule = await import("../utils/getFraternityMemberId");
      jest
        .spyOn(utilsModule, "getFraternityMemberIdFromRequest")
        .mockResolvedValue(null);

      const response = await request(app)
        .get("/api/members/profile")
        .expect(404);

      expect(response.body).toHaveProperty("error", "Member profile not found");
    });
  });

  describe("Member Profile Updates", () => {
    it("should update member profile", async () => {
      const { getMemberById } = require("../db/queries");

      // Mock getFraternityMemberIdFromRequest to return member ID
      const utilsModule = await import("../utils/getFraternityMemberId");
      jest
        .spyOn(utilsModule, "getFraternityMemberIdFromRequest")
        .mockResolvedValue(1);

      const mockMember = {
        id: 1,
        email: "test@example.com",
        name: "Test Member",
        verification_status: "VERIFIED",
      };

      getMemberById.mockResolvedValue(mockMember);
      (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
        rows: [{ ...mockMember, name: "Updated Name" }],
      });

      const response = await request(app)
        .put("/api/members/profile")
        .send({
          name: "Updated Name",
          industry: "Finance",
        })
        .expect(200);

      expect(response.body).toHaveProperty("name", "Updated Name");
    });
  });

  describe("Connect Directory Search", () => {
    it("should return verified members only", async () => {
      const mockMembers = [
        {
          id: 1,
          name: "Member One",
          email: "member1@example.com",
          chapter_name: "Alpha Chapter",
          initiated_year: 2020,
          industry: "Technology",
          profession_name: "Software Engineer",
          location: "New York, NY",
          verification_status: "VERIFIED",
          is_seller: false,
          is_promoter: false,
          is_steward: false,
        },
        {
          id: 2,
          name: "Member Two",
          email: "member2@example.com",
          chapter_name: "Beta Chapter",
          initiated_year: 2019,
          industry: "Finance",
          profession_name: "Financial Analyst",
          location: "Los Angeles, CA",
          verification_status: "VERIFIED",
          is_seller: true,
          is_promoter: false,
          is_steward: false,
        },
      ];

      (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
        rows: mockMembers,
      });

      const response = await request(app).get("/api/members/").expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty(
        "verification_status",
        "VERIFIED"
      );
      expect(response.body[1]).toHaveProperty("is_seller", true);
    });

    it("should filter members by chapter", async () => {
      const mockMembers = [
        {
          id: 1,
          name: "Member One",
          chapter_name: "Alpha Chapter",
          initiated_chapter_id: 1,
          verification_status: "VERIFIED",
        },
      ];

      (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
        rows: mockMembers,
      });

      const response = await request(app)
        .get("/api/members/?chapter_id=1")
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty("initiated_chapter_id", 1);
    });

    it("should filter members by industry", async () => {
      const mockMembers = [
        {
          id: 1,
          name: "Member One",
          industry: "Technology",
          verification_status: "VERIFIED",
        },
      ];

      (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
        rows: mockMembers,
      });

      const response = await request(app)
        .get("/api/members/?industry=Technology")
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty("industry", "Technology");
    });

    it("should filter members by profession", async () => {
      const mockMembers = [
        {
          id: 1,
          name: "Member One",
          profession_id: 1,
          profession_name: "Software Engineer",
          verification_status: "VERIFIED",
        },
      ];

      (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
        rows: mockMembers,
      });

      const response = await request(app)
        .get("/api/members/?profession_id=1")
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty("profession_id", 1);
    });

    it("should filter members by location", async () => {
      const mockMembers = [
        {
          id: 1,
          name: "Member One",
          location: "New York, NY",
          verification_status: "VERIFIED",
        },
      ];

      (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
        rows: mockMembers,
      });

      const response = await request(app)
        .get("/api/members/?location=New York")
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty("location", "New York, NY");
    });

    it("should require authentication", async () => {
      const authModule = require("../middleware/auth");
      (authModule.authenticate as jest.Mock).mockImplementation(
        (req: any, res: any, next: any) => {
          return res
            .status(401)
            .json({ error: "No authorization token provided" });
        }
      );

      const response = await request(app).get("/api/members/").expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Member Verification Workflow", () => {
    it("should allow admin to update member verification status", async () => {
      const { updateMemberVerification } = require("../db/queries");
      const authModule = require("../middleware/auth");

      (authModule.authenticate as jest.Mock).mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = {
            id: 1,
            role: "ADMIN",
          };
          next();
        }
      );

      const mockUpdatedMember = {
        id: 1,
        verification_status: "VERIFIED",
        verification_date: new Date(),
        verification_notes: "Verified by admin",
      };

      updateMemberVerification.mockResolvedValue(mockUpdatedMember);

      const response = await request(app)
        .put("/api/admin/members/1/verification")
        .send({
          verification_status: "VERIFIED",
          verification_notes: "Verified by admin",
        })
        .expect(200);

      expect(response.body).toHaveProperty("verification_status", "VERIFIED");
    });

    it("should require admin role for verification", async () => {
      const authModule = require("../middleware/auth");
      (authModule.authenticate as jest.Mock).mockImplementation(
        (req: any, res: any, next: any) => {
          req.user = {
            id: 1,
            role: "GUEST", // Not admin
          };
          next();
        }
      );

      const response = await request(app)
        .put("/api/admin/members/1/verification")
        .send({
          verification_status: "VERIFIED",
        })
        .expect(403);

      expect(response.body).toHaveProperty("error", "Admin access required");
    });
  });

  describe("Steward Marketplace Access", () => {
    it("should allow verified members to access steward marketplace", async () => {
      const {
        getActiveStewardListings,
        getStewardById,
        getMemberById,
      } = require("../db/queries");

      const mockListings = [
        {
          id: 1,
          steward_id: 1,
          name: "Test Listing",
          status: "ACTIVE",
        },
      ];

      const mockSteward = {
        id: 1,
        fraternity_member_id: 1,
        status: "APPROVED",
      };

      const mockMember = {
        id: 1,
        verification_status: "VERIFIED",
      };

      getActiveStewardListings.mockResolvedValue(mockListings);
      getStewardById.mockResolvedValue(mockSteward);
      getMemberById.mockResolvedValue(mockMember);
      (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
        rows: [{ id: 1, name: "Test Chapter" }],
      });

      const response = await request(app)
        .get("/api/stewards/marketplace")
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it("should require verified member status for marketplace", async () => {
      const authModule = require("../middleware/auth");
      (authModule.requireVerifiedMember as jest.Mock).mockImplementation(
        (req: any, res: any, next: any) => {
          return res
            .status(403)
            .json({ error: "Verified member status required" });
        }
      );

      const response = await request(app)
        .get("/api/stewards/marketplace")
        .expect(403);

      expect(response.body).toHaveProperty(
        "error",
        "Verified member status required"
      );
    });
  });

  describe("Steward Listing Claim", () => {
    it.skip("should allow verified members to claim steward listings", async () => {
      const {
        getStewardListingById,
        claimStewardListing,
        getMemberById,
      } = require("../db/queries");

      const mockListing = {
        id: 1,
        steward_id: 1,
        name: "Test Listing",
        status: "ACTIVE",
      };

      const mockMember = {
        id: 1,
        email: "test@example.com",
        name: "Test Member",
        verification_status: "VERIFIED",
      };

      getStewardListingById.mockResolvedValue(mockListing);
      getMemberById.mockResolvedValue(mockMember);
      claimStewardListing.mockResolvedValue({
        ...mockListing,
        status: "CLAIMED",
      });

      const response = await request(app)
        .post("/api/stewards/listings/1/claim")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("listing");
    });

    it("should require verified member status for claiming", async () => {
      const authModule = require("../middleware/auth");
      (authModule.requireVerifiedMember as jest.Mock).mockImplementation(
        (req: any, res: any, next: any) => {
          return res
            .status(403)
            .json({ error: "Verified member status required" });
        }
      );

      const response = await request(app)
        .post("/api/stewards/listings/1/claim")
        .expect(403);

      expect(response.body).toHaveProperty(
        "error",
        "Verified member status required"
      );
    });
  });

  describe("Steward Checkout Session", () => {
    it.skip("should create checkout session for verified members", async () => {
      const {
        getStewardListingById,
        getStewardById,
        getChapterById,
        getPlatformSetting,
      } = require("../db/queries");

      const mockListing = {
        id: 1,
        steward_id: 1,
        name: "Test Listing",
        status: "ACTIVE",
        shipping_cost_cents: 1000,
        chapter_donation_cents: 500,
        sponsoring_chapter_id: 1,
      };

      const mockSteward = {
        id: 1,
        stripe_account_id: "acct_test",
      };

      const mockChapter = {
        id: 1,
        stripe_account_id: "acct_chapter",
      };

      // Listing should be ACTIVE or CLAIMED for checkout
      const activeListing = { ...mockListing, status: "ACTIVE" };
      getStewardListingById.mockResolvedValue(activeListing);
      getStewardById.mockResolvedValue(mockSteward);
      getChapterById.mockResolvedValue(mockChapter);
      getPlatformSetting.mockResolvedValue(null);
      const { createStewardClaim } = require("../db/queries");
      createStewardClaim.mockResolvedValue({
        id: 1,
        listing_id: 1,
        claimant_fraternity_member_id: 1,
        total_amount_cents: 2000,
        status: "PENDING",
      });

      const response = await request(app)
        .post("/api/steward-checkout/1")
        .expect(200);

      expect(response.body).toHaveProperty("sessionId");
      expect(response.body).toHaveProperty("url");
    });

    it("should require verified member status for checkout", async () => {
      const authModule = require("../middleware/auth");
      (authModule.requireVerifiedMember as jest.Mock).mockImplementation(
        (req: any, res: any, next: any) => {
          return res
            .status(403)
            .json({ error: "Verified member status required" });
        }
      );

      const response = await request(app)
        .post("/api/steward-checkout/1")
        .expect(403);

      expect(response.body).toHaveProperty(
        "error",
        "Verified member status required"
      );
    });
  });

  describe("Role Transitions", () => {
    it.skip("should allow members to apply to become sellers", async () => {
      const { createSeller, getMemberById } = require("../db/queries");

      const mockMember = {
        id: 1,
        verification_status: "VERIFIED",
      };

      const mockSeller = {
        id: 1,
        fraternity_member_id: 1,
        status: "PENDING",
      };

      getMemberById.mockResolvedValue(mockMember);
      createSeller.mockResolvedValue(mockSeller);
      // Mock: Seller route checks for member by email
      (jest.spyOn(pool, "query") as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 1, verification_status: "VERIFIED" }],
        }) // Member lookup by email
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Other query

      const response = await request(app)
        .post("/api/sellers/apply")
        .send({
          name: "Test Seller",
          email: "seller@example.com",
          sponsoring_chapter_id: 1,
          kappa_vendor_id: "V12345",
          merchandise_type: "KAPPA",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("status", "PENDING");
    });

    it.skip("should allow members to apply to become promoters", async () => {
      const { createPromoter, getMemberById } = require("../db/queries");

      const mockMember = {
        id: 1,
        verification_status: "VERIFIED",
      };

      const mockPromoter = {
        id: 1,
        fraternity_member_id: 1,
        status: "PENDING",
      };

      getMemberById.mockResolvedValue(mockMember);
      createPromoter.mockResolvedValue(mockPromoter);

      const response = await request(app)
        .post("/api/promoters/apply")
        .send({
          name: "Test Promoter",
          email: "promoter@example.com",
          membership_number: "PROM123",
          initiated_chapter_id: 1,
          sponsoring_chapter_id: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("status", "PENDING");
    });

    it.skip("should allow members to apply to become stewards", async () => {
      const { createSteward, getMemberById } = require("../db/queries");

      const mockMember = {
        id: 1,
        verification_status: "VERIFIED",
      };

      const mockSteward = {
        id: 1,
        fraternity_member_id: 1,
        status: "APPROVED", // Auto-approved for verified members
      };

      // Ensure member is VERIFIED (required for steward application)
      const verifiedMember = {
        ...mockMember,
        verification_status: "VERIFIED",
      };
      getMemberById.mockResolvedValue(verifiedMember);
      createSteward.mockResolvedValue(mockSteward);
      (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
        rows: [{ id: 1 }],
      });

      const response = await request(app)
        .post("/api/stewards/apply")
        .send({
          sponsoring_chapter_id: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
    });
  });

  describe("Member Data Privacy", () => {
    it("should not expose member details to unauthenticated requests", async () => {
      const authModule = require("../middleware/auth");
      (authModule.authenticate as jest.Mock).mockImplementation(
        (req: any, res: any, next: any) => {
          return res
            .status(401)
            .json({ error: "No authorization token provided" });
        }
      );

      const response = await request(app).get("/api/members/").expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should only return verified members in Connect directory", async () => {
      const mockMembers = [
        {
          id: 1,
          name: "Verified Member",
          verification_status: "VERIFIED",
        },
        {
          id: 2,
          name: "Pending Member",
          verification_status: "PENDING",
        },
      ];

      // Mock query to only return verified members (as per the WHERE clause)
      (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
        rows: [mockMembers[0]], // Only verified member
      });

      const response = await request(app).get("/api/members/").expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty(
        "verification_status",
        "VERIFIED"
      );
    });
  });
});
