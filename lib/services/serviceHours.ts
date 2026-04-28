/**
 * Service hours operations (server-side).
 */
import { adminDb } from '@/lib/firebase/admin';
import type { ServiceHour, ServiceHourStatus } from '@/types';

const COLLECTION = 'serviceHours';

export async function getServiceHours(memberId?: string): Promise<ServiceHour[]> {
  let q: FirebaseFirestore.Query = adminDb.collection(COLLECTION);
  if (memberId) q = q.where('memberId', '==', memberId);
  q = q.orderBy('createdAt', 'desc');
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceHour));
}

export async function getServiceHour(id: string): Promise<ServiceHour | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as ServiceHour;
}

export async function logServiceHours(data: {
  memberId: string;
  memberName: string;
  eventId: string;
  eventTitle: string;
  hours: number;
  notes?: string;
}): Promise<string> {
  const ref = await adminDb.collection(COLLECTION).add({
    ...data,
    status: 'pending' as ServiceHourStatus,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateServiceHourStatus(
  id: string,
  status: ServiceHourStatus,
  reviewerId: string,
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).update({
    status,
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString(),
  });
}

/**
 * Get total approved hours for a member using server-side aggregation.
 * Fetches only approved records to minimise data transfer.
 */
export async function getMemberTotalHours(memberId: string): Promise<number> {
  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .where('memberId', '==', memberId)
      .where('status', '==', 'approved')
      .get();

    return snap.docs.reduce((sum, d) => sum + (d.data().hours || 0), 0);
  } catch (e) {
    console.error('getMemberTotalHours error:', e);
    return 0;
  }
}

/**
 * Get approved hours for a member within the current Rotary year
 * (starting July 1st).
 */
export async function getMemberYearHours(memberId: string): Promise<number> {
  const now = new Date();
  const yearStart = now.getMonth() >= 6
    ? new Date(now.getFullYear(), 6, 1).toISOString()
    : new Date(now.getFullYear() - 1, 6, 1).toISOString();

  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .where('memberId', '==', memberId)
      .where('status', '==', 'approved')
      .where('createdAt', '>=', yearStart)
      .get();

    return snap.docs.reduce((sum, d) => sum + (d.data().hours || 0), 0);
  } catch (e) {
    console.error('getMemberYearHours error:', e);
    return 0;
  }
}

export async function getPendingServiceHours(): Promise<ServiceHour[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceHour));
}
