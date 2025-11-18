import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import { 
  createSteward, 
  getStewardById, 
  getStewardByFraternityMemberId,
  createStewardListing,
  getStewardListings,
  getStewardListingById,
  getActiveStewardListings,
  updateStewardListing,
  deleteStewardListing,
  claimStewardListing,
  getMemberById,
  linkUserToSteward,
  getStewardListingImages,
  addStewardListingImage
} from '../db/queries';
import { uploadToS3 } from '../services/s3';
import { z } from 'zod';
import { authenticate, requireSteward, requireVerifiedMember } from '../middleware/auth';
import pool from '../db/connection';

const router: ExpressRouter = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const stewardApplicationSchema = z.object({
  sponsoring_chapter_id: z.number().int().positive(),
});

const stewardListingSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  shipping_cost_cents: z.number().int().min(0),
  chapter_donation_cents: z.number().int().min(0),
  category_id: z.number().int().positive().optional().nullable(),
});

// Apply to become a steward
router.post('/apply', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.memberId) {
      return res.status(403).json({ error: 'Member profile required' });
    }

    // Check if member is verified
    const member = await getMemberById(req.user.memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member.verification_status !== 'VERIFIED') {
      return res.status(403).json({ 
        error: 'You must be a verified member to become a steward',
        code: 'VERIFICATION_REQUIRED'
      });
    }

    // Check if steward already exists
    const existingSteward = await getStewardByFraternityMemberId(req.user.memberId);
    if (existingSteward) {
      return res.status(400).json({ error: 'You have already applied to be a steward' });
    }

    const body = stewardApplicationSchema.parse(req.body);

    // Create steward application
    const steward = await createSteward({
      fraternity_member_id: req.user.memberId,
      sponsoring_chapter_id: body.sponsoring_chapter_id,
    });

    // Auto-approve verified members (they're already verified, so we can auto-approve)
    if (member.verification_status === 'VERIFIED') {
      // Check if Stripe is configured
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey || stripeKey.trim() === '' || stripeKey.includes('here')) {
        console.warn('⚠️  Stripe not configured - auto-approving steward without Stripe account. Stripe setup will be required later.');
        // Approve steward without Stripe account - admin can set it up later
        await pool.query(
          'UPDATE stewards SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['APPROVED', steward.id]
        );

        // Link user to steward
        if (req.user?.id) {
          await linkUserToSteward(req.user.id, steward.id);
        }

        console.log(`Auto-approved verified member steward (without Stripe): ${member.name || 'Unknown'} (fraternity_member_id: ${member.id})`);

        // Fetch updated steward to return correct status
        const updatedSteward = await getStewardById(steward.id);
        return res.status(201).json({
          ...updatedSteward,
          warning: 'Your steward application was approved, but Stripe payment setup is required before you can receive payments. An admin will help you complete Stripe setup.',
        } || { ...steward, warning: 'Your steward application was approved, but Stripe payment setup is required before you can receive payments. An admin will help you complete Stripe setup.' });
      }

      try {
        // Create Stripe Connect account for steward to receive shipping reimbursements
        const { createConnectAccount } = await import('../services/stripe');
        
        // Get user email for Stripe account creation
        const userEmail = req.user?.email || member.email || null;
        if (!userEmail) {
          throw new Error('User email required for Stripe account creation');
        }

        const account = await createConnectAccount(userEmail);
        
        // Update steward status to APPROVED and set Stripe account
        await pool.query(
          'UPDATE stewards SET status = $1, stripe_account_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          ['APPROVED', account.id, steward.id]
        );

        // Link user to steward
        if (req.user?.id) {
          await linkUserToSteward(req.user.id, steward.id);
        }

        console.log(`Auto-approved verified member steward: ${member.name || 'Unknown'} (fraternity_member_id: ${member.id})`);

        // Fetch updated steward to return correct status
        const updatedSteward = await getStewardById(steward.id);
        return res.status(201).json(updatedSteward || steward);
      } catch (error: any) {
        console.error('Error auto-approving verified member steward:', error);
        
        // Check for specific Stripe key errors
        let warningMessage = 'Your steward application was approved, but Stripe payment setup failed. An admin will help you complete Stripe setup before you can receive payments.';
        
        if (error.type === 'StripePermissionError' || error.code === 'secret_key_required' || error.message?.includes('publishable API key')) {
          console.error('❌ CRITICAL: STRIPE_SECRET_KEY is set to a publishable key instead of a secret key!');
          console.error('   Secret keys start with "sk_" (e.g., sk_test_...)');
          console.error('   Publishable keys start with "pk_" (e.g., pk_test_...)');
          console.error('   Please update your .env file with the correct STRIPE_SECRET_KEY.');
          warningMessage = 'Your steward application was approved, but Stripe payment setup failed because the server is configured with a publishable key instead of a secret key. Please contact an administrator to fix the Stripe configuration.';
        } else if (error.type === 'StripeAuthenticationError' || error.message?.includes('Invalid API Key')) {
          warningMessage = 'Your steward application was approved, but Stripe payment setup failed due to an invalid API key. An admin will help you complete Stripe setup before you can receive payments.';
        }
        
        // If Stripe fails for any reason, still approve the steward but without Stripe account
        // Verified members should always be auto-approved, even if Stripe setup fails
        // Admin can set up Stripe later
        console.warn('⚠️  Stripe setup failed - approving steward without Stripe account');
        await pool.query(
          'UPDATE stewards SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['APPROVED', steward.id]
        );

        // Link user to steward
        if (req.user?.id) {
          await linkUserToSteward(req.user.id, steward.id);
        }

        const updatedSteward = await getStewardById(steward.id);
        return res.status(201).json({
          ...updatedSteward,
          warning: warningMessage,
        } || { ...steward, warning: warningMessage });
      }
    }

    res.status(201).json(steward);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating steward application:', error);
    res.status(500).json({ error: 'Failed to create steward application' });
  }
});

// Get current steward profile
router.get('/profile', authenticate, requireSteward, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.stewardId) {
      return res.status(404).json({ error: 'Steward profile not found' });
    }

    const steward = await getStewardById(req.user.stewardId);
    if (!steward) {
      return res.status(404).json({ error: 'Steward not found' });
    }

    // Get member and chapter info
    const member = await getMemberById(steward.fraternity_member_id);
    const chapterResult = await pool.query('SELECT * FROM chapters WHERE id = $1', [steward.sponsoring_chapter_id]);
    const chapter = chapterResult.rows[0];

    res.json({
      ...steward,
      member,
      chapter,
    });
  } catch (error) {
    console.error('Error fetching steward profile:', error);
    res.status(500).json({ error: 'Failed to fetch steward profile' });
  }
});

// Create a new listing
router.post('/listings', authenticate, requireSteward, upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.stewardId) {
      return res.status(403).json({ error: 'Steward access required' });
    }

    const steward = await getStewardById(req.user.stewardId);
    if (!steward || steward.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Steward must be approved to create listings' });
    }

    const body = stewardListingSchema.parse({
      ...req.body,
      shipping_cost_cents: parseInt(req.body.shipping_cost_cents),
      chapter_donation_cents: parseInt(req.body.chapter_donation_cents),
      category_id: req.body.category_id ? parseInt(req.body.category_id) : null,
    });

    // Upload images to S3
    let imageUrl: string | null = null;
    const imageFiles = req.files as Express.Multer.File[];
    
    if (imageFiles && imageFiles.length > 0) {
      // Use first image as the primary image_url (for backward compatibility)
      const firstImage = imageFiles[0];
      const uploadResult = await uploadToS3(
        firstImage.buffer,
        firstImage.originalname,
        firstImage.mimetype,
        'steward-listings'
      );
      imageUrl = uploadResult.url;
    }

    const listing = await createStewardListing({
      steward_id: steward.id,
      name: body.name,
      description: body.description || null,
      image_url: imageUrl,
      shipping_cost_cents: body.shipping_cost_cents,
      chapter_donation_cents: body.chapter_donation_cents,
      sponsoring_chapter_id: steward.sponsoring_chapter_id,
      category_id: body.category_id || null,
    });

    // Upload additional images to steward_listing_images table
    if (imageFiles && imageFiles.length > 0) {
      await Promise.all(
        imageFiles.map(async (file, index) => {
          const uploadResult = await uploadToS3(
            file.buffer,
            file.originalname,
            file.mimetype,
            'steward-listings'
          );
          await addStewardListingImage(listing.id, uploadResult.url, index);
        })
      );
    }

    // Fetch the listing with images
    const images = await getStewardListingImages(listing.id);

    res.status(201).json({
      ...listing,
      images,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating steward listing:', error);
    res.status(500).json({ error: 'Failed to create steward listing' });
  }
});

// Get steward's listings
router.get('/listings', authenticate, requireSteward, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.stewardId) {
      return res.status(403).json({ error: 'Steward access required' });
    }

    const listings = await getStewardListings(req.user.stewardId);
    res.json(listings);
  } catch (error) {
    console.error('Error fetching steward listings:', error);
    res.status(500).json({ error: 'Failed to fetch steward listings' });
  }
});

// Get steward's metrics
router.get('/me/metrics', authenticate, requireSteward, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.stewardId) {
      return res.status(403).json({ error: 'Steward access required' });
    }

    // Get total listings count
    const listingsResult = await pool.query(
      'SELECT COUNT(*) as total_listings FROM steward_listings WHERE steward_id = $1',
      [req.user.stewardId]
    );
    const totalListings = parseInt(listingsResult.rows[0]?.total_listings || '0');

    // Get active listings count
    const activeListingsResult = await pool.query(
      "SELECT COUNT(*) as active_listings FROM steward_listings WHERE steward_id = $1 AND status = 'ACTIVE'",
      [req.user.stewardId]
    );
    const activeListings = parseInt(activeListingsResult.rows[0]?.active_listings || '0');

    // Get claims count
    const claimsResult = await pool.query(
      `SELECT COUNT(*) as total_claims
       FROM steward_claims sc
       JOIN steward_listings sl ON sc.listing_id = sl.id
       WHERE sl.steward_id = $1 AND sc.status = 'PAID'`,
      [req.user.stewardId]
    );
    const totalClaims = parseInt(claimsResult.rows[0]?.total_claims || '0');

    // Get total donations generated
    const donationsResult = await pool.query(
      `SELECT COALESCE(SUM(sc.chapter_donation_cents), 0) as total_donations_cents
       FROM steward_claims sc
       JOIN steward_listings sl ON sc.listing_id = sl.id
       WHERE sl.steward_id = $1 AND sc.status = 'PAID'`,
      [req.user.stewardId]
    );
    const totalDonationsCents = parseInt(donationsResult.rows[0]?.total_donations_cents || '0');

    res.json({
      totalListings,
      activeListings,
      totalClaims,
      totalDonationsCents,
    });
  } catch (error) {
    console.error('Error fetching steward metrics:', error);
    res.status(500).json({ error: 'Failed to fetch steward metrics' });
  }
});

// Get steward's recent claims
router.get('/me/claims', authenticate, requireSteward, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.stewardId) {
      return res.status(403).json({ error: 'Steward access required' });
    }

    const result = await pool.query(
      `SELECT sc.*, sl.name as listing_name, fm.email as claimant_email
       FROM steward_claims sc
       JOIN steward_listings sl ON sc.listing_id = sl.id
       LEFT JOIN fraternity_members fm ON sc.claimant_fraternity_member_id = fm.id
       WHERE sl.steward_id = $1
       ORDER BY sc.created_at DESC
       LIMIT 10`,
      [req.user.stewardId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching steward claims:', error);
    res.status(500).json({ error: 'Failed to fetch steward claims' });
  }
});

// Get specific listing (requires verified member)
router.get('/listings/:id', authenticate, requireVerifiedMember, async (req: Request, res: Response) => {
  try {
    const listingId = parseInt(req.params.id);
    const listing = await getStewardListingById(listingId);
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Get steward and chapter info
    const steward = await getStewardById(listing.steward_id);
    const member = steward && steward.fraternity_member_id ? await getMemberById(steward.fraternity_member_id) : null;
    const chapterResult = await pool.query('SELECT * FROM chapters WHERE id = $1', [listing.sponsoring_chapter_id]);
    const chapter = chapterResult.rows[0];

    // Get listing images
    const images = await getStewardListingImages(listingId);

    res.json({
      ...listing,
      steward: steward ? { ...steward, member } : null,
      chapter,
      images,
    });
  } catch (error) {
    console.error('Error fetching steward listing:', error);
    res.status(500).json({ error: 'Failed to fetch steward listing' });
  }
});

// Update listing
router.put('/listings/:id', authenticate, requireSteward, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.stewardId) {
      return res.status(403).json({ error: 'Steward access required' });
    }

    const listingId = parseInt(req.params.id);
    const listing = await getStewardListingById(listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.steward_id !== req.user.stewardId) {
      return res.status(403).json({ error: 'You can only update your own listings' });
    }

    const updates: any = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.shipping_cost_cents !== undefined) updates.shipping_cost_cents = parseInt(req.body.shipping_cost_cents);
    if (req.body.chapter_donation_cents !== undefined) updates.chapter_donation_cents = parseInt(req.body.chapter_donation_cents);

    // Upload new image if provided
    if (req.file) {
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'steward-listings'
      );
      updates.image_url = uploadResult.url;
    }

    const updatedListing = await updateStewardListing(listingId, updates);
    res.json(updatedListing);
  } catch (error) {
    console.error('Error updating steward listing:', error);
    res.status(500).json({ error: 'Failed to update steward listing' });
  }
});

// Delete listing
router.delete('/listings/:id', authenticate, requireSteward, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.stewardId) {
      return res.status(403).json({ error: 'Steward access required' });
    }

    const listingId = parseInt(req.params.id);
    const listing = await getStewardListingById(listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.steward_id !== req.user.stewardId) {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }

    await deleteStewardListing(listingId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting steward listing:', error);
    res.status(500).json({ error: 'Failed to delete steward listing' });
  }
});

// Get marketplace (all active listings) - requires verified member
router.get('/marketplace', authenticate, requireVerifiedMember, async (req: Request, res: Response) => {
  try {
    const listings = await getActiveStewardListings();
    
    // Enrich with steward and chapter info
    const enrichedListings = await Promise.all(
      listings.map(async (listing) => {
        const steward = await getStewardById(listing.steward_id);
        const member = steward && steward.fraternity_member_id ? await getMemberById(steward.fraternity_member_id) : null;
        const chapterResult = await pool.query('SELECT * FROM chapters WHERE id = $1', [listing.sponsoring_chapter_id]);
        const chapter = chapterResult.rows[0];

        return {
          ...listing,
          steward: steward ? { ...steward, member } : null,
          chapter,
        };
      })
    );

    res.json(enrichedListings);
  } catch (error) {
    console.error('Error fetching steward marketplace:', error);
    res.status(500).json({ error: 'Failed to fetch steward marketplace' });
  }
});

// Claim a listing
router.post('/listings/:id/claim', authenticate, requireVerifiedMember, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.memberId) {
      return res.status(403).json({ error: 'Member profile required' });
    }

    const listingId = parseInt(req.params.id);
    const listing = await getStewardListingById(listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Listing is not available for claiming' });
    }

    // Mark listing as claimed (actual payment happens in checkout)
    const claimedListing = await claimStewardListing(listingId, req.user.memberId);
    
    if (!claimedListing) {
      return res.status(400).json({ error: 'Failed to claim listing. It may have already been claimed.' });
    }

    res.json({ success: true, listing: claimedListing });
  } catch (error) {
    console.error('Error claiming steward listing:', error);
    res.status(500).json({ error: 'Failed to claim steward listing' });
  }
});

export default router;

