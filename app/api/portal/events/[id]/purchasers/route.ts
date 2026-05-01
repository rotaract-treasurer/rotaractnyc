import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { formatCurrency } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

async function getAuthenticatedManager(): Promise<{ uid: string; role: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
  if (!sessionCookie) return null;
  try {
    const { uid } = await adminAuth.verifySessionCookie(sessionCookie, true);
    const memberDoc = await adminDb.collection('members').doc(uid).get();
    if (!memberDoc.exists) return null;
    const data = memberDoc.data()!;
    if (!['board', 'president', 'treasurer'].includes(data.role)) return null;
    return { uid, role: data.role };
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedManager();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: eventId } = await params;

  // Fetch guest RSVPs
  const guestSnap = await adminDb
    .collection('guest_rsvps')
    .where('eventId', '==', eventId)
    .orderBy('createdAt', 'desc')
    .get();

  const guests = guestSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      kind: 'guest' as const,
      name: d.name || 'Guest',
      email: d.email || '',
      phone: d.phone || null,
      status: d.status || 'going',
      paymentStatus: d.paymentStatus || 'free',
      quantity: d.quantity || 1,
      amountCents: d.paidAmount || 0,
      tierId: d.tierId || null,
      createdAt: d.createdAt || '',
    };
  });

  // Fetch member RSVPs
  const rsvpSnap = await adminDb
    .collection('rsvps')
    .where('eventId', '==', eventId)
    .where('status', '==', 'going')
    .orderBy('createdAt', 'desc')
    .get();

  // Batch-fetch member emails from the members collection
  const memberIds = rsvpSnap.docs.map((d) => d.data().memberId).filter(Boolean);
  const memberEmailMap = new Map<string, string>();
  if (memberIds.length > 0) {
    // Firestore 'in' queries support up to 30 items per batch
    for (let i = 0; i < memberIds.length; i += 30) {
      const batch = memberIds.slice(i, i + 30);
      const snap = await adminDb
        .collection('members')
        .where('__name__', 'in', batch)
        .get();
      snap.docs.forEach((doc) => memberEmailMap.set(doc.id, doc.data().email || ''));
    }
  }

  const members = rsvpSnap.docs.map((doc) => {
    const d = doc.data();
    // Prefer the RSVP doc's own paymentStatus / paidAmount (populated by the
    // Stripe webhook & portal checkout). Fall back to legacy heuristics for
    // RSVPs that pre-date those fields.
    const inferredPaymentStatus =
      d.paymentStatus
        || (d.paidAmount && d.paidAmount > 0 ? 'paid' : 'free');
    return {
      id: doc.id,
      kind: 'member' as const,
      name: d.memberName || 'Member',
      email: memberEmailMap.get(d.memberId) || '',
      phone: null,
      status: d.status || 'going',
      paymentStatus: inferredPaymentStatus,
      quantity: d.quantity || 1,
      amountCents: typeof d.paidAmount === 'number' ? d.paidAmount : 0,
      tierId: d.tierId || null,
      createdAt: d.createdAt || '',
    };
  });

  // Revenue from transactions linked to this event (going forward)
  const txSnap = await adminDb
    .collection('transactions')
    .where('eventId', '==', eventId)
    .where('type', '==', 'income')
    .get();

  let totalRevenueCents = 0;
  txSnap.docs.forEach((doc) => {
    totalRevenueCents += doc.data().amount || 0;
  });

  // Fill in member amountCents from transactions where the RSVP doc didn't
  // already capture the paid amount (legacy purchases pre-dating the
  // paidAmount field on RSVPs).
  const memberTxMap = new Map<string, number>();
  txSnap.docs.forEach((doc) => {
    const d = doc.data();
    if (d.relatedMemberId) {
      memberTxMap.set(d.relatedMemberId, d.amount || 0);
    }
  });
  members.forEach((m) => {
    if (m.amountCents > 0) return; // already populated from RSVP.paidAmount
    const rsvpDoc = rsvpSnap.docs.find((doc) => doc.id === m.id);
    if (rsvpDoc) {
      const memberId = rsvpDoc.data().memberId;
      if (memberTxMap.has(memberId)) {
        m.amountCents = memberTxMap.get(memberId)!;
      }
    }
  });

  // If no transaction-based revenue, fall back to sum of guest paidAmounts
  const guestRevenueCents = guests.reduce((s, g) => s + g.amountCents, 0);
  if (totalRevenueCents === 0) totalRevenueCents = guestRevenueCents;

  const purchasers = [...guests, ...members].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return NextResponse.json({
    purchasers,
    summary: {
      totalRevenueCents,
      totalRevenue: totalRevenueCents,
      guestCount: guests.length,
      memberCount: members.length,
      totalTickets:
        guests.reduce((s, g) => s + g.quantity, 0) +
        members.reduce((s, m) => s + m.quantity, 0),
    },
  });
}
