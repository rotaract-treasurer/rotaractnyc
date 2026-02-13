/**
 * Messaging operations (server-side).
 */
import { adminDb } from '@/lib/firebase/admin';
import type { MemberMessage } from '@/types';

const COLLECTION = 'messages';

export async function getMessages(memberId: string): Promise<MemberMessage[]> {
  // Get messages where user is sender or recipient
  const [sentSnap, receivedSnap] = await Promise.all([
    adminDb
      .collection(COLLECTION)
      .where('fromId', '==', memberId)
      .orderBy('sentAt', 'desc')
      .limit(50)
      .get(),
    adminDb
      .collection(COLLECTION)
      .where('toId', '==', memberId)
      .orderBy('sentAt', 'desc')
      .limit(50)
      .get(),
  ]);

  const messages = [
    ...sentSnap.docs.map((d) => ({ id: d.id, ...d.data() } as MemberMessage)),
    ...receivedSnap.docs.map((d) => ({ id: d.id, ...d.data() } as MemberMessage)),
  ];

  // Sort by date and deduplicate
  return messages.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

export async function getMessage(id: string): Promise<MemberMessage | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as MemberMessage;
}

export async function sendMessage(data: Omit<MemberMessage, 'id'>): Promise<string> {
  const ref = await adminDb.collection(COLLECTION).add({
    ...data,
    sentAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function deleteMessage(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete();
}

export async function getConversation(memberId1: string, memberId2: string): Promise<MemberMessage[]> {
  const messages = await getMessages(memberId1);
  return messages.filter(
    (m) =>
      (m.fromId === memberId1 && m.toId === memberId2) ||
      (m.fromId === memberId2 && m.toId === memberId1),
  );
}

export async function getUnreadCount(memberId: string): Promise<number> {
  // For now, return 0 — full read-tracking requires an additional field
  return 0;
}
