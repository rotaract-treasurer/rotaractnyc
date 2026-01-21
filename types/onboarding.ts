import { Timestamp } from 'firebase/firestore';

/**
 * Member status values track the onboarding and membership lifecycle
 */
export type MemberStatus = 
  | 'INVITED'           // Initial state - invitation sent
  | 'PENDING_PROFILE'   // Member authenticated but profile incomplete
  | 'PENDING_PAYMENT'   // Profile complete but dues not paid
  | 'ACTIVE'            // Profile complete AND dues paid
  | 'INACTIVE';         // Member deactivated

/**
 * Payment status values
 */
export type PaymentStatus = 
  | 'PENDING'    // Payment initiated but not confirmed
  | 'PAID'       // Payment confirmed
  | 'FAILED'     // Payment failed
  | 'REFUNDED';  // Payment refunded

/**
 * Invitation status values
 */
export type InvitationStatus = 
  | 'SENT'      // Invitation sent
  | 'USED'      // Token used for onboarding
  | 'EXPIRED';  // Token expired

/**
 * Member record in Firestore
 * Collection: members/{memberId}
 */
export interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  bio?: string;
  photoURL?: string;
  role?: string;           // Job title or role
  company?: string;
  status: MemberStatus;
  isAdmin: boolean;
  
  // Dues information
  dues: {
    amount: number;        // Amount in cents (8500 = $85)
    currency: string;      // 'USD'
    paid: boolean;
    paidAt?: Timestamp | Date;
    stripePaymentId?: string;
  };
  
  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  invitedAt?: Timestamp | Date;
  profileCompletedAt?: Timestamp | Date;
}

/**
 * Invitation record in Firestore
 * Collection: invitations/{inviteId}
 */
export interface Invitation {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tokenHash: string;       // Hashed token for security
  status: InvitationStatus;
  memberId?: string;       // Reference to created member
  
  // Timestamps
  createdAt: Timestamp | Date;
  expiresAt: Timestamp | Date;
  usedAt?: Timestamp | Date;
  createdBy: string;       // Admin user ID who created the invite
}

/**
 * Payment record in Firestore
 * Collection: payments/{paymentId}
 */
export interface Payment {
  id: string;
  memberId: string;
  email: string;
  
  // Stripe details
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  
  // Payment info
  amount: number;          // Amount in cents
  currency: string;        // 'USD'
  status: PaymentStatus;
  
  // Metadata
  type: 'DUES' | 'DONATION' | 'EVENT';
  description?: string;
  
  // Timestamps
  createdAt: Timestamp | Date;
  paidAt?: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Client-side form data for profile completion
 */
export interface ProfileFormData {
  fullName: string;
  bio: string;
  photoURL?: string;
  role?: string;
  company?: string;
}

/**
 * Onboarding step tracking
 */
export type OnboardingStep = 1 | 2 | 3;

export interface OnboardingState {
  step: OnboardingStep;
  token?: string;
  email?: string;
  memberId?: string;
  profileComplete: boolean;
  paymentComplete: boolean;
}
