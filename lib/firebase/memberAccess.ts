import { getMemberByEmail } from './members';
import { Member, MemberStatus } from '@/types/onboarding';

/**
 * Check if a member has access to the portal
 * Only ACTIVE members can access member-only routes
 */
export async function checkMemberAccess(email: string): Promise<{
  hasAccess: boolean;
  member?: Member;
  reason?: string;
}> {
  if (!email) {
    return { hasAccess: false, reason: 'No email provided' };
  }

  const member = await getMemberByEmail(email);

  if (!member) {
    return { hasAccess: false, reason: 'Not a member' };
  }

  if (member.status !== 'ACTIVE') {
    return {
      hasAccess: false,
      member,
      reason: getMemberStatusMessage(member.status),
    };
  }

  return { hasAccess: true, member };
}

/**
 * Get user-friendly message for member status
 */
export function getMemberStatusMessage(status: MemberStatus): string {
  switch (status) {
    case 'INVITED':
    case 'PENDING_PROFILE':
      return 'Please complete your profile to access the portal';
    case 'PENDING_PAYMENT':
      return 'Please pay your membership dues to access the portal';
    case 'INACTIVE':
      return 'Your membership is inactive. Please contact an administrator';
    case 'ACTIVE':
      return 'Your membership is active';
    default:
      return 'Unknown membership status';
  }
}

/**
 * Check if member can access admin features
 */
export async function checkAdminAccess(email: string): Promise<boolean> {
  const { hasAccess, member } = await checkMemberAccess(email);
  return hasAccess && member?.isAdmin === true;
}

/**
 * Get redirect URL based on member status
 */
export function getRedirectForMemberStatus(member: Member): string {
  switch (member.status) {
    case 'INVITED':
    case 'PENDING_PROFILE':
    case 'PENDING_PAYMENT':
      return '/portal/onboarding';
    case 'INACTIVE':
      return '/portal/inactive';
    case 'ACTIVE':
      return '/portal';
    default:
      return '/portal/login';
  }
}
