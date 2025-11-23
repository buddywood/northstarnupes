import { Request, Response, NextFunction } from 'express';
import { verifyCognitoToken, extractUserInfoFromToken } from '../services/cognito';
import { getUserByCognitoSub, createUser, getMemberById } from '../db/queries';
import { getFraternityMemberId } from '../utils/getFraternityMemberId';
import pool from '../db/connection';

// Extend Express Request to include user
declare global {
  namespace Express {
      interface Request {
        user?: {
          id: number;
          cognitoSub: string;
          email: string;
          role: 'ADMIN' | 'SELLER' | 'PROMOTER' | 'GUEST' | 'STEWARD';
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

    // Attach user to request (fraternity_member_id is looked up from role-specific tables when needed)
    req.user = {
      id: user.id,
      cognitoSub: user.cognito_sub,
      email: user.email,
      role: user.role,
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
export function requireRole(...allowedRoles: Array<'ADMIN' | 'SELLER' | 'PROMOTER' | 'GUEST' | 'STEWARD'>) {
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
 * Optional authentication middleware - doesn't fail if no token, but sets req.user if token is valid
 */
export async function authenticateOptional(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = await verifyCognitoToken(token);
    if (!payload) {
      // Invalid token - continue without authentication
      next();
      return;
    }

    // Extract user info from token
    const { cognitoSub, email } = extractUserInfoFromToken(payload);

    // Get user in database
    const user = await getUserByCognitoSub(cognitoSub);
    if (!user) {
      // User not found - continue without authentication
      next();
      return;
    }

    // Attach user to request (fraternity_member_id is looked up from role-specific tables when needed)
    req.user = {
      id: user.id,
      cognitoSub: user.cognito_sub,
      email: user.email,
      role: user.role,
      sellerId: user.seller_id,
      promoterId: user.promoter_id,
      stewardId: user.steward_id || null,
      features: user.features,
    };

    next();
  } catch (error) {
    // On error, continue without authentication (don't block the request)
    console.warn('Optional authentication error (continuing without auth):', error);
    next();
  }
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

    // Get user from database to pass to getFraternityMemberId
    const user = await getUserByCognitoSub(req.user.cognitoSub);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const fraternityMemberId = await getFraternityMemberId(user);
    if (!fraternityMemberId) {
      res.status(403).json({ error: 'Member profile required' });
      return;
    }

    const member = await getMemberById(fraternityMemberId);
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

