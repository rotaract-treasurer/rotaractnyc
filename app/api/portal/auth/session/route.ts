import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { PORTAL_SESSION_COOKIE, PORTAL_SESSION_MAX_AGE_SECONDS } from '@/lib/portal/session';
import { isEmailAllowed } from '@/lib/firebase/allowlist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const app = getFirebaseAdminApp();
    if (!app) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const auth = getAuth(app);
    
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Bootstrap allowlisted admins into the portal role model.
    // Firestore security rules for the portal depend on request.auth.token.role.
    // Setting custom claims is async from the client's perspective; the client must refresh its ID token.
    const email = decodedToken.email || null;
    const shouldBootstrapAdmin = isEmailAllowed(email);
    const currentRole = (decodedToken.role as string | undefined) ?? null;
    let needsTokenRefresh = false;

    if (shouldBootstrapAdmin && currentRole !== 'ADMIN') {
      await auth.setCustomUserClaims(decodedToken.uid, { role: 'ADMIN' });
      needsTokenRefresh = true;

      const db = getFirestore(app);
      await db
        .collection('users')
        .doc(decodedToken.uid)
        .set(
          {
            email,
            name: decodedToken.name || email || 'Admin',
            photoURL: decodedToken.picture || null,
            role: 'ADMIN',
            status: 'active',
            updatedAt: new Date(),
            createdAt: new Date(),
            seeded: false,
          },
          { merge: true }
        );
    }
    
    // Create session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: PORTAL_SESSION_MAX_AGE_SECONDS * 1000,
    });

    // Set cookie
    cookies().set(PORTAL_SESSION_COOKIE, sessionCookie, {
      maxAge: PORTAL_SESSION_MAX_AGE_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({
      success: true,
      uid: decodedToken.uid,
      needsTokenRefresh,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    cookies().delete(PORTAL_SESSION_COOKIE);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
