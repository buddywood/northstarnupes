import { Request, Response, NextFunction } from 'express';
import { verifyCognitoToken, extractUserInfoFromToken } from '../services/cognito';
import { getUserByCognitoSub, createUser, getMemberById } from '../db/queries';
import pool from '../db/connection';

// Extend Express Request to include user
declare global {
  namespace Express {
      interface Request {
        user?: {
          id: number;
          cognitoSub: string;
          email: string;
          role: 'ADMIN' | 'SELLER' | 'PROMOTER' | 'CONSUMER' | 'STEWARD';
          memberId: number | null;
          sellerId: number | null;
          promoterId: number | null;
          stewardId: number | null;
          features: Record<string, any>;
        };
      }
  }
}

/**
 * Middleware to authenticate requests using Cognito JWT tokens
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = await verifyCognitoToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Extract user info from token
    const { cognitoSub, email } = extractUserInfoFromToken(payload);

    // Get user in database - user must exist (created during registration)
    const user = await getUserByCognitoSub(cognitoSub);
    if (!user) {
      res.status(403).json({ 
        error: 'User not found. Please complete registration first.',
        code: 'USER_NOT_REGISTERED'
      });
      return;
    }

    // Validate fraternity_member_id if it exists - check if fraternity_member record actually exists
    let memberId = user.fraternity_member_id;
    if (memberId) {
      const memberCheck = await pool.query('SELECT id FROM fraternity_members WHERE id = $1', [memberId]);
      if (memberCheck.rows.length === 0) {
        // Orphaned fraternity_member_id detected - clear it
        console.warn(`Orphaned fraternity_member_id detected in authenticate middleware: user ${user.id} has fraternity_member_id ${memberId} but fraternity_member doesn't exist`);
        try {
          await pool.query(
            `UPDATE users 
             SET fraternity_member_id = NULL, 
                 onboarding_status = 'ONBOARDING_STARTED',
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [user.id]
          );
          memberId = null;
          user.fraternity_member_id = null;
          user.onboarding_status = 'ONBOARDING_STARTED';
        } catch (cleanupError) {
          console.error('Error clearing orphaned fraternity_member_id in authenticate:', cleanupError);
        }
      }
    }

    // Attach user to request
    req.user = {
      id: user.id,
      cognitoSub: user.cognito_sub,
      email: user.email,
      role: user.role,
      memberId: memberId,
      sellerId: user.seller_id,
      promoterId: user.promoter_id,
      stewardId: user.steward_id || null,
      features: user.features,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(...allowedRoles: Array<'ADMIN' | 'SELLER' | 'PROMOTER' | 'CONSUMER' | 'STEWARD'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Middleware specifically for admin routes
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

/**
 * Middleware to require steward role
 */
export function requireSteward(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'STEWARD' && req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Steward access required' });
    return;
  }

  if (req.user.role === 'STEWARD' && !req.user.stewardId) {
    res.status(403).json({ error: 'Steward profile not found' });
    return;
  }

  next();
}

/**
 * Middleware to require verified member status
 * Used for steward marketplace access
 */
export async function requireVerifiedMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.user.memberId) {
      res.status(403).json({ error: 'Member profile required' });
      return;
    }

    const member = await getMemberById(req.user.memberId);
    if (!member) {
      // This shouldn't happen if authenticate middleware is working correctly,
      // but handle it gracefully
      res.status(404).json({ 
        error: 'Member not found',
        code: 'MEMBER_NOT_FOUND',
        requiresRegistration: true
      });
      return;
    }

    if (member.verification_status !== 'VERIFIED') {
      res.status(403).json({ 
        error: 'Verified member status required',
        code: 'VERIFICATION_REQUIRED'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking verified member status:', error);
    res.status(500).json({ error: 'Failed to verify member status' });
  }
}

