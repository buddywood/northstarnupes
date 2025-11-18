import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { verifyWebhookSignature } from '../services/stripe';
import { getOrderByStripeSessionId, updateOrderStatus, getSellerById } from '../db/queries';
import pool from '../db/connection';
import dotenv from 'dotenv';

dotenv.config();

const router: ExpressRouter = Router();

// Stripe webhook endpoint (must be raw body for signature verification)
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }

  let event;

  try {
    // req.body is already a Buffer from express.raw() middleware
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    event = verifyWebhookSignature(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    
    try {
      const order = await getOrderByStripeSessionId(session.id);
      
      if (order && order.status === 'PENDING') {
        await updateOrderStatus(order.id, 'PAID');
        console.log(`Order ${order.id} marked as PAID`);
      }
    } catch (error) {
      console.error('Error processing checkout.session.completed:', error);
    }
  }

  // Handle account.updated event - sync business details when Stripe account is updated
  if (event.type === 'account.updated') {
    const account = event.data.object as any;
    const accountId = account.id;
    
    try {
      // Find seller with this Stripe account ID
      const result = await pool.query(
        'SELECT id FROM sellers WHERE stripe_account_id = $1',
        [accountId]
      );
      
      if (result.rows.length > 0) {
        const sellerId = result.rows[0].id;
        const seller = await getSellerById(sellerId);
        
        if (seller) {
          // Sync business details from Stripe
          const { getStripeAccountBusinessDetails } = await import('../services/stripe');
          const businessDetails = await getStripeAccountBusinessDetails(accountId);
          
          // Update seller record with business details from Stripe
          // Only update fields that are null/empty in our database
          const updates: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          if (businessDetails.businessName && (!seller.business_name || seller.business_name.trim() === '')) {
            updates.push(`business_name = $${paramIndex}`);
            values.push(businessDetails.businessName);
            paramIndex++;
          }

          if (businessDetails.businessEmail && (!seller.business_email || seller.business_email.trim() === '')) {
            updates.push(`business_email = $${paramIndex}`);
            values.push(businessDetails.businessEmail);
            paramIndex++;
          }

          if (businessDetails.website && (!seller.website || seller.website.trim() === '')) {
            updates.push(`website = $${paramIndex}`);
            values.push(businessDetails.website);
            paramIndex++;
          }

          if (businessDetails.taxId && (!(seller as any).tax_id || (seller as any).tax_id.trim() === '')) {
            updates.push(`tax_id = $${paramIndex}`);
            values.push(businessDetails.taxId);
            paramIndex++;
          }

          if (businessDetails.businessPhone && (!(seller as any).business_phone || (seller as any).business_phone.trim() === '')) {
            updates.push(`business_phone = $${paramIndex}`);
            values.push(businessDetails.businessPhone);
            paramIndex++;
          }

          if (businessDetails.accountType && !(seller as any).stripe_account_type) {
            updates.push(`stripe_account_type = $${paramIndex}`);
            values.push(businessDetails.accountType);
            paramIndex++;
          }

          // Address fields - only update if they're empty
          if (businessDetails.businessAddress.line1 && (!(seller as any).business_address_line1 || (seller as any).business_address_line1.trim() === '')) {
            updates.push(`business_address_line1 = $${paramIndex}`);
            values.push(businessDetails.businessAddress.line1);
            paramIndex++;
          }

          if (businessDetails.businessAddress.line2 && (!(seller as any).business_address_line2 || (seller as any).business_address_line2.trim() === '')) {
            updates.push(`business_address_line2 = $${paramIndex}`);
            values.push(businessDetails.businessAddress.line2);
            paramIndex++;
          }

          if (businessDetails.businessAddress.city && (!(seller as any).business_city || (seller as any).business_city.trim() === '')) {
            updates.push(`business_city = $${paramIndex}`);
            values.push(businessDetails.businessAddress.city);
            paramIndex++;
          }

          if (businessDetails.businessAddress.state && (!(seller as any).business_state || (seller as any).business_state.trim() === '')) {
            updates.push(`business_state = $${paramIndex}`);
            values.push(businessDetails.businessAddress.state);
            paramIndex++;
          }

          if (businessDetails.businessAddress.postal_code && (!(seller as any).business_postal_code || (seller as any).business_postal_code.trim() === '')) {
            updates.push(`business_postal_code = $${paramIndex}`);
            values.push(businessDetails.businessAddress.postal_code);
            paramIndex++;
          }

          if (businessDetails.businessAddress.country && (!(seller as any).business_country || (seller as any).business_country.trim() === '')) {
            updates.push(`business_country = $${paramIndex}`);
            values.push(businessDetails.businessAddress.country);
            paramIndex++;
          }

          if (updates.length > 0) {
            values.push(sellerId);
            await pool.query(
              `UPDATE sellers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`,
              values
            );
            console.log(`Synced business details for seller ${sellerId} from Stripe account ${accountId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing account.updated webhook:', error);
      // Don't fail the webhook - just log the error
    }
  }

  res.json({ received: true });
});

export default router;
