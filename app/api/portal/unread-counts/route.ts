import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal/unread-counts
 *
 * Lightweight aggregate that powers the unread badges on the portal's
 * mobile bottom-nav and sidebar. Counts:
 *  - unread direct messages (toId == uid && read == false)
 *  - announcements created since the user's last visit (lastSeenAnnouncementsAt
 *    on the member doc; falls back to 0 if never set)
 *
 * Designed to be called frequently (every ~30 s on the dashboard); kept fast
 * by capping reads at 50 per collection.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ messages: 0, announcements: 0 });
    }

    const { uid } = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Unread messages — capped count
    const messagesSnap = await adminDb
      .collection('messages')
      .where('toId', '==', uid)
      .where('read', '==', false)
      .limit(50)
      .get();

    // Last-seen-announcements timestamp (ISO string) on member doc
    const memberDoc = await adminDb.collection('members').doc(uid).get();
    const lastSeen = memberDoc.data()?.lastSeenAnnouncementsAt as string | undefined;

    let announcementCount = 0;
    if (lastSeen) {
      const annSnap = await adminDb
        .collection('announcements')
        .where('createdAt', '>', new Date(lastSeen))
        .limit(50)
        .get();
      announcementCount = annSnap.size;
    } else {
      // First-time visitor — show the most recent (capped) so they notice the badge once
      const annSnap = await adminDb
        .collection('announcements')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      announcementCount = annSnap.size;
    }

    return NextResponse.json({
      messages: messagesSnap.size,
      announcements: announcementCount,
    });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json({ messages: 0, announcements: 0 });
  }
}

/**
 * POST /api/portal/unread-counts/seen
 * Marks a category as seen. Body: { kind: 'announcements' }
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { uid } = await adminAuth.verifySessionCookie(sessionCookie, true);
    const { kind } = await request.json();
    if (kind === 'announcements') {
      await adminDb
        .collection('members')
        .doc(uid)
        .set({ lastSeenAnnouncementsAt: new Date().toISOString() }, { merge: true });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking as seen:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
