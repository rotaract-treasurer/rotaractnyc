import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, serializeDoc } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['board', 'president', 'treasurer'];

// ─── GET /api/portal/forms/[id]/responses — list responses (admin) ───
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const memberSnap = await adminDb.collection('members').doc(decoded.uid).get();
    const member = memberSnap.data();
    if (!member || !ADMIN_ROLES.includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check form exists
    const formSnap = await adminDb.collection('forms').doc(id).get();
    if (!formSnap.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const responsesSnap = await adminDb
      .collection('formResponses')
      .where('formId', '==', id)
      .orderBy('submittedAt', 'desc')
      .get();

    const responses = responsesSnap.docs.map((doc) => ({
      id: doc.id,
      ...serializeDoc(doc.data()),
    }));

    return NextResponse.json({ responses, form: { id: formSnap.id, ...serializeDoc(formSnap.data()!) } });
  } catch (err: any) {
    console.error('GET /api/portal/forms/[id]/responses error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ─── DELETE /api/portal/forms/[id]/responses — delete a single response ───
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: formId } = await params;
    const { searchParams } = new URL(req.url);
    const responseId = searchParams.get('responseId');

    if (!responseId) {
      return NextResponse.json({ error: 'responseId is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const memberSnap = await adminDb.collection('members').doc(decoded.uid).get();
    const member = memberSnap.data();
    if (!member || !ADMIN_ROLES.includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await adminDb.collection('formResponses').doc(responseId).delete();

    // Atomically decrement response count
    await adminDb.collection('forms').doc(formId).update({
      responseCount: FieldValue.increment(-1),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/portal/forms/[id]/responses error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
