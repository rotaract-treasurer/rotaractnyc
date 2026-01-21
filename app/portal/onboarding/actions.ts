'use server';

import { validateInvitationToken, markInvitationUsed } from '@/lib/firebase/invitations';
import { getMemberById, updateMemberProfile } from '@/lib/firebase/members';
import { Member } from '@/types/onboarding';

/**
 * Validate the invitation token and return member data
 */
export async function validateToken(token: string): Promise<{
  success: boolean;
  member?: Member;
  error?: string;
}> {
  try {
    const validation = await validateInvitationToken(token);

    if (!validation.valid || !validation.invitation) {
      return {
        success: false,
        error: validation.error || 'Invalid token',
      };
    }

    const invitation = validation.invitation;

    // Get member data
    if (!invitation.memberId) {
      return {
        success: false,
        error: 'No member associated with this invitation',
      };
    }

    const member = await getMemberById(invitation.memberId);

    if (!member) {
      return {
        success: false,
        error: 'Member not found',
      };
    }

    // Mark invitation as used (only once)
    if (invitation.status === 'SENT') {
      await markInvitationUsed(invitation.id);
    }

    return {
      success: true,
      member,
    };
  } catch (error: any) {
    console.error('Error validating token:', error);
    return {
      success: false,
      error: error.message || 'Failed to validate token',
    };
  }
}

/**
 * Complete member profile (Step 2)
 */
export async function completeProfile(data: {
  memberId: string;
  fullName: string;
  bio: string;
  photoURL?: string;
  role?: string;
  company?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await updateMemberProfile(data.memberId, {
      fullName: data.fullName,
      bio: data.bio,
      photoURL: data.photoURL,
      role: data.role,
      company: data.company,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error completing profile:', error);
    return {
      success: false,
      error: error.message || 'Failed to update profile',
    };
  }
}

/**
 * Create Stripe Checkout session (Step 3)
 */
export async function createCheckoutSession(data: {
  memberId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Call the API route to create Stripe session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/stripe/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Failed to create checkout session',
      };
    }

    const result = await response.json();

    return {
      success: true,
      url: result.url,
    };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      error: error.message || 'Failed to create checkout session',
    };
  }
}
