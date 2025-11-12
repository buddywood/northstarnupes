import { Router, Request, Response } from 'express';
import { getPendingSellers, updateSellerStatus, getAllOrders, getChapterDonations, getSellerById, getPendingPromoters, updatePromoterStatus, getPromoterById, getUserByEmail, linkUserToSeller, updateSellerInvitationToken } from '../db/queries';
import { createConnectAccount } from '../services/stripe';
import { sendSellerApprovedEmail } from '../services/email';
import { generateInvitationToken } from '../utils/tokens';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Use Cognito authentication middleware
router.use(authenticate);
router.use(requireAdmin);

const approveSellerSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

router.get('/sellers/pending', async (req: Request, res: Response) => {
  try {
    const sellers = await getPendingSellers();
    res.json(sellers);
  } catch (error) {
    console.error('Error fetching pending sellers:', error);
    res.status(500).json({ error: 'Failed to fetch pending sellers' });
  }
});

router.put('/sellers/:id', async (req: Request, res: Response) => {
  try {
    const sellerId = parseInt(req.params.id);
    const body = approveSellerSchema.parse(req.body);
    
    let stripeAccountId: string | undefined;
    let invitationToken: string | undefined;
    
    // If approving, create Stripe Connect account and generate invitation token
    if (body.status === 'APPROVED') {
      const seller = await getSellerById(sellerId);
      
      if (!seller) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      // Check if seller already has a Cognito account (if they're already a member)
      const existingUser = await getUserByEmail(seller.email);
      
      if (existingUser) {
        // Seller already has an account - link it to seller role
        await linkUserToSeller(existingUser.id, sellerId);
      } else {
        // Generate invitation token for new seller account
        invitationToken = generateInvitationToken();
        await updateSellerInvitationToken(sellerId, invitationToken);
      }

      const account = await createConnectAccount(seller.email);
      stripeAccountId = account.id;
    }

    const updatedSeller = await updateSellerStatus(sellerId, body.status, stripeAccountId);
    
    // Send approval email if seller was approved
    if (body.status === 'APPROVED' && updatedSeller) {
      sendSellerApprovedEmail(
        updatedSeller.email, 
        updatedSeller.name,
        invitationToken || undefined
      ).catch(error => {
        console.error('Failed to send seller approved email:', error);
      });
    }
    
    res.json(updatedSeller);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating seller status:', error);
    res.status(500).json({ error: 'Failed to update seller status' });
  }
});

router.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/donations', async (req: Request, res: Response) => {
  try {
    const donations = await getChapterDonations();
    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// Promoter admin routes
router.get('/promoters/pending', async (req: Request, res: Response) => {
  try {
    const promoters = await getPendingPromoters();
    res.json(promoters);
  } catch (error) {
    console.error('Error fetching pending promoters:', error);
    res.status(500).json({ error: 'Failed to fetch pending promoters' });
  }
});

router.put('/promoters/:id', async (req: Request, res: Response) => {
  try {
    const promoterId = parseInt(req.params.id);
    const body = approveSellerSchema.parse(req.body);
    
    let stripeAccountId: string | undefined;
    
    // If approving, create Stripe Connect account
    if (body.status === 'APPROVED') {
      const promoter = await getPromoterById(promoterId);
      
      if (!promoter) {
        return res.status(404).json({ error: 'Promoter not found' });
      }

      const account = await createConnectAccount(promoter.email);
      stripeAccountId = account.id;
    }

    const updatedPromoter = await updatePromoterStatus(promoterId, body.status, stripeAccountId);
    res.json(updatedPromoter);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating promoter status:', error);
    res.status(500).json({ error: 'Failed to update promoter status' });
  }
});

export default router;

