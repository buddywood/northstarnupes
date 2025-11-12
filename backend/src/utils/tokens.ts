import { randomBytes } from 'crypto';

/**
 * Generate a secure random token for seller invitations
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

