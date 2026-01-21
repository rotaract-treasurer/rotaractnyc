'use server';

import { createMember, getMemberByEmail } from '@/lib/firebase/members';
import { createInvitation } from '@/lib/firebase/invitations';
import { sendWelcomeEmail } from '@/lib/email/sendOnboarding';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export interface InviteResponse {
  success: boolean;
  error?: string;
  memberId?: string;
  invitationId?: string;
}

/**
 * Server action to invite a new member
 * Creates member record, invitation, and sends welcome email
 */
export async function inviteMember(data: {
  email: string;
  firstName: string;
  lastName: string;
  adminUid: string;
}): Promise<InviteResponse> {
  try {
    // Validate input
    if (!data.email || !data.firstName || !data.lastName) {
      return { success: false, error: 'Email, first name, and last name are required' };
    }

    if (!data.adminUid) {
      return { success: false, error: 'Admin user ID is required' };
    }

    // Normalize email
    const email = data.email.toLowerCase().trim();
    
    // Check if member already exists
    const existingMember = await getMemberByEmail(email);
    if (existingMember) {
      return { 
        success: false, 
        error: `A member with email ${email} already exists (Status: ${existingMember.status})` 
      };
    }

    // Create member record with PENDING_PROFILE status
    const member = await createMember({
      email,
      firstName: data.firstName,
      lastName: data.lastName,
      status: 'PENDING_PROFILE',
      isAdmin: false,
    });

    // Create invitation with secure token
    const { invitation, token } = await createInvitation({
      email,
      firstName: data.firstName,
      lastName: data.lastName,
      createdBy: data.adminUid,
      memberId: member.id,
    });

    // Generate onboarding URL with token
    const onboardingUrl = `${BASE_URL}/portal/onboarding?token=${token}`;

    // Send welcome email
    const emailResult = await sendWelcomeEmail({
      firstName: data.firstName,
      email,
      onboardingUrl,
      expiresInDays: 7,
    });

    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
      // Don't fail the entire operation if email fails
      // Return success but log the email error
    }

    return {
      success: true,
      memberId: member.id,
      invitationId: invitation.id,
    };
  } catch (error: any) {
    console.error('Error inviting member:', error);
    return {
      success: false,
      error: error.message || 'Failed to invite member',
    };
  }
}

/**
 * Resend invitation email
 */
export async function resendInvitation(data: {
  email: string;
  token: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getMemberByEmail(data.email);
    
    if (!member) {
      return { success: false, error: 'Member not found' };
    }

    const onboardingUrl = `${BASE_URL}/portal/onboarding?token=${data.token}`;

    const emailResult = await sendWelcomeEmail({
      firstName: member.firstName,
      email: member.email,
      onboardingUrl,
      expiresInDays: 7,
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    return {
      success: false,
      error: error.message || 'Failed to resend invitation',
    };
  }
}
