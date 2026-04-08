import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, serializeDoc } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { slugify } from '@/lib/utils/slugify';
import { rateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['board', 'president', 'treasurer'];

// ─── GET /api/portal/forms/[id] — get form details (admin) ───
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

    const formSnap = await adminDb.collection('forms').doc(id).get();
    if (!formSnap.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json({ id: formSnap.id, ...serializeDoc(formSnap.data()!) });
  } catch (err: any) {
    console.error('GET /api/portal/forms/[id] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ─── PATCH /api/portal/forms/[id] — update form ───
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rl = await rateLimit(getRateLimitKey(req, 'form-update'), { max: 30, windowSec: 60 });
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

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

    const formSnap = await adminDb.collection('forms').doc(id).get();
    if (!formSnap.exists) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

    if (body.title !== undefined) {
      updates.title = body.title.trim();
      // Regenerate slug if title changed
      let newSlug = slugify(body.title);
      const existing = await adminDb
        .collection('forms')
        .where('slug', '==', newSlug)
        .limit(1)
        .get();
      if (!existing.empty && existing.docs[0].id !== id) {
        newSlug = `${newSlug}-${Date.now().toString(36)}`;
      }
      updates.slug = newSlug;
    }
    if (body.description !== undefined) updates.description = body.description.trim();
    if (body.fields !== undefined) updates.fields = body.fields;
    if (body.settings !== undefined) updates.settings = body.settings;
    if (body.status !== undefined) updates.status = body.status;
    if (body.linkedEventId !== undefined) updates.linkedEventId = body.linkedEventId || null;
    if (body.closesAt !== undefined) updates.closesAt = body.closesAt || null;

    await adminDb.collection('forms').doc(id).update(updates);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('PATCH /api/portal/forms/[id] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ─── DELETE /api/portal/forms/[id] — delete form + all responses ───
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Delete all responses for this form (chunked to respect 500-op batch limit)
    const responsesSnap = await adminDb
      .collection('formResponses')
      .where('formId', '==', id)
      .get();

    const BATCH_LIMIT = 499; // reserve 1 slot for the form doc itself in the last batch
    const docs = responsesSnap.docs;

    // Delete responses in chunks
    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
      const chunk = docs.slice(i, i + BATCH_LIMIT);
      const isLastChunk = i + BATCH_LIMIT >= docs.length;
      const batch = adminDb.batch();
      chunk.forEach((doc) => batch.delete(doc.ref));
      if (isLastChunk) {
        batch.delete(adminDb.collection('forms').doc(id));
      }
      await batch.commit();
    }

    // If no responses existed, still delete the form
    if (docs.length === 0) {
      await adminDb.collection('forms').doc(id).delete();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/portal/forms/[id] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
