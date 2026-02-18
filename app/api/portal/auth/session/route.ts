import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Emails that are auto-approved with full admin access on first sign-in
function getAdminAllowlist(): string[] {
  return (process.env.ADMIN_ALLOWLIST || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// POST: Create session cookie
export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days

    // Verify the token to get user info
    const decoded = await adminAuth.verifyIdToken(idToken);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set('rotaract_portal_session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    // Auto-approve admin-allowlisted emails
    let autoApproved = false;
    const email = decoded.email?.toLowerCase() || '';
    if (email && getAdminAllowlist().includes(email)) {
      try {
        const memberRef = adminDb.collection('members').doc(decoded.uid);
        const snap = await memberRef.get();
        if (snap.exists && snap.data()?.status === 'pending') {
          await memberRef.update({ status: 'active', role: 'president' });
          autoApproved = true;
          console.log(`Auto-approved allowlisted admin: ${email}`);
        }
      } catch (e) {
        console.warn('Auto-approve check failed (non-blocking):', e);
      }
    }

    // Auto-approve invited members (they were pre-added by board)
    if (!autoApproved && email) {
      try {
        const memberRef = adminDb.collection('members').doc(decoded.uid);
        const snap = await memberRef.get();
        if (snap.exists) {
          const data = snap.data();
          if (data?.status === 'pending' && data?.invitedAt) {
            // This member was invited — auto-activate so they can complete onboarding
            await memberRef.update({ status: 'active' });
            autoApproved = true;
            console.log(`Auto-approved invited member: ${email}`);
          }
        }
      } catch (e) {
        console.warn('Invited member auto-approve check failed (non-blocking):', e);
      }
    }

    return NextResponse.json({ success: true, autoApproved });
  } catch (error: any) {
    const message = error?.message || String(error);
    console.error('Session creation error:', message);
    // Surface whether it's a credentials issue vs an invalid token
    const isCredentials = message.includes('credentials') || message.includes('FIREBASE');
    return NextResponse.json(
      { error: isCredentials
          ? 'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID env vars.'
          : 'Failed to create session — token may be expired. Please sign in again.'
      },
      { status: 401 },
    );
  }
}

// DELETE: Clear session cookie
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('rotaract_portal_session');
  return NextResponse.json({ success: true });
}
