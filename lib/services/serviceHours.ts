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

export async function getMemberTotalHours(memberId: string): Promise<number> {
  const hours = await getServiceHours(memberId);
  return hours
    .filter((h) => h.status === 'approved')
    .reduce((sum, h) => sum + (h.hours || 0), 0);
}

export async function getMemberYearHours(memberId: string): Promise<number> {
  const now = new Date();
  const yearStart = now.getMonth() >= 6
    ? new Date(now.getFullYear(), 6, 1)
    : new Date(now.getFullYear() - 1, 6, 1);

  const hours = await getServiceHours(memberId);
  return hours
    .filter((h) => h.status === 'approved' && new Date(h.createdAt) >= yearStart)
    .reduce((sum, h) => sum + (h.hours || 0), 0);
}

export async function getPendingServiceHours(): Promise<ServiceHour[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceHour));
}
