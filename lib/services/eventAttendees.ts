/**
 * Shared service for computing the attendee/purchaser roster for an event.
 *
 * Used by:
 *   - GET /api/portal/events/[id]/purchasers
 *   - lib/services/weeklyEventDigest (cron)
 *
 * Intentionally avoids `orderBy` clauses on Firestore queries to dodge the
 * composite-index requirement; results are sorted in memory.
 */
import { adminDb } from '@/lib/firebase/admin';

export interface AttendeeRow {
  id: string;
  kind: 'member' | 'guest';
  name: string;
  email: string;
  phone: string | null;
  status: string;
  paymentStatus: string;
  quantity: number;
  amountCents: number;
  tierId: string | null;
  createdAt: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  invitedBy?: string | null;
  notes?: string | null;
  memberId?: string | null;
}

export interface AttendeeTotals {
  members: number;
  guests: number;
  tickets: number;
  revenueCents: number;
  checkedIn: number;
  /** Combined attendee row count (members + guests) — convenience field. */
  totalAttendees: number;
}

export interface EventAttendees {
  rows: AttendeeRow[];
  totals: AttendeeTotals;
}

export async function getEventAttendees(eventId: string): Promise<EventAttendees> {
  // Guests
  const guestSnap = await adminDb
    .collection('guest_rsvps')
    .where('eventId', '==', eventId)
    .get();

  const guests: AttendeeRow[] = guestSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      kind: 'guest',
      name: d.name || 'Guest',
      email: d.email || '',
      phone: d.phone || null,
      status: d.status || 'going',
      paymentStatus: d.paymentStatus || 'free',
      quantity: d.quantity || 1,
      amountCents: d.paidAmount || 0,
      tierId: d.tierId || null,
      createdAt: d.createdAt || '',
      checkedIn: !!d.checkedIn,
      checkedInAt: d.checkedInAt || null,
      invitedBy: d.invitedByName || d.invitedBy || null,
      notes: d.notes || null,
    };
  });

  // Member RSVPs (going only)
  const rsvpSnap = await adminDb
    .collection('rsvps')
    .where('eventId', '==', eventId)
    .where('status', '==', 'going')
    .get();

  // Batch-fetch member emails (Firestore 'in' supports up to 30 ids)
  const memberIds = rsvpSnap.docs
    .map((d) => d.data().memberId)
    .filter((x): x is string => Boolean(x));
  const memberEmailMap = new Map<string, string>();
  for (let i = 0; i < memberIds.length; i += 30) {
    const batch = memberIds.slice(i, i + 30);
    if (batch.length === 0) continue;
    const snap = await adminDb
      .collection('members')
      .where('__name__', 'in', batch)
      .get();
    snap.docs.forEach((doc) =>
      memberEmailMap.set(doc.id, doc.data().email || ''),
    );
  }

  const members: AttendeeRow[] = rsvpSnap.docs.map((doc) => {
    const d = doc.data();
    const inferredPaymentStatus =
      d.paymentStatus || (d.paidAmount && d.paidAmount > 0 ? 'paid' : 'free');
    return {
      id: doc.id,
      kind: 'member',
      name: d.memberName || 'Member',
      email: memberEmailMap.get(d.memberId) || '',
      phone: null,
      status: d.status || 'going',
      paymentStatus: inferredPaymentStatus,
      quantity: d.quantity || 1,
      amountCents: typeof d.paidAmount === 'number' ? d.paidAmount : 0,
      tierId: d.tierId || null,
      createdAt: d.createdAt || '',
      checkedIn: !!d.checkedIn,
      checkedInAt: d.checkedInAt || null,
      memberId: d.memberId || null,
    };
  });

  // Revenue from linked income transactions (canonical) + fallback to legacy guest paidAmount
  const txSnap = await adminDb
    .collection('transactions')
    .where('eventId', '==', eventId)
    .where('type', '==', 'income')
    .get();

  let totalRevenueCents = 0;
  const memberTxMap = new Map<string, number>();
  txSnap.docs.forEach((doc) => {
    const d = doc.data();
    totalRevenueCents += d.amount || 0;
    if (d.relatedMemberId) memberTxMap.set(d.relatedMemberId, d.amount || 0);
  });

  // Backfill member amountCents from transactions where the RSVP didn't capture it
  members.forEach((m) => {
    if (m.amountCents > 0) return;
    const rsvpDoc = rsvpSnap.docs.find((doc) => doc.id === m.id);
    if (!rsvpDoc) return;
    const memberId = rsvpDoc.data().memberId;
    if (memberTxMap.has(memberId)) m.amountCents = memberTxMap.get(memberId)!;
  });

  if (totalRevenueCents === 0) {
    totalRevenueCents = guests.reduce((s, g) => s + g.amountCents, 0);
  }

  const rows = [...guests, ...members].sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
  );

  const totals: AttendeeTotals = {
    members: members.length,
    guests: guests.length,
    tickets:
      guests.reduce((s, g) => s + g.quantity, 0) +
      members.reduce((s, m) => s + m.quantity, 0),
    revenueCents: totalRevenueCents,
    checkedIn:
      guests.filter((g) => g.checkedIn).length +
      members.filter((m) => m.checkedIn).length,
    totalAttendees: rows.length,
  };

  return { rows, totals };
}
