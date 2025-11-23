import request from "supertest";
import express from "express";
import usersRouter from "../routes/users";
import pool from "../db/connection";

// Mock the database queries
jest.mock("../db/queries", () => ({
  getUserById: jest.fn(),
  getUserByCognitoSub: jest.fn(),
}));

// Mock the auth middleware
jest.mock("../middleware/auth", () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => {
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
  }),
}));

const app = express();
app.use(express.json());
app.use("/api/users", usersRouter);

describe("is_fraternity_member verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("should return false if user has no fraternity_member_id", async () => {
    const { getUserById } = require("../db/queries");

    // Mock user with no member_id
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "GUEST",
      seller_id: null,
      promoter_id: null,
      steward_id: null,
      features: {},
    });

    // Mock pool.query to return no member (user has no fraternity_member_id)
    (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
      rows: [],
    });

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(false);
  });

  it("should return false if user has fraternity_member_id but member is not verified", async () => {
    const { getUserById } = require("../db/queries");

    // Mock user with member_id
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "GUEST",
      seller_id: null,
      promoter_id: null,
      steward_id: null,
      features: {},
    });

    // Mock pool.query:
    // 1. First call: get member by email/cognito_sub (returns member with id: 1)
    // 2. Second call: check verification_status (returns PENDING)
    let callCount = 0;
    (jest.spyOn(pool, "query") as jest.Mock).mockImplementation(
      (query: string) => {
        callCount++;
        if (query.includes("fraternity_members") && query.includes("email")) {
          // First call: get member ID
          return Promise.resolve({ rows: [{ id: 1 }] });
        } else if (query.includes("verification_status")) {
          // Second call: check verification status
          return Promise.resolve({
            rows: [{ verification_status: "PENDING" }],
          });
        }
        return Promise.resolve({ rows: [] });
      }
    );

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(false);
  });

  it("should return false if user has fraternity_member_id but member doesn't exist", async () => {
    const { getUserById } = require("../db/queries");

    // Mock user with member_id
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "GUEST",
      seller_id: null,
      promoter_id: null,
      steward_id: null,
      features: {},
    });

    // Mock pool.query:
    // 1. First call: get member by email/cognito_sub (returns member with id: 1)
    // 2. Second call: check verification_status (returns empty - member doesn't exist)
    (jest.spyOn(pool, "query") as jest.Mock).mockImplementation(
      (query: string) => {
        if (query.includes("fraternity_members") && query.includes("email")) {
          // First call: get member ID
          return Promise.resolve({ rows: [{ id: 1 }] });
        } else if (query.includes("verification_status")) {
          // Second call: member doesn't exist
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      }
    );

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(false);
  });

  it("should return true if user has fraternity_member_id and member is verified", async () => {
    const { getUserById } = require("../db/queries");

    // Mock user with member_id
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "GUEST",
      seller_id: null,
      promoter_id: null,
      steward_id: null,
      features: {},
    });

    // Mock pool.query:
    // The route now gets verification_status in the same query
    (jest.spyOn(pool, "query") as jest.Mock).mockImplementation(
      (query: string) => {
        if (query.includes("fraternity_members") && query.includes("email")) {
          // Get member with verification_status
          return Promise.resolve({
            rows: [
              { id: 1, name: "Test Member", verification_status: "VERIFIED" },
            ],
          });
        }
        return Promise.resolve({ rows: [] });
      }
    );

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(true);
  });

  it("should return false for SELLER role if seller has no fraternity_member_id", async () => {
    const { getUserById } = require("../db/queries");

    // Mock user with SELLER role but no member_id
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "SELLER",
      seller_id: 1,
      promoter_id: null,
      steward_id: null,
      features: {},
    });

    // Mock pool.query: seller has no fraternity_member_id
    (jest.spyOn(pool, "query") as jest.Mock).mockResolvedValue({
      rows: [
        { name: "Test Seller", fraternity_member_id: null, status: "APPROVED" },
      ],
    });

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(false);
  });

  it("should return false for SELLER role if seller has fraternity_member_id but member is not verified", async () => {
    const { getUserById } = require("../db/queries");

    // Mock user with SELLER role and member_id
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "SELLER",
      seller_id: 1,
      promoter_id: null,
      steward_id: null,
      features: {},
    });

    // Mock pool.query:
    // 1. First call: get seller with fraternity_member_id
    // 2. Second call: check verification_status (returns PENDING)
    (jest.spyOn(pool, "query") as jest.Mock).mockImplementation(
      (query: string) => {
        if (
          query.includes("sellers") &&
          query.includes("fraternity_member_id")
        ) {
          // First call: get seller
          return Promise.resolve({
            rows: [
              {
                name: "Test Seller",
                fraternity_member_id: 1,
                status: "APPROVED",
              },
            ],
          });
        } else if (query.includes("verification_status")) {
          // Second call: check verification status
          return Promise.resolve({
            rows: [{ verification_status: "PENDING" }],
          });
        }
        return Promise.resolve({ rows: [] });
      }
    );

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(false);
  });

  it("should return true for SELLER role if seller has fraternity_member_id and member is verified", async () => {
    const { getUserById } = require("../db/queries");

    // Mock user with SELLER role and member_id
    getUserById.mockResolvedValue({
      id: 1,
      cognito_sub: "test-cognito-sub",
      email: "test@example.com",
      role: "SELLER",
      seller_id: 1,
      promoter_id: null,
      steward_id: null,
      features: {},
    });

    // Mock pool.query:
    // 1. First call: get seller with fraternity_member_id
    // 2. Second call: check verification_status (returns VERIFIED)
    (jest.spyOn(pool, "query") as jest.Mock).mockImplementation(
      (query: string) => {
        if (
          query.includes("sellers") &&
          query.includes("fraternity_member_id")
        ) {
          // First call: get seller
          return Promise.resolve({
            rows: [
              {
                name: "Test Seller",
                fraternity_member_id: 1,
                status: "APPROVED",
              },
            ],
          });
        } else if (query.includes("verification_status")) {
          // Second call: check verification status
          return Promise.resolve({
            rows: [{ verification_status: "VERIFIED" }],
          });
        }
        return Promise.resolve({ rows: [] });
      }
    );

    const response = await request(app).get("/api/users/me").expect(200);

    expect(response.body.is_fraternity_member).toBe(true);
  });
});
