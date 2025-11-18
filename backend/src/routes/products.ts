import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import { createProduct, getActiveProducts, getProductById, getSellerById, getAllProductCategories, getCategoryAttributeDefinitions, setProductAttributeValue, addProductImage } from '../db/queries';
import { uploadToS3 } from '../services/s3';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import pool from '../db/connection';

const router: ExpressRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10, // Maximum 10 images per product
  },
});

const createProductSchema = z.object({
  seller_id: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string(),
  price_cents: z.number().int().positive(),
  category_id: z.number().int().positive().nullable().optional(),
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

// Get all product categories - MUST be before /:id route
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await getAllProductCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching product categories:', error);
    res.status(500).json({ error: 'Failed to fetch product categories' });
  }
});

// Get attribute definitions for a category - MUST be before /:id route
router.get('/categories/:categoryId/attributes', async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const attributes = await getCategoryAttributeDefinitions(categoryId);
    res.json(attributes);
  } catch (error) {
    console.error('Error fetching category attributes:', error);
    res.status(500).json({ error: 'Failed to fetch category attributes' });
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

router.post('/', authenticate, upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    // Verify user is a seller
    if (!req.user || !req.user.sellerId) {
      return res.status(403).json({ error: 'Seller access required' });
    }

    const body = createProductSchema.parse({
      ...req.body,
      seller_id: parseInt(req.body.seller_id),
      price_cents: parseInt(req.body.price_cents),
      category_id: req.body.category_id ? parseInt(req.body.category_id) : null,
      is_kappa_branded: req.body.is_kappa_branded !== undefined ? req.body.is_kappa_branded === 'true' || req.body.is_kappa_branded === true : undefined,
    });

    // Verify seller_id matches authenticated user's seller_id
    if (body.seller_id !== req.user.sellerId) {
      return res.status(403).json({ error: 'You can only create products for your own seller account' });
    }

    // Get seller to check verification status and Stripe connection
    const seller = await getSellerById(body.seller_id);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Check if seller is approved
    if (seller.status !== 'APPROVED') {
      return res.status(403).json({ error: 'You must be an approved seller to create products' });
    }

    // Check if Stripe is connected
    if (!seller.stripe_account_id) {
      return res.status(400).json({ 
        error: 'Stripe account not connected. Please complete Stripe setup before creating products.',
        code: 'STRIPE_NOT_CONNECTED'
      });
    }

    // Business rule validation:
    // 1. Verified sellers (seller.verification_status = 'VERIFIED') → must sell Kappa Alpha Psi branded merchandise only
    // 2. Verified members (seller.fraternity_member_id IS NOT NULL AND member.verification_status = 'VERIFIED') → can sell anything
    let isKappaBranded = body.is_kappa_branded ?? false;

    if (seller.verification_status === 'VERIFIED') {
      // Check if seller is also a verified member
      let isVerifiedMember = false;
      if (seller.fraternity_member_id) {
        const memberResult = await pool.query(
          'SELECT verification_status FROM fraternity_members WHERE id = $1',
          [seller.fraternity_member_id]
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

    // Upload images to S3
    let imageUrl: string | undefined;
    const imageFiles = req.files as Express.Multer.File[];
    
    if (imageFiles && imageFiles.length > 0) {
      // Upload first image and set as primary image_url (for backward compatibility)
      const firstImage = imageFiles[0];
      const uploadResult = await uploadToS3(
        firstImage.buffer,
        firstImage.originalname,
        firstImage.mimetype,
        'products'
      );
      imageUrl = uploadResult.url;
    }

    const product = await createProduct({
      ...body,
      image_url: imageUrl,
      is_kappa_branded: isKappaBranded,
    });

    // Upload additional images to product_images table
    if (imageFiles && imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const uploadResult = await uploadToS3(
          file.buffer,
          file.originalname,
          file.mimetype,
          'products'
        );
        await addProductImage(product.id, uploadResult.url, i);
      }
    }

    // Handle product attributes if provided
    if (req.body.attributes && Array.isArray(req.body.attributes)) {
      for (const attr of req.body.attributes) {
        try {
          await setProductAttributeValue(
            product.id,
            parseInt(attr.attribute_definition_id),
            {
              text: attr.value_text || undefined,
              number: attr.value_number ? parseFloat(attr.value_number) : undefined,
              boolean: attr.value_boolean !== undefined ? attr.value_boolean === true || attr.value_boolean === 'true' : undefined,
            }
          );
        } catch (error) {
          console.error(`Error setting attribute ${attr.attribute_definition_id} for product ${product.id}:`, error);
          // Continue with other attributes even if one fails
        }
      }
    }

    // Load attributes and images and return complete product
    const { getProductAttributeValues, getProductImages } = await import('../db/queries');
    const attributes = await getProductAttributeValues(product.id);
    const images = await getProductImages(product.id);
    const productWithAttributes = { ...product, attributes, images };

    res.status(201).json(productWithAttributes);
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

