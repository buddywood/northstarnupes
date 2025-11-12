import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import { createProduct, getActiveProducts, getProductById, getSellerById } from '../db/queries';
import { uploadToS3 } from '../services/s3';
import { z } from 'zod';
import pool from '../db/connection';

const router: ExpressRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const createProductSchema = z.object({
  seller_id: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string(),
  price_cents: z.number().int().positive(),
  sponsored_chapter_id: z.number().int().positive().optional(),
  is_kappa_branded: z.boolean().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await getActiveProducts();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await getProductById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const body = createProductSchema.parse({
      ...req.body,
      seller_id: parseInt(req.body.seller_id),
      price_cents: parseInt(req.body.price_cents),
      sponsored_chapter_id: req.body.sponsored_chapter_id ? parseInt(req.body.sponsored_chapter_id) : undefined,
      is_kappa_branded: req.body.is_kappa_branded !== undefined ? req.body.is_kappa_branded === 'true' || req.body.is_kappa_branded === true : undefined,
    });

    // Get seller to check verification status
    const seller = await getSellerById(body.seller_id);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Business rule validation:
    // 1. Verified sellers (seller.verification_status = 'VERIFIED') → must sell Kappa Alpha Psi branded merchandise only
    // 2. Verified members (seller.member_id IS NOT NULL AND member.verification_status = 'VERIFIED') → can sell anything
    let isKappaBranded = body.is_kappa_branded ?? false;

    if (seller.verification_status === 'VERIFIED') {
      // Check if seller is also a verified member
      let isVerifiedMember = false;
      if (seller.member_id) {
        const memberResult = await pool.query(
          'SELECT verification_status FROM members WHERE id = $1',
          [seller.member_id]
        );
        if (memberResult.rows[0]?.verification_status === 'VERIFIED') {
          isVerifiedMember = true;
        }
      }

      // If seller is verified but NOT a verified member, they can only sell Kappa branded products
      if (!isVerifiedMember) {
        if (!isKappaBranded) {
          return res.status(400).json({ 
            error: 'Verified sellers must sell Kappa Alpha Psi branded merchandise only. Please set is_kappa_branded to true.' 
          });
        }
      }
      // If seller is both verified seller AND verified member, they can sell anything (no restriction)
    }

    // Upload image to S3
    let imageUrl: string | undefined;
    if (req.file) {
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'products'
      );
      imageUrl = uploadResult.url;
    }

    const product = await createProduct({
      ...body,
      image_url: imageUrl,
      is_kappa_branded: isKappaBranded,
    });

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router;

