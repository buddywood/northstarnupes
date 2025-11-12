import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { 
  getStewardListingById, 
  createStewardClaim,
  getStewardClaimByStripeSessionId,
  updateStewardClaimStatus,
  getPlatformSetting,
  getChapterById,
  getStewardById
} from '../db/queries';
import { createStewardCheckoutSession, calculateStewardPlatformFee } from '../services/stripe';
import { authenticate, requireVerifiedMember } from '../middleware/auth';
import { z } from 'zod';

const router: ExpressRouter = Router();

// Create checkout session for claiming a steward listing
router.post('/:listingId', authenticate, requireVerifiedMember, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.memberId) {
      return res.status(403).json({ error: 'Member profile required' });
    }

    const listingId = parseInt(req.params.listingId);
    const listing = await getStewardListingById(listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.status !== 'ACTIVE' && listing.status !== 'CLAIMED') {
      return res.status(400).json({ error: 'Listing is not available for claiming' });
    }

    // Get chapter to check for Stripe account
    const chapter = await getChapterById(listing.sponsoring_chapter_id);
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    if (!chapter.stripe_account_id) {
      return res.status(400).json({ error: 'Chapter Stripe account not set up. Please contact admin.' });
    }

    // Get steward to check for Stripe account
    const steward = await getStewardById(listing.steward_id);
    if (!steward) {
      return res.status(404).json({ error: 'Steward not found' });
    }

    if (!steward.stripe_account_id) {
      return res.status(400).json({ error: 'Steward Stripe account not set up. Please contact admin.' });
    }

    // Calculate platform fee
    const platformFeeCents = await calculateStewardPlatformFee(
      listing.shipping_cost_cents,
      listing.chapter_donation_cents
    );

    const totalAmountCents = listing.shipping_cost_cents + platformFeeCents + listing.chapter_donation_cents;

    // Create checkout session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await createStewardCheckoutSession({
      listingId: listing.id,
      listingName: listing.name,
      shippingCents: listing.shipping_cost_cents,
      platformFeeCents,
      chapterDonationCents: listing.chapter_donation_cents,
      chapterStripeAccountId: chapter.stripe_account_id,
      stewardStripeAccountId: steward.stripe_account_id,
      buyerEmail: req.user.email,
      successUrl: `${frontendUrl}/steward-checkout/${listingId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/steward-listing/${listingId}`,
    });

    // Create claim record
    await createStewardClaim({
      listing_id: listing.id,
      claimant_member_id: req.user.memberId,
      stripe_session_id: session.id,
      total_amount_cents: totalAmountCents,
      shipping_cents: listing.shipping_cost_cents,
      platform_fee_cents: platformFeeCents,
      chapter_donation_cents: listing.chapter_donation_cents,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating steward checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Handle Stripe webhook for steward claims (similar to regular checkout)
// This would be added to the existing webhook handler

export default router;

