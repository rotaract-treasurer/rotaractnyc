import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// GET — List expenses
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
    const activityId = searchParams.get('activityId');
    const status = searchParams.get('status');

    let query = adminDb.collection('expenses').orderBy('date', 'desc');
    
    if (activityId) {
      query = query.where('activityId', '==', activityId) as any;
    }
    
    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();
    const expenses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

// POST — Create expense
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

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { activityId, description, amount, category, customCategory, date, receiptURL, notes } = body;

    if (!activityId || !description || !amount || !category || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check permissions: must be treasurer/president OR allowed submitter for this activity
    const activityDoc = await adminDb.collection('activities').doc(activityId).get();
    if (!activityDoc.exists) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    const activity = activityDoc.data()!;
    const isAuthorized =
      ['treasurer', 'president'].includes(member.role) ||
      activity.allowedExpenseSubmitters?.includes(uid);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized to submit expenses for this activity' }, { status: 403 });
    }

    const expenseData = {
      activityId,
      activityName: activity.name,
      description,
      amount: Math.round(amount),
      category,
      customCategory: category === 'other' ? customCategory : null,
      date,
      receiptURL: receiptURL || null,
      submittedBy: uid,
      submittedByName: member.displayName || member.email,
      submittedAt: FieldValue.serverTimestamp(),
      status: ['treasurer', 'president'].includes(member.role) ? 'approved' : 'pending',
      notes: notes || null,
    };

    const docRef = await adminDb.collection('expenses').add(expenseData);

    // Update activity actual totals if auto-approved
    if (expenseData.status === 'approved') {
      const expensesSnapshot = await adminDb
        .collection('expenses')
        .where('activityId', '==', activityId)
        .where('status', '==', 'approved')
        .get();
      
      const totalSpent = expensesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      
      await adminDb.collection('activities').doc(activityId).update({
        'actual.totalSpent': totalSpent,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ id: docRef.id, success: true });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
