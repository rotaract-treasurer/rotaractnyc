import { getFirebaseAdminDb } from './admin';
import { Invitation, InvitationStatus } from '@/types/onboarding';
import { Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';

const INVITATIONS_COLLECTION = 'invitations';
const TOKEN_EXPIRY_DAYS = 7; // Invitations expire after 7 days

/**
 * Generate a secure random token
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new invitation
 */
export async function createInvitation(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  createdBy: string;
  memberId?: string;
}): Promise<{ invitation: Invitation; token: string }> {
  const db = getFirebaseAdminDb();
  const inviteRef = db.collection(INVITATIONS_COLLECTION).doc();
  
  const token = generateInviteToken();
  const tokenHash = hashToken(token);
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(
    now.toMillis() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  const invitation: Invitation = {
    id: inviteRef.id,
    email: data.email.toLowerCase(),
    firstName: data.firstName,
    lastName: data.lastName,
    tokenHash,
    status: 'SENT',
    memberId: data.memberId,
    createdAt: now,
    expiresAt,
    createdBy: data.createdBy,
  };

  await inviteRef.set(invitation);
  
  return { invitation, token };
}

/**
 * Validate an invitation token
 */
export async function validateInvitationToken(token: string): Promise<{
  valid: boolean;
  invitation?: Invitation;
  error?: string;
}> {
  const db = getFirebaseAdminDb();
  const tokenHash = hashToken(token);
  
  const snapshot = await db
    .collection(INVITATIONS_COLLECTION)
    .where('tokenHash', '==', tokenHash)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { valid: false, error: 'Invalid invitation token' };
  }

  const invitation = snapshot.docs[0].data() as Invitation;

  // Check if already used
  if (invitation.status === 'USED') {
    return { valid: false, error: 'This invitation has already been used' };
  }

  // Check if expired
  if (invitation.status === 'EXPIRED') {
    return { valid: false, error: 'This invitation has expired' };
  }

  // Check expiry date
  const now = Timestamp.now();
  const expiresAt = invitation.expiresAt as Timestamp;
  if (expiresAt.toMillis() < now.toMillis()) {
    // Mark as expired
    await db.collection(INVITATIONS_COLLECTION).doc(invitation.id).update({
      status: 'EXPIRED',
    });
    return { valid: false, error: 'This invitation has expired' };
  }

  return { valid: true, invitation };
}

/**
 * Mark invitation as used
 */
export async function markInvitationUsed(invitationId: string): Promise<void> {
  const db = getFirebaseAdminDb();
  await db.collection(INVITATIONS_COLLECTION).doc(invitationId).update({
    status: 'USED',
    usedAt: Timestamp.now(),
  });
}

/**
 * Get invitation by email (most recent)
 */
export async function getInvitationByEmail(email: string): Promise<Invitation | null> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(INVITATIONS_COLLECTION)
    .where('email', '==', email.toLowerCase())
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as Invitation;
}

/**
 * Get all invitations (for admin)
 */
export async function getAllInvitations(): Promise<Invitation[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(INVITATIONS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Invitation);
}

/**
 * Expire old invitations (cleanup task)
 */
export async function expireOldInvitations(): Promise<number> {
  const db = getFirebaseAdminDb();
  const now = Timestamp.now();
  
  const snapshot = await db
    .collection(INVITATIONS_COLLECTION)
    .where('status', '==', 'SENT')
    .where('expiresAt', '<', now)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { status: 'EXPIRED' });
  });

  await batch.commit();
  return snapshot.size;
}
