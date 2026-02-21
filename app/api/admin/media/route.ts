import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'site_media';

async function getBoardMember() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
  if (!sessionCookie) return null;
  try {
    const { uid } = await adminAuth.verifySessionCookie(sessionCookie, true);
    const doc = await adminDb.collection('members').doc(uid).get();
    const member = doc.data();
    if (!member || !['board', 'treasurer', 'president'].includes(member.role)) return null;
    return member;
  } catch {
    return null;
  }
}

/** GET — list slides for a section (public, no auth needed) */
export async function GET(req: NextRequest) {
  const section = new URL(req.url).searchParams.get('section') || 'hero';
  try {
    const snap = await adminDb
      .collection(COLLECTION)
      .where('section', '==', section)
      .orderBy('order', 'asc')
      .get();
    const slides = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(slides);
  } catch {
    return NextResponse.json([]);
  }
}

/** POST — add a new slide { section, url, storagePath, order? } */
export async function POST(req: NextRequest) {
  const board = await getBoardMember();
  if (!board) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { section = 'hero', url, storagePath = '', order = 0 } = body;

  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  const ref = await adminDb.collection(COLLECTION).add({
    section,
    url,
    storagePath,
    order,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ id: ref.id });
}

/** DELETE — remove a slide by id */
export async function DELETE(req: NextRequest) {
  const board = await getBoardMember();
  if (!board) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await adminDb.collection(COLLECTION).doc(id).delete();
  return NextResponse.json({ success: true });
}
