/**
 * GET  /api/google/connect  — redirect to Google OAuth consent screen
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { isOAuth2Configured, getConsentUrl } from '@/lib/google/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Only admins can initiate OAuth flow
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const memberSnap = await adminDb.collection('members').doc(uid).get();
    const member = memberSnap.exists ? (memberSnap.data() as any) : null;
    if (!member || !['board', 'president'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isOAuth2Configured()) {
      return NextResponse.json(
        { error: 'OAuth2 is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' },
        { status: 400 },
      );
    }

    const url = getConsentUrl(uid);
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('[GET /api/google/connect]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
