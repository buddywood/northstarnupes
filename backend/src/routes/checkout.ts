import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { getProductById } from '../db/queries';
import { createCheckoutSession } from '../services/stripe';
import { createOrder } from '../db/queries';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const router: ExpressRouter = Router();

const checkoutSchema = z.object({
  buyer_email: z.string().email(),
});

router.post('/:productId', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const body = checkoutSchema.parse(req.body);

    // Get product
    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get seller to check status and get Stripe account
    const { getSellerById } = await import('../db/queries');
    const seller = await getSellerById(product.seller_id);
    
    if (!seller || seller.status !== 'APPROVED' || !seller.stripe_account_id) {
      return res.status(400).json({ error: 'Seller is not approved or does not have a Stripe account' });
    }

    // Use seller's sponsoring_chapter_id instead of product's sponsored_chapter_id
    const chapterId = (product as any).seller_sponsoring_chapter_id || seller.sponsoring_chapter_id || undefined;

    // Create checkout session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await createCheckoutSession({
      productId: product.id,
      productName: product.name,
      priceCents: product.price_cents,
      connectedAccountId: seller.stripe_account_id,
      buyerEmail: body.buyer_email,
      successUrl: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/cancel`,
      chapterId: chapterId,
    });

    // Create order record
    await createOrder({
      product_id: product.id,
      buyer_email: body.buyer_email,
      amount_cents: product.price_cents,
      stripe_session_id: session.id,
      chapter_id: chapterId,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

export default router;

