import pool from '../db/connection';
import { User } from '../types';
import { getFraternityMemberId } from './getFraternityMemberId';

/**
 * Check if a user is a verified fraternity member
 * Returns true only if:
 * 1. User has a fraternity_member_id (from role-specific tables)
 * 2. The member exists in fraternity_members table
 * 3. The member's verification_status is 'VERIFIED'
 */
export async function isVerifiedMember(user: User): Promise<boolean> {
  // Get fraternity_member_id from role-specific tables
  const fraternityMemberId = await getFraternityMemberId(user);
  
  if (!fraternityMemberId) {
    return false;
  }

  // Check if member exists and is verified
  const memberResult = await pool.query(
    'SELECT verification_status FROM fraternity_members WHERE id = $1',
    [fraternityMemberId]
  );

  if (memberResult.rows.length === 0) {
    // Member doesn't exist
    return false;
  }

  // Check verification status
  const verificationStatus = memberResult.rows[0]?.verification_status;
  return verificationStatus === 'VERIFIED';
}

