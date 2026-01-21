import { Timestamp } from 'firebase/firestore';

/**
 * Rotary Year runs from July 1 to June 30
 * CycleId format: RY-{endingYear}
 * Example: RY-2026 = July 1, 2025 to June 30, 2026
 */

/**
 * Status of member dues for a specific cycle
 */
export type MemberDuesStatus = 
  | 'UNPAID'       // Member has not paid
  | 'PAID'         // Member paid online
  | 'PAID_OFFLINE' // Admin marked as paid (cash/check)
  | 'WAIVED';      // Admin waived dues

/**
 * Dues cycle (Rotary Year)
 * Collection: dues_cycles/{cycleId}
 */
export interface DuesCycle {
  id: string;              // e.g., "RY-2026"
  label: string;           // e.g., "Rotary Year 2026"
  startDate: Timestamp | Date;  // July 1
  endDate: Timestamp | Date;    // June 30
  amount: number;          // Amount in cents (8500 = $85)
  currency: string;        // 'USD'
  isActive: boolean;       // Only one cycle can be active
  graceDays: number;       // Days after endDate before auto-inactive (default: 30)
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;       // Admin who created it
}

/**
 * Member's dues status for a specific cycle
 * Collection: member_dues/{memberId}/cycles/{cycleId}
 */
export interface MemberDues {
  id: string;              // cycleId (e.g., "RY-2026")
  memberId: string;
  cycleId: string;         // Reference to dues_cycle
  status: MemberDuesStatus;
  
  // Payment/waiver details
  paidAt?: Timestamp | Date;
  waivedAt?: Timestamp | Date;
  paidOfflineAt?: Timestamp | Date;
  
  // Reference to payment if paid online
  paymentRef?: string;     // dues_payments/{paymentId}
  
  // Admin notes for offline payments or waivers
  note?: string;
  
  // Timestamps
  updatedAt: Timestamp | Date;
  updatedBy?: string;      // Admin who updated (for offline/waived)
}

/**
 * Dues payment record
 * Collection: dues_payments/{paymentId}
 */
export interface DuesPayment {
  id: string;
  memberId: string;
  cycleId: string;         // Which Rotary Year
  email: string;
  
  // Stripe details
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  
  // Payment info
  amount: number;          // Amount in cents
  currency: string;        // 'USD'
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  
  // Metadata
  description?: string;
  
  // Timestamps
  createdAt: Timestamp | Date;
  paidAt?: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Helper interface for cycle creation
 */
export interface CreateCycleData {
  endingYear: number;      // e.g., 2026 for RY-2026
  amount?: number;         // Optional override, defaults to 8500 ($85)
  graceDays?: number;      // Optional override, defaults to 30
}

/**
 * Helper interface for admin actions
 */
export interface MarkDuesAction {
  memberId: string;
  cycleId: string;
  note: string;            // Required explanation
  adminUid: string;        // Who performed the action
}

/**
 * Member dues summary for display
 */
export interface MemberDuesSummary {
  memberId: string;
  memberName: string;
  email: string;
  cycleId: string;
  status: MemberDuesStatus;
  paidAt?: Date;
  note?: string;
  amount: number;
}
