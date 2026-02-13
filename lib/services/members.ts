/**
 * Member CRUD operations (server-side).
 */
import { adminDb } from '@/lib/firebase/admin';
import type { Member, MemberRole, MemberStatus } from '@/types';

const COLLECTION = 'members';

export async function getMember(id: string): Promise<Member | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Member;
}

export async function getMembers(filters?: {
  status?: MemberStatus;
  role?: MemberRole;
  limit?: number;
}): Promise<Member[]> {
  let q: FirebaseFirestore.Query = adminDb.collection(COLLECTION);
  if (filters?.status) q = q.where('status', '==', filters.status);
  if (filters?.role) q = q.where('role', '==', filters.role);
  q = q.orderBy('displayName');
  if (filters?.limit) q = q.limit(filters.limit);

  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Member));
}

export async function getActiveMembers(): Promise<Member[]> {
  return getMembers({ status: 'active' });
}

export async function getBoardMembers(): Promise<Member[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where('role', 'in', ['board', 'president', 'treasurer'])
    .where('status', '==', 'active')
    .orderBy('displayName')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Member));
}

export async function createMember(data: Omit<Member, 'id'>): Promise<string> {
  const ref = await adminDb.collection(COLLECTION).add({
    ...data,
    joinedAt: data.joinedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateMember(id: string, data: Partial<Member>): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateMemberStatus(id: string, status: MemberStatus): Promise<void> {
  await updateMember(id, { status });
}

export async function updateMemberRole(id: string, role: MemberRole): Promise<void> {
  await updateMember(id, { role });
}

export async function searchMembers(query: string): Promise<Member[]> {
  // Firestore doesn't support full-text search, so we fetch active members and filter
  const members = await getActiveMembers();
  const q = query.toLowerCase();
  return members.filter(
    (m) =>
      m.displayName?.toLowerCase().includes(q) ||
      m.firstName?.toLowerCase().includes(q) ||
      m.lastName?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.committee?.toLowerCase().includes(q),
  );
}

export async function getMemberCount(): Promise<number> {
  const snap = await adminDb.collection(COLLECTION).where('status', '==', 'active').count().get();
  return snap.data().count;
}
