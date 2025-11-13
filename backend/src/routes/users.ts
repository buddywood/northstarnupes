import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../middleware/auth';
import { getUserById, upsertUserOnLogin } from '../db/queries';
import { verifyCognitoToken, extractUserInfoFromToken } from '../services/cognito';
import pool from '../db/connection';

const router: ExpressRouter = Router();

// Get current user info
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get name based on role
    let name: string | null = null;
    if (user.member_id) {
      const memberResult = await pool.query('SELECT name FROM members WHERE id = $1', [user.member_id]);
      if (memberResult.rows.length === 0) {
        // Orphaned member_id detected - clear it
        console.warn(`Orphaned member_id detected for user ${user.id}: member_id ${user.member_id} doesn't exist`);
        await pool.query(
          `UPDATE users 
           SET member_id = NULL, 
               onboarding_status = 'ONBOARDING_STARTED',
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [user.id]
        );
        user.member_id = null;
        user.onboarding_status = 'ONBOARDING_STARTED';
      } else {
        name = memberResult.rows[0]?.name || null;
      }
    } else if (user.seller_id) {
      const sellerResult = await pool.query('SELECT name FROM sellers WHERE id = $1', [user.seller_id]);
      name = sellerResult.rows[0]?.name || null;
    } else if (user.promoter_id) {
      const promoterResult = await pool.query('SELECT name FROM promoters WHERE id = $1', [user.promoter_id]);
      name = promoterResult.rows[0]?.name || null;
    }

    res.json({
      id: user.id,
      cognito_sub: user.cognito_sub,
      email: user.email,
      role: user.role,
      onboarding_status: user.onboarding_status,
      member_id: user.member_id,
      seller_id: user.seller_id,
      promoter_id: user.promoter_id,
      features: user.features,
      name: name,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Upsert user on login (insert or update with last_login)
// This endpoint verifies the Cognito token directly (not using authenticate middleware)
// because the user might not exist in the database yet
router.post('/upsert-on-login', async (req: Request, res: Response) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = await verifyCognitoToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Extract user info from token
    const { cognitoSub: tokenCognitoSub, email: tokenEmail } = extractUserInfoFromToken(payload);

    const { cognito_sub, email } = req.body;

    if (!cognito_sub || !email) {
      return res.status(400).json({ error: 'cognito_sub and email are required' });
    }

    // Verify the cognito_sub matches the token
    if (tokenCognitoSub !== cognito_sub) {
      return res.status(403).json({ error: 'Forbidden: cognito_sub mismatch' });
    }

    // Use email from token if provided, otherwise use body email
    const userEmail = tokenEmail || email;

    const user = await upsertUserOnLogin(cognito_sub, userEmail);

    // Get name based on role
    let name: string | null = null;
    if (user.member_id) {
      const memberResult = await pool.query('SELECT name FROM members WHERE id = $1', [user.member_id]);
      if (memberResult.rows.length === 0) {
        // Orphaned member_id detected - clear it
        console.warn(`Orphaned member_id detected for user ${user.id}: member_id ${user.member_id} doesn't exist`);
        await pool.query(
          `UPDATE users 
           SET member_id = NULL, 
               onboarding_status = 'ONBOARDING_STARTED',
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [user.id]
        );
        user.member_id = null;
        user.onboarding_status = 'ONBOARDING_STARTED';
      } else {
        name = memberResult.rows[0]?.name || null;
      }
    } else if (user.seller_id) {
      const sellerResult = await pool.query('SELECT name FROM sellers WHERE id = $1', [user.seller_id]);
      name = sellerResult.rows[0]?.name || null;
    } else if (user.promoter_id) {
      const promoterResult = await pool.query('SELECT name FROM promoters WHERE id = $1', [user.promoter_id]);
      name = promoterResult.rows[0]?.name || null;
    }

    res.json({
      id: user.id,
      cognito_sub: user.cognito_sub,
      email: user.email,
      role: user.role,
      onboarding_status: user.onboarding_status,
      member_id: user.member_id,
      seller_id: user.seller_id,
      promoter_id: user.promoter_id,
      features: user.features,
      name: name,
      last_login: user.last_login,
    });
  } catch (error) {
    console.error('Error upserting user on login:', error);
    res.status(500).json({ error: 'Failed to upsert user' });
  }
});

export default router;

