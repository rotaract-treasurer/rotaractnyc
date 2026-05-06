import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal/donors
 *
 * Returns the global donors CRM list, aggregated per email by the Stripe
 * webhook (`upsertDonorRecord`). Restricted to board, president, treasurer.
 */

interface DonorRow {
  id: string;
  name: string;
  email: string;
  totalDonatedCents: number;
  totalDonationCount: number;
  lastDonationDate: string;
  lastDonationAmountCents: number;
  createdAt: string;
}

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

export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedManager();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const snap = await adminDb
      .collection('donors')
      .orderBy('totalDonatedCents', 'desc')
      .get();

    const donors: DonorRow[] = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || 'Donor',
        email: d.email || doc.id,
        totalDonatedCents: typeof d.totalDonatedCents === 'number' ? d.totalDonatedCents : 0,
        totalDonationCount: typeof d.totalDonationCount === 'number' ? d.totalDonationCount : 0,
        lastDonationDate: d.lastDonationDate || '',
        lastDonationAmountCents:
          typeof d.lastDonationAmountCents === 'number' ? d.lastDonationAmountCents : 0,
        createdAt: d.createdAt || '',
      };
    });

    const totalRaisedCents = donors.reduce((sum, d) => sum + d.totalDonatedCents, 0);
    const totalDonationCount = donors.reduce((sum, d) => sum + d.totalDonationCount, 0);

    return NextResponse.json({
      donors,
      summary: {
        donorCount: donors.length,
        totalRaisedCents,
        totalDonationCount,
      },
    });
  } catch (err: any) {
    console.error('[donors] list failed', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to load donors' },
      { status: 500 },
    );
  }
}
