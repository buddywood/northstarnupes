import request from 'supertest';
import express from 'express';
import productsRouter from '../routes/products';
import pool from '../db/connection';
import * as queries from '../db/queries';

// Mock the database queries
jest.mock('../db/queries');
jest.mock('../db/connection');
jest.mock('../services/s3', () => ({
  uploadToS3: jest.fn().mockResolvedValue({ url: 'https://example.com/image.jpg' }),
}));

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => {
    req.user = {
      id: 1,
      cognitoSub: 'test-cognito-sub',
      email: 'seller@example.com',
      role: 'SELLER',
      sellerId: 1,
      promoterId: null,
      stewardId: null,
      features: {},
    };
    next();
  }),
}));

const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);

describe('Seller Kappa Branded Product Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should change seller verification_status from VERIFIED to PENDING when adding kappa branded product', async () => {
    // Mock seller with VERIFIED verification_status and Stripe account
    (queries.getSellerById as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'seller@example.com',
      name: 'Test Seller',
      status: 'APPROVED',
      verification_status: 'VERIFIED',
      stripe_account_id: 'acct_test123',
      seller_id: 1,
    });

    // Mock product creation
    (queries.createProduct as jest.Mock).mockResolvedValue({
      id: 1,
      seller_id: 1,
      name: 'Kappa Alpha Psi Polo',
      is_kappa_branded: true,
    });

    // Mock updateSellerVerification
    (queries.updateSellerVerification as jest.Mock).mockResolvedValue({
      id: 1,
      verification_status: 'PENDING',
    });

    // Mock category queries
    (queries.getAllProductCategories as jest.Mock).mockResolvedValue([]);
    (queries.getCategoryAttributeDefinitions as jest.Mock).mockResolvedValue([]);
    (queries.addProductImage as jest.Mock).mockResolvedValue(undefined);
    (queries.setProductAttributeValue as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/products')
      .field('seller_id', '1')
      .field('name', 'Kappa Alpha Psi Polo')
      .field('description', 'Test product')
      .field('price_cents', '4500')
      .field('is_kappa_branded', 'true')
      .expect(201);

    // Verify product was created
    expect(queries.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        is_kappa_branded: true,
      })
    );

    // Verify seller verification_status was updated to PENDING
    expect(queries.updateSellerVerification).toHaveBeenCalledWith(
      1,
      'PENDING',
      'Verification status changed to PENDING after adding Kappa branded product. Requires review.'
    );

    expect(response.body).toHaveProperty('id', 1);
  });

  it('should NOT change seller verification_status if product is not kappa branded', async () => {
    // Mock seller with VERIFIED verification_status, fraternity_member_id (verified member can sell anything), and Stripe account
    (queries.getSellerById as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'seller@example.com',
      name: 'Test Seller',
      status: 'APPROVED',
      verification_status: 'VERIFIED',
      fraternity_member_id: 1,
      stripe_account_id: 'acct_test123',
      seller_id: 1,
    });

    // Mock member verification status query
    (pool.query as jest.Mock).mockImplementation((query: string) => {
      if (query.includes('verification_status') && query.includes('fraternity_members')) {
        return Promise.resolve({ rows: [{ verification_status: 'VERIFIED' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    // Mock product creation
    (queries.createProduct as jest.Mock).mockResolvedValue({
      id: 1,
      seller_id: 1,
      name: 'Regular T-Shirt',
      is_kappa_branded: false,
    });

    // Mock category queries
    (queries.getAllProductCategories as jest.Mock).mockResolvedValue([]);
    (queries.getCategoryAttributeDefinitions as jest.Mock).mockResolvedValue([]);
    (queries.addProductImage as jest.Mock).mockResolvedValue(undefined);
    (queries.setProductAttributeValue as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/products')
      .field('seller_id', '1')
      .field('name', 'Regular T-Shirt')
      .field('description', 'Test product')
      .field('price_cents', '2500')
      .field('is_kappa_branded', 'false')
      .expect(201);

    // Verify product was created
    expect(queries.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        is_kappa_branded: false,
      })
    );

    // Verify seller verification_status was NOT updated
    expect(queries.updateSellerVerification).not.toHaveBeenCalled();

    expect(response.body).toHaveProperty('id', 1);
  });

  it('should NOT change seller verification_status if seller verification_status is not VERIFIED', async () => {
    // Mock seller with PENDING verification_status and Stripe account
    (queries.getSellerById as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'seller@example.com',
      name: 'Test Seller',
      status: 'APPROVED',
      verification_status: 'PENDING',
      stripe_account_id: 'acct_test123',
      seller_id: 1,
    });

    // Mock product creation
    (queries.createProduct as jest.Mock).mockResolvedValue({
      id: 1,
      seller_id: 1,
      name: 'Kappa Alpha Psi Polo',
      is_kappa_branded: true,
    });

    // Mock category queries
    (queries.getAllProductCategories as jest.Mock).mockResolvedValue([]);
    (queries.getCategoryAttributeDefinitions as jest.Mock).mockResolvedValue([]);
    (queries.addProductImage as jest.Mock).mockResolvedValue(undefined);
    (queries.setProductAttributeValue as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/products')
      .field('seller_id', '1')
      .field('name', 'Kappa Alpha Psi Polo')
      .field('description', 'Test product')
      .field('price_cents', '4500')
      .field('is_kappa_branded', 'true')
      .expect(201);

    // Verify product was created
    expect(queries.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        is_kappa_branded: true,
      })
    );

    // Verify seller verification_status was NOT updated (already PENDING)
    expect(queries.updateSellerVerification).not.toHaveBeenCalled();

    expect(response.body).toHaveProperty('id', 1);
  });
});

