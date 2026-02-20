import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, serializeDoc } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// ─── helpers ───
async function verifySession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;
  if (!sessionCookie) throw new Error('Unauthorized');
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  return decoded;
}

async function getMemberData(uid: string) {
  const snap = await adminDb.collection('members').doc(uid).get();
  return snap.exists ? snap.data() : null;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── GET /api/portal/committees — list all committees ───
export async function GET() {
  try {
    await verifySession();

    const snapshot = await adminDb
      .collection('committees')
      .orderBy('name', 'asc')
      .get();

    const committees = snapshot.docs.map((d) =>
      serializeDoc({ id: d.id, ...d.data() }),
    );

    return NextResponse.json(committees);
  } catch (error) {
    console.error('Error fetching committees:', error);
    return NextResponse.json({ error: 'Failed to fetch committees' }, { status: 500 });
  }
}

// ─── POST /api/portal/committees — create a committee (board only) ───
export async function POST(request: NextRequest) {
  try {
    const decoded = await verifySession();
    const member = await getMemberData(decoded.uid);

    if (!member || !['president', 'board', 'treasurer'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, capacity = 5, driveURL, meetingCadence } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Committee name is required' }, { status: 400 });
    }

    const slug = slugify(name.trim());

    // Check for duplicate slug
    const existing = await adminDb
      .collection('committees')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: 'A committee with this name already exists' },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const committeeData = {
      slug,
      name: name.trim(),
      description: description?.trim() || '',
      capacity: typeof capacity === 'number' ? capacity : 5,
      memberIds: [],
      waitlistIds: [],
      termHistory: [],
      driveURL: driveURL?.trim() || '',
      meetingCadence: meetingCadence?.trim() || '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('committees').add(committeeData);

    return NextResponse.json(
      { id: docRef.id, ...committeeData, createdAt: now, updatedAt: now },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating committee:', error);
    return NextResponse.json({ error: 'Failed to create committee' }, { status: 500 });
  }
}
