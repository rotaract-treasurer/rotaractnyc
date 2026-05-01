import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, serializeDoc } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { escapeHtml } from '@/lib/utils/sanitize';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['admin', 'president'];
const BOARD_ROLES = ['admin', 'president', 'board', 'treasurer', 'secretary', 'vice-president'];

async function getVerifiedUser(sessionCookie: string) {
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  const memberDoc = await adminDb.collection('members').doc(decoded.uid).get();
  const memberData = memberDoc.data();
  return {
    uid: decoded.uid,
    displayName: decoded.name || memberData?.displayName || '',
    role: memberData?.role as string | undefined,
  };
}

// GET — public read, latest 20 announcements
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('announcements')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const announcements = snapshot.docs.map((doc) =>
      serializeDoc({ id: doc.id, ...doc.data() })
    );

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

// POST — admin/board only
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getVerifiedUser(sessionCookie);
    if (!user.role || !BOARD_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: msgBody, pinned = false, audience = 'all' } = body;

    if (!title || !msgBody) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const validAudiences = ['all', 'board', 'members'];
    if (!validAudiences.includes(audience)) {
      return NextResponse.json({ error: 'Invalid audience' }, { status: 400 });
    }

    const doc = {
      title: escapeHtml(String(title).trim()),
      body: escapeHtml(String(msgBody).trim()),
      pinned: Boolean(pinned),
      audience: audience as 'all' | 'board' | 'members',
      createdBy: user.uid,
      createdByName: user.displayName,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('announcements').add(doc);

    const { createdAt, ...responseSafe } = doc;
    return NextResponse.json(
      { id: docRef.id, ...responseSafe, createdAt: new Date().toISOString() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}

// DELETE — admin only, ?id=DOC_ID
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getVerifiedUser(sessionCookie);
    if (!user.role || !ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id param' }, { status: 400 });
    }

    await adminDb.collection('announcements').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
