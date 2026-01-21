import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    // Get the ID token from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const app = getFirebaseAdminApp();
    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Parse request body
    const body = await req.json();
    const { eventId, eventName, hours, date, notes } = body;

    // Validate required fields
    if (!eventId || !eventName || !hours || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate hours
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      return NextResponse.json(
        { error: 'Invalid hours value' },
        { status: 400 }
      );
    }

    // Create the submission
    const db = getFirestore(app);
    const now = Timestamp.now();
    const eventDate = Timestamp.fromDate(new Date(date));

    const submissionData = {
      uid,
      eventId,
      eventName,
      hours: hoursNum,
      date: eventDate,
      notes: notes || '',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection('serviceHours').add(submissionData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Service hours submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting service hours:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit service hours' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get the ID token from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const app = getFirebaseAdminApp();
    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit') || '10';
    const limit = parseInt(limitParam, 10);

    // Get user's service hours submissions
    const db = getFirestore(app);
    const snapshot = await db
      .collection('serviceHours')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const submissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Timestamps to ISO strings for JSON serialization
      date: doc.data().date?.toDate().toISOString(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
      reviewedAt: doc.data().reviewedAt?.toDate().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error('Error fetching service hours:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch service hours' },
      { status: 500 }
    );
  }
}
