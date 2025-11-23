import pool from '../db/connection';
import { User } from '../types';
import { getUserByCognitoSub } from '../db/queries';

/**
 * Get fraternity_member_id from role-specific tables based on user's role
 * Returns null if user doesn't have a fraternity member ID
 */
export async function getFraternityMemberId(user: User): Promise<number | null> {
  if (user.role === 'SELLER' && user.seller_id) {
    const sellerResult = await pool.query('SELECT fraternity_member_id FROM sellers WHERE id = $1', [user.seller_id]);
    return sellerResult.rows[0]?.fraternity_member_id || null;
  } else if (user.role === 'PROMOTER' && user.promoter_id) {
    const promoterResult = await pool.query('SELECT fraternity_member_id FROM promoters WHERE id = $1', [user.promoter_id]);
    return promoterResult.rows[0]?.fraternity_member_id || null;
  } else if (user.role === 'STEWARD' && user.steward_id) {
    const stewardResult = await pool.query('SELECT fraternity_member_id FROM stewards WHERE id = $1', [user.steward_id]);
    return stewardResult.rows[0]?.fraternity_member_id || null;
  } else if (user.role === 'GUEST') {
    // For GUEST, match by email/cognito_sub with fraternity_members table
    const memberResult = await pool.query(
      'SELECT id FROM fraternity_members WHERE email = $1 OR cognito_sub = $2',
      [user.email, user.cognito_sub]
    );
    return memberResult.rows[0]?.id || null;
  }
  return null;
}

/**
 * Get fraternity_member_id from request user (looks up full user from database first)
 */
export async function getFraternityMemberIdFromRequest(req: { user?: { cognitoSub: string } }): Promise<number | null> {
  if (!req.user) {
    return null;
  }
  const user = await getUserByCognitoSub(req.user.cognitoSub);
  if (!user) {
    return null;
  }
  return getFraternityMemberId(user);
}

