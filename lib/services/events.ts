/**
 * Event CRUD operations (server-side).
 */
import { adminDb } from '@/lib/firebase/admin';
import type { RotaractEvent, RSVP, RSVPStatus } from '@/types';

const EVENTS = 'events';
const RSVPS = 'rsvps';

// ── Events ──

export async function getEvent(id: string): Promise<RotaractEvent | null> {
  const doc = await adminDb.collection(EVENTS).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as RotaractEvent;
}

export async function getEventBySlug(slug: string): Promise<RotaractEvent | null> {
  const snap = await adminDb
    .collection(EVENTS)
    .where('slug', '==', slug)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as RotaractEvent;
}

export async function getPublicEvents(): Promise<RotaractEvent[]> {
  const snap = await adminDb
    .collection(EVENTS)
    .where('isPublic', '==', true)
    .where('status', '==', 'published')
    .orderBy('date', 'asc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RotaractEvent));
}

export async function getUpcomingEvents(limit = 10): Promise<RotaractEvent[]> {
  const snap = await adminDb
    .collection(EVENTS)
    .where('status', '==', 'published')
    .where('date', '>=', new Date().toISOString())
    .orderBy('date', 'asc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RotaractEvent));
}

export async function getAllEvents(): Promise<RotaractEvent[]> {
  const snap = await adminDb.collection(EVENTS).orderBy('date', 'desc').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RotaractEvent));
}

export async function createEvent(data: Omit<RotaractEvent, 'id'>): Promise<string> {
  const ref = await adminDb.collection(EVENTS).add({
    ...data,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateEvent(id: string, data: Partial<RotaractEvent>): Promise<void> {
  await adminDb.collection(EVENTS).doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await adminDb.collection(EVENTS).doc(id).delete();
}

// ── RSVPs ──

export async function getRSVPs(eventId: string): Promise<RSVP[]> {
  const snap = await adminDb
    .collection(RSVPS)
    .where('eventId', '==', eventId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RSVP));
}

export async function getMemberRSVP(eventId: string, memberId: string): Promise<RSVP | null> {
  const snap = await adminDb
    .collection(RSVPS)
    .where('eventId', '==', eventId)
    .where('memberId', '==', memberId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as RSVP;
}

export async function upsertRSVP(data: {
  eventId: string;
  memberId: string;
  memberName: string;
  memberPhoto?: string;
  status: RSVPStatus;
  tierId?: string;
  // Payment / ticket details (for paid member tickets via Stripe / offline)
  paymentStatus?: 'free' | 'paid' | 'pending' | 'pending_offline' | 'refunded' | 'failed' | 'expired';
  paidAmount?: number; // cents
  quantity?: number;
  stripeSessionId?: string;
  ticketType?: string;
}): Promise<string> {
  // Deterministic doc ID — matches the convention used by
  // /api/portal/events/rsvp and /api/portal/events/checkout. Using the same
  // doc ID prevents duplicate RSVP records when a member buys a ticket via
  // Stripe (handled by webhook) AFTER having previously RSVP'd via the portal,
  // and ensures the Going badge / "Ticket Purchased" state shows up correctly
  // throughout the app.
  const docId = `${data.memberId}_${data.eventId}`;
  const ref = adminDb.collection(RSVPS).doc(docId);
  const snap = await ref.get();
  const now = new Date().toISOString();

  // Build payload: never overwrite an existing createdAt.
  const payload: Record<string, unknown> = {
    memberId: data.memberId,
    eventId: data.eventId,
    memberName: data.memberName,
    status: data.status,
    updatedAt: now,
  };
  if (data.memberPhoto) payload.memberPhoto = data.memberPhoto;
  if (data.tierId) payload.tierId = data.tierId;
  if (data.paymentStatus) payload.paymentStatus = data.paymentStatus;
  if (data.paidAmount != null) payload.paidAmount = data.paidAmount;
  if (data.quantity != null) payload.quantity = data.quantity;
  if (data.stripeSessionId) payload.stripeSessionId = data.stripeSessionId;
  if (data.ticketType) payload.ticketType = data.ticketType;
  if (!snap.exists) payload.createdAt = now;

  await ref.set(payload, { merge: true });
  return docId;
}

export async function getAttendeeCount(eventId: string): Promise<number> {
  const snap = await adminDb
    .collection(RSVPS)
    .where('eventId', '==', eventId)
    .where('status', '==', 'going')
    .count()
    .get();
  return snap.data().count;
}
