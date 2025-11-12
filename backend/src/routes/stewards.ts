import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import { 
  createSteward, 
  getStewardById, 
  getStewardByMemberId,
  createStewardListing,
  getStewardListings,
  getStewardListingById,
  getActiveStewardListings,
  updateStewardListing,
  deleteStewardListing,
  claimStewardListing,
  getMemberById,
  linkUserToSteward
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
    const existingSteward = await getStewardByMemberId(req.user.memberId);
    if (existingSteward) {
      return res.status(400).json({ error: 'You have already applied to be a steward' });
    }

    const body = stewardApplicationSchema.parse(req.body);

    // Create steward application
    const steward = await createSteward({
      member_id: req.user.memberId,
      sponsoring_chapter_id: body.sponsoring_chapter_id,
    });

    // Auto-approve verified members (they're already verified, so we can auto-approve)
    if (member.verification_status === 'VERIFIED') {
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

        console.log(`Auto-approved verified member steward: ${member.name || 'Unknown'} (member_id: ${member.id})`);

        // Fetch updated steward to return correct status
        const updatedSteward = await getStewardById(steward.id);
        return res.status(201).json(updatedSteward || steward);
      } catch (error: any) {
        console.error('Error auto-approving verified member steward:', error);
        // Don't fail the request - steward is still created, just needs manual approval
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
    const member = await getMemberById(steward.member_id);
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
router.post('/listings', authenticate, requireSteward, upload.single('image'), async (req: Request, res: Response) => {
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
    });

    // Upload image if provided
    let imageUrl: string | null = null;
    if (req.file) {
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
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
    });

    res.status(201).json(listing);
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
    const chapterResult = await pool.query('SELECT * FROM chapters WHERE id = $1', [listing.sponsoring_chapter_id]);
    const chapter = chapterResult.rows[0];

    res.json({
      ...listing,
      steward,
      chapter,
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
        const member = steward ? await getMemberById(steward.member_id) : null;
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

