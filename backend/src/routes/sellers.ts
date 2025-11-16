import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import { createSeller, getActiveProducts, getSellerById } from '../db/queries';
import pool from '../db/connection';
import { uploadToS3 } from '../services/s3';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { sendSellerApplicationSubmittedEmail } from '../services/email';

const router: ExpressRouter = Router();

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
  business_email: z.string().email().optional().nullable(),
  vendor_license_number: z.string().optional().nullable(),
  merchandise_type: z.enum(['KAPPA', 'NON_KAPPA']),
  website: z.string().optional().nullable(),
  social_links: z.record(z.string()).optional(),
}).refine((data) => {
  // If website is provided, it must be a valid URL
  if (data.website && data.website.trim() !== '') {
    try {
      new URL(data.website);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: 'Website must be a valid URL',
  path: ['website'],
}).refine((data) => {
  // Vendor license number is required only for KAPPA merchandise
  if (data.merchandise_type === 'KAPPA') {
    return data.vendor_license_number && data.vendor_license_number.trim().length > 0;
  }
  return true;
}, {
  message: 'Vendor license number is required for Kappa merchandise',
  path: ['vendor_license_number'],
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
          memberId: user.fraternity_member_id,
          sellerId: user.seller_id,
          promoterId: user.promoter_id,
          stewardId: user.steward_id,
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

    // Validate request body first
    const body = sellerApplicationSchema.parse({
      ...req.body,
      sponsoring_chapter_id: parseInt(req.body.sponsoring_chapter_id),
      business_name: toNullIfEmpty(req.body.business_name),
      business_email: toNullIfEmpty(req.body.business_email),
      vendor_license_number: toNullIfEmpty(req.body.vendor_license_number),
      merchandise_type: req.body.merchandise_type,
      website: toNullIfEmpty(req.body.website),
      social_links: req.body.social_links ? JSON.parse(req.body.social_links) : {},
    });

    // Get member_id from authenticated user if available
    // If not authenticated, try to look up member by email
    let memberId: number | null = null;
    if (req.user?.memberId) {
      memberId = req.user.memberId;
    } else {
      // Try to find member by email if not logged in
      // This allows verified members to get auto-approved even if they're not logged in
      const memberResult = await pool.query(
        'SELECT id, verification_status FROM fraternity_members WHERE email = $1',
        [body.email]
      );
      if (memberResult.rows.length > 0) {
        memberId = memberResult.rows[0].id;
      }
    }

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
      fraternity_member_id: memberId,
      headshot_url: headshotUrl,
      store_logo_url: storeLogoUrl,
      social_links: body.social_links || {},
    });

    // Auto-approve if seller is a verified member (verified members can sell anything)
    if (memberId) {
      const memberResult = await pool.query(
        'SELECT verification_status FROM fraternity_members WHERE id = $1',
        [memberId]
      );
      
      if (memberResult.rows[0]?.verification_status === 'VERIFIED') {
        // Auto-approve verified members
        // Note: We don't create Stripe account here - that happens when admin approves
        // But we can set status to APPROVED and let admin handle Stripe setup
        // OR we could create Stripe account here too - let's do it for consistency
        const { createConnectAccount } = await import('../services/stripe');
        const { generateInvitationToken } = await import('../utils/tokens');
        const { updateSellerInvitationToken, linkUserToSeller, getUserByEmail } = await import('../db/queries');
        
        try {
          // Check if seller already has a Cognito account
          const existingUser = await getUserByEmail(seller.email);
          
          let invitationToken: string | undefined;
          if (existingUser) {
            // Seller already has an account - link it to seller role
            await linkUserToSeller(existingUser.id, seller.id);
          } else {
            // Generate invitation token for new seller account
            invitationToken = generateInvitationToken();
            await updateSellerInvitationToken(seller.id, invitationToken);
          }

          // Create Stripe Connect account
          const account = await createConnectAccount(seller.email);
          
          // Update seller status to APPROVED
          await pool.query(
            'UPDATE sellers SET status = $1, stripe_account_id = $2 WHERE id = $3',
            ['APPROVED', account.id, seller.id]
          );

          // Send approval email
          const { sendSellerApprovedEmail } = await import('../services/email');
          sendSellerApprovedEmail(seller.email, seller.name, invitationToken).catch(error => {
            console.error('Failed to send seller approved email:', error);
          });

          console.log(`Auto-approved verified member seller: ${seller.name} (${seller.email})`);
        } catch (error: any) {
          console.error('Error auto-approving verified member seller:', error);
          // Don't fail the request - seller is still created, just needs manual approval
        }
      }
    }

    // Send confirmation email (don't await - send in background)
    sendSellerApplicationSubmittedEmail(body.email, body.name).catch(error => {
      console.error('Failed to send seller application submitted email:', error);
    });

    // Fetch updated seller to return correct status
    const updatedSeller = await getSellerById(seller.id);
    res.status(201).json(updatedSeller || seller);
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

