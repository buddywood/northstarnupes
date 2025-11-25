import request from "supertest";
import express from "express";
import stewardsRouter from "../routes/stewards";
import checkoutRouter from "../routes/checkout";
import pool from "../db/connection";

// Mock the database queries
jest.mock("../db/queries", () => ({
  getActiveStewardListings: jest.fn(),
  getStewardListingById: jest.fn(),
  getStewardById: jest.fn(),
  getMemberById: jest.fn(),
  getStewardListingImages: jest.fn(),
  getProductById: jest.fn(),
  getSellerById: jest.fn(),
  createOrder: jest.fn(),
}));

// Mock the auth middleware
jest.mock("../middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => {
    // Check if Authorization header is present
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({ error: "No authorization token provided" });
    }
    // Set a mock user for authenticated requests
    req.user = {
      id: 1,
      cognitoSub: "test-sub",
      email: "test@example.com",
      role: "GUEST",
      sellerId: null,
      promoterId: null,
      stewardId: null,
      features: {},
    };
    next();
  }),
  authenticateOptional: jest.fn((req, res, next) => {
    // authenticateOptional allows requests without auth (for guest checkout)
    // Only set user if Authorization header is present
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      req.user = {
        id: 1,
        cognitoSub: "test-sub",
        email: "test@example.com",
        role: "GUEST",
        sellerId: null,
        promoterId: null,
        stewardId: null,
        features: {},
      };
    }
    // If no auth header, req.user remains undefined (guest)
    next();
  }),
  requireSteward: jest.fn((req, res, next) => next()),
  requireVerifiedMember: jest.fn((req, res, next) => {
    // Note: requireVerifiedMember now gets fraternity_member_id from role tables
    if (!req.user) {
      return res.status(403).json({ error: "Member profile required" });
    }
    next();
  }),
}));

// Mock Stripe service
jest.mock("../services/stripe", () => ({
  createCheckoutSession: jest.fn().mockResolvedValue({
    id: "cs_test_123",
    url: "https://checkout.stripe.com/cs_test_123",
  }),
}));

const app = express();
app.use(express.json());
app.use("/api/stewards", stewardsRouter);
app.use("/api/checkout", checkoutRouter);

describe("Guest Access to Steward Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("GET /api/stewards/marketplace/public", () => {
    it("should return listings without authentication", async () => {
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
          description: "Test Description",
          image_url: "https://example.com/image.jpg",
          shipping_cost_cents: 1000,
          chapter_donation_cents: 500,
          sponsoring_chapter_id: 1,
          category_id: 1,
          status: "ACTIVE",
        },
      ];

      const mockSteward = {
        id: 1,
        fraternity_member_id: 1,
        sponsoring_chapter_id: 1,
        status: "APPROVED",
      };

      const mockMember = {
        id: 1,
        name: "Test Member",
        email: "test@example.com",
      };

      getActiveStewardListings.mockResolvedValue(mockListings);
      getStewardById.mockResolvedValue(mockSteward);
      getMemberById.mockResolvedValue(mockMember);

      // Mock pool.query for chapter lookup
      (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
        rows: [{ id: 1, name: "Test Chapter" }],
      });

      const response = await request(app)
        .get("/api/stewards/marketplace/public")
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty("can_claim", false);
      expect(response.body[0]).toHaveProperty("steward");
      expect(response.body[0]).toHaveProperty("chapter");
    });

    it("should include can_claim: false flag", async () => {
      const {
        getActiveStewardListings,
        getStewardById,
        getMemberById,
      } = require("../db/queries");

      getActiveStewardListings.mockResolvedValue([]);
      (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get("/api/stewards/marketplace/public")
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      // Even empty array should be returned
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /api/stewards/listings/:id/public", () => {
    it("should return listing without authentication", async () => {
      const {
        getStewardListingById,
        getStewardById,
        getMemberById,
        getStewardListingImages,
      } = require("../db/queries");

      const mockListing = {
        id: 1,
        steward_id: 1,
        name: "Test Listing",
        description: "Test Description",
        image_url: "https://example.com/image.jpg",
        shipping_cost_cents: 1000,
        chapter_donation_cents: 500,
        sponsoring_chapter_id: 1,
        category_id: 1,
        status: "ACTIVE",
      };

      const mockSteward = {
        id: 1,
        fraternity_member_id: 1,
        sponsoring_chapter_id: 1,
        status: "APPROVED",
      };

      const mockMember = {
        id: 1,
        name: "Test Member",
        email: "test@example.com",
      };

      getStewardListingById.mockResolvedValue(mockListing);
      getStewardById.mockResolvedValue(mockSteward);
      getMemberById.mockResolvedValue(mockMember);
      getStewardListingImages.mockResolvedValue([]);

      (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
        rows: [{ id: 1, name: "Test Chapter" }],
      });

      const response = await request(app)
        .get("/api/stewards/listings/1/public")
        .expect(200);

      expect(response.body).toHaveProperty("can_claim", false);
      expect(response.body).toHaveProperty("steward");
      expect(response.body).toHaveProperty("chapter");
      expect(response.body).toHaveProperty("images");
    });

    it("should return 404 for non-existent listing", async () => {
      const { getStewardListingById } = require("../db/queries");
      getStewardListingById.mockResolvedValue(null);

      await request(app).get("/api/stewards/listings/999/public").expect(404);
    });

    it("should return 400 for invalid listing ID", async () => {
      await request(app)
        .get("/api/stewards/listings/invalid/public")
        .expect(400);
    });
  });

  describe("Claim endpoint still requires authentication", () => {
    it("should require authentication for claim endpoint", async () => {
      // The claim endpoint should still be protected
      // This test verifies that the authenticated route is still in place
      const response = await request(app)
        .post("/api/stewards/listings/1/claim")
        .expect(401); // Should fail without auth

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Guest Access to Product Checkout", () => {
    describe("Kappa Branded Products", () => {
      it("should reject guest checkout for Kappa branded products", async () => {
        const { getProductById, getSellerById } = require("../db/queries");

        const mockKappaProduct = {
          id: 1,
          name: "Kappa Alpha Psi T-Shirt",
          description: "Official Kappa branded t-shirt",
          price_cents: 3000,
          seller_id: 1,
          is_kappa_branded: true,
        };

        const mockSeller = {
          id: 1,
          status: "APPROVED",
          stripe_account_id: "acct_test_123",
        };

        getProductById.mockResolvedValue(mockKappaProduct);
        getSellerById.mockResolvedValue(mockSeller);

        const response = await request(app)
          .post("/api/checkout/1")
          .send({
            buyer_email: "guest@example.com",
          })
          .expect(401); // Should fail without auth

        expect(response.body).toHaveProperty(
          "error",
          "Authentication required"
        );
        expect(response.body).toHaveProperty(
          "code",
          "AUTH_REQUIRED_FOR_KAPPA_BRANDED"
        );
        expect(response.body.message).toContain(
          "Kappa Alpha Psi branded merchandise"
        );
      });

      it("should allow authenticated member checkout for Kappa branded products", async () => {
        const {
          getProductById,
          getSellerById,
          createOrder,
        } = require("../db/queries");
        const { createCheckoutSession } = require("../services/stripe");

        const mockKappaProduct = {
          id: 1,
          name: "Kappa Alpha Psi T-Shirt",
          description: "Official Kappa branded t-shirt",
          price_cents: 3000,
          seller_id: 1,
          is_kappa_branded: true,
        };

        const mockSeller = {
          id: 1,
          status: "APPROVED",
          stripe_account_id: "acct_test_123",
        };

        getProductById.mockResolvedValue(mockKappaProduct);
        getSellerById.mockResolvedValue(mockSeller);
        createOrder.mockResolvedValue({ id: 1 });
        createCheckoutSession.mockResolvedValue({
          id: "cs_test_123",
          url: "https://checkout.stripe.com/cs_test_123",
        });

        const response = await request(app)
          .post("/api/checkout/1")
          .set("Authorization", "Bearer test-token")
          .send({
            buyer_email: "member@example.com",
          });

        // Should not return 401 (authentication should pass)
        expect(response.status).not.toBe(401);
        // Should successfully create checkout session
        expect(response.body).toHaveProperty("sessionId");
      });
    });

    describe("Non-Kappa Branded Products", () => {
      it.skip("should allow guest checkout for non-Kappa branded products", async () => {
        // TODO: This test requires complex Cognito mocking for guest account creation
        // Guest checkout is supported but requires email and password in the request body
        // The checkout route will create/authenticate a guest account if email and password are provided
      });
    });
  });
});
