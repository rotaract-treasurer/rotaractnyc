import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { DEFAULT_COMMITTEES, DEFAULT_OCCUPATIONS } from '@/lib/profileOptions';

export const dynamic = 'force-dynamic';

// GET — return profile dropdown options (public for authenticated users)
export async function GET() {
  try {
    const doc = await adminDb.collection('settings').doc('site').get();
    const data = doc.data();
    return NextResponse.json({
      committees: data?.profileOptions?.committees || DEFAULT_COMMITTEES,
      occupations: data?.profileOptions?.occupations || DEFAULT_OCCUPATIONS,
    });
  } catch (error) {
    console.error('Error fetching profile options:', error);
    return NextResponse.json({
      committees: DEFAULT_COMMITTEES,
      occupations: DEFAULT_OCCUPATIONS,
    });
  }
}

// PUT — board+ only, update profile dropdown options
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uid } = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Check role
    const memberDoc = await adminDb.collection('members').doc(uid).get();
    const member = memberDoc.data();
    if (!member || !['board', 'president', 'treasurer'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { committees, occupations } = body;

    await adminDb.collection('settings').doc('site').set(
      {
        profileOptions: {
          committees: Array.isArray(committees) ? committees : DEFAULT_COMMITTEES,
          occupations: Array.isArray(occupations) ? occupations : DEFAULT_OCCUPATIONS,
        },
        updatedAt: new Date().toISOString(),
        updatedBy: uid,
      },
      { merge: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile options:', error);
    return NextResponse.json({ error: 'Failed to update profile options' }, { status: 500 });
  }
}
