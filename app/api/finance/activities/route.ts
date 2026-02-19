import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// GET — List all activities (treasurer/president only)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uid } = await adminAuth.verifySessionCookie(sessionCookie, true);
    const memberDoc = await adminDb.collection('members').doc(uid).get();
    const member = memberDoc.data();

    if (!member || !['treasurer', 'president'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = adminDb.collection('activities').orderBy('date', 'desc');
    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();
    const activities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// POST — Create new activity (treasurer/president only)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rotaract_portal_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uid } = await adminAuth.verifySessionCookie(sessionCookie, true);
    const memberDoc = await adminDb.collection('members').doc(uid).get();
    const member = memberDoc.data();

    if (!member || !['treasurer', 'president'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      type,
      customType,
      date,
      location,
      address,
      description,
      linkedEventId,
      budget,
      allowedExpenseSubmitters,
    } = body;

    if (!name || !type || !date || !budget) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const activityData = {
      name,
      type,
      customType: type === 'other' ? customType : null,
      date,
      location: location || null,
      address: address || null,
      description: description || null,
      linkedEventId: linkedEventId || null,
      status: 'draft',
      budget: {
        totalEstimate: budget.totalEstimate || 0,
        lineItems: budget.lineItems || [],
      },
      approvals: {
        treasurerSubmitted: false,
        presidentApproved: false,
      },
      allowedExpenseSubmitters: allowedExpenseSubmitters || [],
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('activities').add(activityData);

    return NextResponse.json({ id: docRef.id, success: true });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
