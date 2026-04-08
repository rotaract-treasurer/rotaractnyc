import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, serializeDoc } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { slugify } from '@/lib/utils/slugify';
import { rateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['board', 'president', 'treasurer'];

// ─── GET /api/portal/forms — list all forms (admin) ───
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const memberSnap = await adminDb.collection('members').doc(decoded.uid).get();
    const member = memberSnap.data();
    if (!member || !ADMIN_ROLES.includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formsSnap = await adminDb
      .collection('forms')
      .orderBy('createdAt', 'desc')
      .get();

    const forms = formsSnap.docs.map((doc) => ({
      id: doc.id,
      ...serializeDoc(doc.data()),
    }));

    return NextResponse.json(forms);
  } catch (err: any) {
    console.error('GET /api/portal/forms error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ─── POST /api/portal/forms — create a new form ───
export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(getRateLimitKey(req, 'form-create'), { max: 20, windowSec: 60 });
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const memberSnap = await adminDb.collection('members').doc(decoded.uid).get();
    const member = memberSnap.data();
    if (!member || !ADMIN_ROLES.includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, fields, settings, linkedEventId, closesAt, status } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate unique slug
    let slug = slugify(title);
    const existingSlug = await adminDb
      .collection('forms')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    if (!existingSlug.empty) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const now = new Date().toISOString();
    const formData = {
      title: title.trim(),
      description: description?.trim() || '',
      slug,
      fields: fields || [],
      settings: {
        allowAnonymous: settings?.allowAnonymous ?? true,
        requireLogin: settings?.requireLogin ?? false,
        limitOneResponse: settings?.limitOneResponse ?? false,
        showProgressBar: settings?.showProgressBar ?? true,
        confirmationMessage: settings?.confirmationMessage || 'Thank you for your response!',
        redirectUrl: settings?.redirectUrl || null,
      },
      status: status || 'draft',
      linkedEventId: linkedEventId || null,
      createdBy: decoded.uid,
      createdByName: member.displayName || member.email,
      responseCount: 0,
      createdAt: now,
      updatedAt: now,
      closesAt: closesAt || null,
    };

    const ref = await adminDb.collection('forms').add(formData);

    return NextResponse.json({ id: ref.id, ...formData }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/portal/forms error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
