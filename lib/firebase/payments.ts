import { getFirebaseAdminDb } from './admin';
import { Payment, PaymentStatus } from '@/types/onboarding';
import { Timestamp } from 'firebase-admin/firestore';

const PAYMENTS_COLLECTION = 'payments';

/**
 * Create a new payment record
 */
export async function createPayment(data: {
  memberId: string;
  email: string;
  stripeSessionId: string;
  amount: number;
  currency: string;
  type?: 'DUES' | 'DONATION' | 'EVENT';
  description?: string;
}): Promise<Payment> {
  const db = getFirebaseAdminDb();
  const paymentRef = db.collection(PAYMENTS_COLLECTION).doc();
  
  const now = Timestamp.now();
  const payment: Payment = {
    id: paymentRef.id,
    memberId: data.memberId,
    email: data.email.toLowerCase(),
    stripeSessionId: data.stripeSessionId,
    amount: data.amount,
    currency: data.currency,
    status: 'PENDING',
    type: data.type || 'DUES',
    description: data.description,
    createdAt: now,
    updatedAt: now,
  };

  await paymentRef.set(payment);
  return payment;
}

/**
 * Get payment by Stripe session ID
 */
export async function getPaymentBySessionId(sessionId: string): Promise<Payment | null> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(PAYMENTS_COLLECTION)
    .where('stripeSessionId', '==', sessionId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as Payment;
}

/**
 * Get payment by ID
 */
export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  const db = getFirebaseAdminDb();
  const doc = await db.collection(PAYMENTS_COLLECTION).doc(paymentId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as Payment;
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  stripePaymentIntentId?: string
): Promise<void> {
  const db = getFirebaseAdminDb();
  const updates: any = {
    status,
    updatedAt: Timestamp.now(),
  };

  if (status === 'PAID') {
    updates.paidAt = Timestamp.now();
  }

  if (stripePaymentIntentId) {
    updates.stripePaymentIntentId = stripePaymentIntentId;
  }

  await db.collection(PAYMENTS_COLLECTION).doc(paymentId).update(updates);
}

/**
 * Mark payment as paid
 */
export async function markPaymentPaid(
  sessionId: string,
  paymentIntentId?: string
): Promise<Payment | null> {
  const payment = await getPaymentBySessionId(sessionId);
  
  if (!payment) {
    return null;
  }

  await updatePaymentStatus(payment.id, 'PAID', paymentIntentId);
  
  return {
    ...payment,
    status: 'PAID',
    paidAt: Timestamp.now(),
    stripePaymentIntentId: paymentIntentId,
  };
}

/**
 * Get all payments for a member
 */
export async function getMemberPayments(memberId: string): Promise<Payment[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(PAYMENTS_COLLECTION)
    .where('memberId', '==', memberId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Payment);
}

/**
 * Get all payments (for admin)
 */
export async function getAllPayments(): Promise<Payment[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(PAYMENTS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Payment);
}

/**
 * Get payments by status
 */
export async function getPaymentsByStatus(status: PaymentStatus): Promise<Payment[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(PAYMENTS_COLLECTION)
    .where('status', '==', status)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Payment);
}
