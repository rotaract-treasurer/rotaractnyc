import { getFirebaseAdminDb } from './admin';
import { DuesCycle, MemberDues, DuesPayment, MemberDuesStatus, CreateCycleData, MarkDuesAction } from '@/types/dues';
import { Timestamp } from 'firebase-admin/firestore';
import { createCycleId, getRotaryYearLabel, getRotaryYearDates } from '@/lib/utils/rotaryYear';

const DUES_CYCLES_COLLECTION = 'dues_cycles';
const MEMBER_DUES_COLLECTION = 'member_dues';
const DUES_PAYMENTS_COLLECTION = 'dues_payments';

/**
 * Create a new dues cycle for a Rotary Year
 */
export async function createDuesCycle(data: CreateCycleData & { createdBy: string }): Promise<DuesCycle> {
  const db = getFirebaseAdminDb();
  
  const cycleId = createCycleId(data.endingYear);
  const { startDate, endDate } = getRotaryYearDates(data.endingYear);
  
  const now = Timestamp.now();
  const cycle: DuesCycle = {
    id: cycleId,
    label: getRotaryYearLabel(cycleId),
    startDate: startDate,
    endDate: endDate,
    amount: data.amount || 8500, // Default $85
    currency: 'USD',
    isActive: false, // Admin must manually activate
    graceDays: data.graceDays || 30,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
    createdBy: data.createdBy,
  };
  
  await db.collection(DUES_CYCLES_COLLECTION).doc(cycleId).set(cycle);
  return cycle;
}

/**
 * Get a dues cycle by ID
 */
export async function getDuesCycle(cycleId: string): Promise<DuesCycle | null> {
  const db = getFirebaseAdminDb();
  const doc = await db.collection(DUES_CYCLES_COLLECTION).doc(cycleId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as DuesCycle;
}

/**
 * Get the currently active dues cycle
 */
export async function getActiveDuesCycle(): Promise<DuesCycle | null> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(DUES_CYCLES_COLLECTION)
    .where('isActive', '==', true)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data() as DuesCycle;
}

/**
 * Activate a dues cycle (deactivates all others)
 */
export async function activateDuesCycle(cycleId: string): Promise<void> {
  const db = getFirebaseAdminDb();
  const batch = db.batch();
  
  // Deactivate all cycles
  const allCycles = await db.collection(DUES_CYCLES_COLLECTION).get();
  allCycles.docs.forEach((doc) => {
    batch.update(doc.ref, { isActive: false, updatedAt: Timestamp.now() });
  });
  
  // Activate the specified cycle
  const cycleRef = db.collection(DUES_CYCLES_COLLECTION).doc(cycleId);
  batch.update(cycleRef, { isActive: true, updatedAt: Timestamp.now() });
  
  await batch.commit();
}

/**
 * Get all dues cycles
 */
export async function getAllDuesCycles(): Promise<DuesCycle[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(DUES_CYCLES_COLLECTION)
    .orderBy('startDate', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as DuesCycle);
}

/**
 * Get member's dues status for a specific cycle
 */
export async function getMemberDues(memberId: string, cycleId: string): Promise<MemberDues | null> {
  const db = getFirebaseAdminDb();
  const doc = await db
    .collection(MEMBER_DUES_COLLECTION)
    .doc(memberId)
    .collection('cycles')
    .doc(cycleId)
    .get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as MemberDues;
}

/**
 * Create or update member dues record
 */
export async function setMemberDues(
  memberId: string,
  cycleId: string,
  data: Partial<MemberDues>
): Promise<void> {
  const db = getFirebaseAdminDb();
  const docRef = db
    .collection(MEMBER_DUES_COLLECTION)
    .doc(memberId)
    .collection('cycles')
    .doc(cycleId);
  
  const updates = {
    ...data,
    memberId,
    cycleId,
    id: cycleId,
    updatedAt: Timestamp.now(),
  };
  
  await docRef.set(updates, { merge: true });
}

/**
 * Mark member dues as paid (from Stripe webhook)
 */
export async function markDuesPaidOnline(
  memberId: string,
  cycleId: string,
  paymentRef: string
): Promise<void> {
  const now = Timestamp.now();
  await setMemberDues(memberId, cycleId, {
    status: 'PAID',
    paidAt: now.toDate(),
    paymentRef,
  });
}

/**
 * Mark member dues as paid offline (admin action)
 */
export async function markDuesPaidOffline(action: MarkDuesAction): Promise<void> {
  const now = Timestamp.now();
  await setMemberDues(action.memberId, action.cycleId, {
    status: 'PAID_OFFLINE',
    paidOfflineAt: now.toDate(),
    note: action.note,
    updatedBy: action.adminUid,
  });
}

/**
 * Waive member dues (admin action)
 */
export async function waiveMemberDues(action: MarkDuesAction): Promise<void> {
  const now = Timestamp.now();
  await setMemberDues(action.memberId, action.cycleId, {
    status: 'WAIVED',
    waivedAt: now.toDate(),
    note: action.note,
    updatedBy: action.adminUid,
  });
}

/**
 * Get all members' dues status for a specific cycle
 */
export async function getAllMemberDuesForCycle(cycleId: string): Promise<Map<string, MemberDues>> {
  const db = getFirebaseAdminDb();
  
  // Get all members
  const membersSnapshot = await db.collection('members').get();
  const memberDuesMap = new Map<string, MemberDues>();
  
  // For each member, get their dues status
  for (const memberDoc of membersSnapshot.docs) {
    const memberId = memberDoc.id;
    const memberDues = await getMemberDues(memberId, cycleId);
    
    if (memberDues) {
      memberDuesMap.set(memberId, memberDues);
    } else {
      // Create default UNPAID record
      memberDuesMap.set(memberId, {
        id: cycleId,
        memberId,
        cycleId,
        status: 'UNPAID',
        updatedAt: Timestamp.now().toDate(),
      });
    }
  }
  
  return memberDuesMap;
}

/**
 * Create a dues payment record
 */
export async function createDuesPayment(data: {
  memberId: string;
  cycleId: string;
  email: string;
  stripeSessionId: string;
  amount: number;
  currency: string;
  description?: string;
}): Promise<DuesPayment> {
  const db = getFirebaseAdminDb();
  const paymentRef = db.collection(DUES_PAYMENTS_COLLECTION).doc();
  
  const now = Timestamp.now();
  const payment: DuesPayment = {
    id: paymentRef.id,
    memberId: data.memberId,
    cycleId: data.cycleId,
    email: data.email,
    stripeSessionId: data.stripeSessionId,
    amount: data.amount,
    currency: data.currency,
    status: 'PENDING',
    description: data.description,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
  
  await paymentRef.set(payment);
  return payment;
}

/**
 * Get payment by Stripe session ID
 */
export async function getDuesPaymentBySessionId(sessionId: string): Promise<DuesPayment | null> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(DUES_PAYMENTS_COLLECTION)
    .where('stripeSessionId', '==', sessionId)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data() as DuesPayment;
}

/**
 * Update payment status
 */
export async function updateDuesPaymentStatus(
  paymentId: string,
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
  paymentIntentId?: string
): Promise<void> {
  const db = getFirebaseAdminDb();
  const updates: any = {
    status,
    updatedAt: Timestamp.now(),
  };
  
  if (status === 'PAID') {
    updates.paidAt = Timestamp.now();
  }
  
  if (paymentIntentId) {
    updates.stripePaymentIntentId = paymentIntentId;
  }
  
  await db.collection(DUES_PAYMENTS_COLLECTION).doc(paymentId).update(updates);
}

/**
 * Mark payment as paid and update member dues
 */
export async function processDuesPayment(sessionId: string, paymentIntentId?: string): Promise<{
  payment: DuesPayment;
  memberId: string;
  cycleId: string;
} | null> {
  const payment = await getDuesPaymentBySessionId(sessionId);
  
  if (!payment) {
    return null;
  }
  
  // Update payment status
  await updateDuesPaymentStatus(payment.id, 'PAID', paymentIntentId);
  
  // Update member dues
  await markDuesPaidOnline(payment.memberId, payment.cycleId, payment.id);
  
  return {
    payment: { ...payment, status: 'PAID', paidAt: Timestamp.now().toDate() },
    memberId: payment.memberId,
    cycleId: payment.cycleId,
  };
}

/**
 * Get all payments for a member
 */
export async function getMemberDuesPayments(memberId: string): Promise<DuesPayment[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(DUES_PAYMENTS_COLLECTION)
    .where('memberId', '==', memberId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as DuesPayment);
}
