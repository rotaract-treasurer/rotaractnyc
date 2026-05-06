import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { rateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/rateLimit';

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
  const rateLimitResult = await rateLimit(getRateLimitKey(request, 'portal-auth'), { max: 10, windowSec: 60 });
  if (!rateLimitResult.allowed) return rateLimitResponse(rateLimitResult.resetAt);

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
          console.info(`Auto-approved allowlisted admin: ${email}`);
        }
      } catch (e) {
        console.warn('Auto-approve check failed (non-blocking):', e);
      }
    }

    // Auto-approve invited members (they were pre-added by board)
    let migratedFromInvite = false;
    if (!autoApproved && email) {
      try {
        const memberRef = adminDb.collection('members').doc(decoded.uid);
        const snap = await memberRef.get();

        // Always look up any other docs that share this email — the board
        // pre-creates invited members under an auto-generated id (since
        // the user's uid doesn't exist yet), so we may need to merge or
        // migrate them. Firestore rules block the client from reading
        // those docs, so this must happen server-side via the Admin SDK.
        const inviteQuery = await adminDb
          .collection('members')
          .where('email', '==', email)
          .limit(5)
          .get();
        const invitedDoc = inviteQuery.docs.find(
          (d) => d.id !== decoded.uid && d.data()?.invitedAt,
        );

        if (!snap.exists && invitedDoc) {
          // No uid-keyed doc yet — migrate the invited doc to the uid key.
          const inviteData = invitedDoc.data() || {};
          const migratedMember: Record<string, any> = {
            ...inviteData,
            displayName: decoded.name || inviteData.displayName || '',
            photoURL: decoded.picture || inviteData.photoURL || '',
            status: 'active',
            updatedAt: new Date().toISOString(),
          };
          if (inviteData.onboardingComplete === undefined) {
            migratedMember.onboardingComplete = false;
          }
          await memberRef.set(migratedMember);
          await invitedDoc.ref.delete();
          autoApproved = true;
          migratedFromInvite = true;
          console.info(`Auto-migrated invited member: ${email}`);
        } else if (snap.exists && invitedDoc) {
          // Self-created pending doc already exists alongside an invited
          // doc (e.g. user signed in before a previous version of this
          // route handled the migration). Merge the invite's role / title
          // / committee onto the uid-keyed doc, activate it, and drop the
          // orphan.
          const existing = snap.data() || {};
          const inviteData = invitedDoc.data() || {};
          const merged: Record<string, any> = {
            ...inviteData,
            ...existing,
            role: inviteData.role || existing.role || 'member',
            boardTitle: inviteData.boardTitle || existing.boardTitle,
            committee: inviteData.committee || existing.committee,
            memberType: inviteData.memberType || existing.memberType,
            invitedAt: inviteData.invitedAt || existing.invitedAt,
            status: 'active',
            updatedAt: new Date().toISOString(),
          };
          // Strip undefineds (Firestore rejects them)
          Object.keys(merged).forEach((k) => merged[k] === undefined && delete merged[k]);
          await memberRef.set(merged, { merge: true });
          await invitedDoc.ref.delete();
          autoApproved = true;
          migratedFromInvite = true;
          console.info(`Auto-merged invited member onto existing uid doc: ${email}`);
        } else if (snap.exists) {
          // No invited doc — just flip pending → active if this user was
          // previously invited under their own uid.
          const data = snap.data();
          if (data?.status === 'pending' && data?.invitedAt) {
            await memberRef.update({ status: 'active' });
            autoApproved = true;
            console.info(`Auto-approved invited member: ${email}`);
          }
        }
      } catch (e) {
        console.warn('Invited member auto-approve check failed (non-blocking):', e);
      }
    }

    return NextResponse.json({ success: true, autoApproved, migratedFromInvite });
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
