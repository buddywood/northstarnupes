import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createSeller, getActiveProducts } from '../db/queries';
import pool from '../db/connection';
import { uploadToS3 } from '../services/s3';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { sendSellerApplicationSubmittedEmail } from '../services/email';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const sellerApplicationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  sponsoring_chapter_id: z.number().int().positive(),
  business_name: z.string().optional().nullable(),
  vendor_license_number: z.string().min(1),
  social_links: z.record(z.string()).optional(),
});

// Optional authentication middleware - doesn't fail if not authenticated
const optionalAuthenticate = async (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No auth header, continue without user
    return next();
  }
  
  try {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const { verifyCognitoToken, extractUserInfoFromToken } = await import('../services/cognito');
    const { getUserByCognitoSub } = await import('../db/queries');
    
    // Verify token
    const payload = await verifyCognitoToken(token);
    if (payload) {
      // Extract user info from token
      const { cognitoSub } = extractUserInfoFromToken(payload);
      
      // Get user in database
      const user = await getUserByCognitoSub(cognitoSub);
      if (user) {
        // Attach user to request
        req.user = {
          id: user.id,
          cognitoSub: user.cognito_sub,
          email: user.email,
          role: user.role,
          memberId: user.member_id,
          sellerId: user.seller_id,
          promoterId: user.promoter_id,
          features: user.features,
        };
      }
    }
    // Continue regardless of auth success/failure
    next();
  } catch (error) {
    // Authentication failed, but continue anyway (optional auth)
    console.error('Optional auth error (continuing anyway):', error);
    next();
  }
};

router.post('/apply', optionalAuthenticate, upload.fields([
  { name: 'headshot', maxCount: 1 },
  { name: 'store_logo', maxCount: 1 }
]), async (req: Request, res: Response) => {
  try {
    // Helper to convert empty strings to null
    const toNullIfEmpty = (value: any) => {
      if (value === undefined || value === null || value === '') return null;
      return value;
    };

    // Get member_id from authenticated user if available
    let memberId: number | null = null;
    if (req.user?.memberId) {
      memberId = req.user.memberId;
    }

    // Validate request body
    const body = sellerApplicationSchema.parse({
      ...req.body,
      sponsoring_chapter_id: parseInt(req.body.sponsoring_chapter_id),
      business_name: toNullIfEmpty(req.body.business_name),
      vendor_license_number: req.body.vendor_license_number,
      social_links: req.body.social_links ? JSON.parse(req.body.social_links) : {},
    });

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const headshotFile = files?.headshot?.[0];
    const logoFile = files?.store_logo?.[0];

    // Store logo is required
    if (!logoFile) {
      res.status(400).json({ error: 'Store logo is required' });
      return;
    }

    // Upload store logo to S3
    const logoUploadResult = await uploadToS3(
      logoFile.buffer,
      logoFile.originalname,
      logoFile.mimetype,
      'store-logos'
    );
    const storeLogoUrl = logoUploadResult.url;

    // Upload headshot to S3 or use existing URL (optional)
    let headshotUrl: string | undefined;
    if (headshotFile) {
      // New headshot uploaded
      const uploadResult = await uploadToS3(
        headshotFile.buffer,
        headshotFile.originalname,
        headshotFile.mimetype,
        'headshots'
      );
      headshotUrl = uploadResult.url;
    } else if (req.body.existing_headshot_url) {
      // Use existing headshot URL from member profile
      headshotUrl = req.body.existing_headshot_url;
    }

    // Create seller record with member_id if available
    const seller = await createSeller({
      ...body,
      member_id: memberId,
      headshot_url: headshotUrl,
      store_logo_url: storeLogoUrl,
      social_links: body.social_links || {},
    });

    // Send confirmation email (don't await - send in background)
    sendSellerApplicationSubmittedEmail(body.email, body.name).catch(error => {
      console.error('Failed to send seller application submitted email:', error);
    });

    res.status(201).json(seller);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating seller application:', error);
    res.status(500).json({ error: 'Failed to create seller application' });
  }
});

// Get all approved sellers with their products for collections page
// Note: This must come after POST /apply to avoid route conflicts
router.get('/collections', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        s.id,
        s.name,
        s.business_name,
        s.headshot_url,
        s.sponsoring_chapter_id,
        s.social_links,
        COUNT(p.id) as product_count
      FROM sellers s
      LEFT JOIN products p ON s.id = p.seller_id
      WHERE s.status = 'APPROVED'
      GROUP BY s.id, s.name, s.business_name, s.headshot_url, s.sponsoring_chapter_id, s.social_links
      HAVING COUNT(p.id) > 0
      ORDER BY s.name ASC`
    );
    
    // For each seller, get their products
    const sellersWithProducts = await Promise.all(
      result.rows.map(async (seller) => {
        const productsResult = await pool.query(
          'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
          [seller.id]
        );
        // Parse social_links if it's a string
        const socialLinks = typeof seller.social_links === 'string' 
          ? JSON.parse(seller.social_links) 
          : (seller.social_links || {});
        
        return {
          ...seller,
          social_links: socialLinks,
          products: productsResult.rows,
        };
      })
    );
    
    res.json(sellersWithProducts);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

export default router;

