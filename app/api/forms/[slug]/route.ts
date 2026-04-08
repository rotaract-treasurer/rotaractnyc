import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, serializeDoc } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// ─── GET /api/forms/[slug] — public: fetch form for rendering ───
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const formsSnap = await adminDb
      .collection('forms')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (formsSnap.empty) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const doc = formsSnap.docs[0];
    const form: Record<string, any> = { id: doc.id, ...serializeDoc(doc.data()) };

    // Only return active forms publicly
    if (form.status !== 'active') {
      return NextResponse.json({ error: 'This form is no longer accepting responses' }, { status: 410 });
    }

    // Check if auto-close date has passed
    if (form.closesAt && new Date(form.closesAt) < new Date()) {
      return NextResponse.json({ error: 'This form has closed' }, { status: 410 });
    }

    // Strip admin-only fields
    const { createdBy, createdByName, ...publicForm } = form;

    return NextResponse.json(publicForm);
  } catch (err: any) {
    console.error('GET /api/forms/[slug] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ─── POST /api/forms/[slug] — public: submit a response ───
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const rl = await rateLimit(getRateLimitKey(req, 'form-submit'), { max: 10, windowSec: 60 });
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const { slug } = await params;

    const formsSnap = await adminDb
      .collection('forms')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (formsSnap.empty) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const doc = formsSnap.docs[0];
    const form = doc.data();

    if (form.status !== 'active') {
      return NextResponse.json({ error: 'This form is no longer accepting responses' }, { status: 410 });
    }

    if (form.closesAt && new Date(form.closesAt) < new Date()) {
      return NextResponse.json({ error: 'This form has closed' }, { status: 410 });
    }

    // ── Enforce login if required ──
    let authenticatedUid: string | null = null;
    let authenticatedEmail: string | null = null;
    let authenticatedName: string | null = null;

    if (form.settings?.requireLogin) {
      const cookieStore = await cookies();
      const session = cookieStore.get('session')?.value;
      if (!session) {
        return NextResponse.json(
          { error: 'You must be logged in to submit this form' },
          { status: 401 },
        );
      }
      try {
        const decoded = await adminAuth.verifySessionCookie(session, true);
        authenticatedUid = decoded.uid;
        // Fetch member profile for name/email
        const memberSnap = await adminDb.collection('members').doc(decoded.uid).get();
        if (memberSnap.exists) {
          const m = memberSnap.data()!;
          authenticatedEmail = m.email || decoded.email || null;
          authenticatedName = m.displayName || decoded.name || null;
        } else {
          authenticatedEmail = decoded.email || null;
          authenticatedName = decoded.name || null;
        }
      } catch {
        return NextResponse.json(
          { error: 'Your session has expired. Please log in again.' },
          { status: 401 },
        );
      }
    }

    const body = await req.json();
    const { answers, respondentEmail, respondentName } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
    }

    // Validate required fields
    const fields = form.fields || [];
    for (const field of fields) {
      if (field.required) {
        const answer = answers[field.id];
        if (answer === undefined || answer === null || answer === '' ||
            (Array.isArray(answer) && answer.length === 0)) {
          return NextResponse.json(
            { error: `"${field.label}" is required` },
            { status: 400 },
          );
        }
      }
    }

    // Resolve respondent identity (prefer authenticated user if available)
    const finalEmail = authenticatedEmail || respondentEmail?.toLowerCase().trim() || null;
    const finalName = authenticatedName || respondentName?.trim() || null;
    const finalUid = authenticatedUid || null;

    // Check one-response-per-person limit (by uid first, then email)
    if (form.settings?.limitOneResponse) {
      let existing;
      if (finalUid) {
        existing = await adminDb
          .collection('formResponses')
          .where('formId', '==', doc.id)
          .where('respondentId', '==', finalUid)
          .limit(1)
          .get();
      } else if (finalEmail) {
        existing = await adminDb
          .collection('formResponses')
          .where('formId', '==', doc.id)
          .where('respondentEmail', '==', finalEmail)
          .limit(1)
          .get();
      }

      if (existing && !existing.empty) {
        return NextResponse.json(
          { error: 'You have already submitted a response to this form' },
          { status: 409 },
        );
      }
    }

    const now = new Date().toISOString();
    const responseData = {
      formId: doc.id,
      respondentEmail: finalEmail,
      respondentName: finalName,
      respondentId: finalUid,
      answers,
      submittedAt: now,
    };

    await adminDb.collection('formResponses').add(responseData);

    // Atomically increment response count
    await adminDb.collection('forms').doc(doc.id).update({
      responseCount: FieldValue.increment(1),
    });

    return NextResponse.json({
      success: true,
      confirmationMessage: form.settings?.confirmationMessage || 'Thank you for your response!',
      redirectUrl: form.settings?.redirectUrl || null,
    });
  } catch (err: any) {
    console.error('POST /api/forms/[slug] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
