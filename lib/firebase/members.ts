import { getFirebaseAdminDb } from './admin';
import { Member, MemberStatus } from '@/types/onboarding';
import { Timestamp } from 'firebase-admin/firestore';

const MEMBERS_COLLECTION = 'members';

/**
 * Create a new member record
 */
export async function createMember(data: {
  email: string;
  firstName: string;
  lastName: string;
  status?: MemberStatus;
  isAdmin?: boolean;
}): Promise<Member> {
  const db = getFirebaseAdminDb();
  const memberRef = db.collection(MEMBERS_COLLECTION).doc();
  
  const now = Timestamp.now();
  const member: Member = {
    id: memberRef.id,
    email: data.email.toLowerCase(),
    firstName: data.firstName,
    lastName: data.lastName,
    fullName: `${data.firstName} ${data.lastName}`,
    status: data.status || 'PENDING_PROFILE',
    isAdmin: data.isAdmin || false,
    dues: {
      amount: 8500, // $85 in cents
      currency: 'USD',
      paid: false,
    },
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
    invitedAt: now.toDate(),
  };

  await memberRef.set(member);
  return member;
}

/**
 * Get member by ID
 */
export async function getMemberById(memberId: string): Promise<Member | null> {
  const db = getFirebaseAdminDb();
  const doc = await db.collection(MEMBERS_COLLECTION).doc(memberId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as Member;
}

/**
 * Get member by email
 */
export async function getMemberByEmail(email: string): Promise<Member | null> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(MEMBERS_COLLECTION)
    .where('email', '==', email.toLowerCase())
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data() as Member;
}

/**
 * Update member profile
 */
export async function updateMemberProfile(
  memberId: string,
  data: {
    fullName?: string;
    bio?: string;
    photoURL?: string;
    role?: string;
    company?: string;
  }
): Promise<void> {
  const db = getFirebaseAdminDb();
  const updates: any = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  // If profile data is being updated, mark profile as complete
  if (data.fullName || data.bio) {
    const member = await getMemberById(memberId);
    if (member && member.status === 'PENDING_PROFILE') {
      updates.status = 'PENDING_PAYMENT';
      updates.profileCompletedAt = Timestamp.now();
    }
  }

  await db.collection(MEMBERS_COLLECTION).doc(memberId).update(updates);
}

/**
 * Update member status
 */
export async function updateMemberStatus(
  memberId: string,
  status: MemberStatus
): Promise<void> {
  const db = getFirebaseAdminDb();
  await db.collection(MEMBERS_COLLECTION).doc(memberId).update({
    status,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Mark dues as paid
 */
export async function markDuesPaid(
  memberId: string,
  stripePaymentId: string
): Promise<void> {
  const db = getFirebaseAdminDb();
  const member = await getMemberById(memberId);
  
  if (!member) {
    throw new Error('Member not found');
  }

  const updates: any = {
    'dues.paid': true,
    'dues.paidAt': Timestamp.now(),
    'dues.stripePaymentId': stripePaymentId,
    updatedAt: Timestamp.now(),
  };

  // If profile is complete, set status to ACTIVE
  if (member.status === 'PENDING_PAYMENT' || member.profileCompletedAt) {
    updates.status = 'ACTIVE';
  }

  await db.collection(MEMBERS_COLLECTION).doc(memberId).update(updates);
}

/**
 * Get all members (for admin)
 */
export async function getAllMembers(): Promise<Member[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(MEMBERS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Member);
}

/**
 * Get members by status
 */
export async function getMembersByStatus(status: MemberStatus): Promise<Member[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection(MEMBERS_COLLECTION)
    .where('status', '==', status)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Member);
}

/**
 * Check if user is an admin member
 */
export async function isAdminMember(email: string): Promise<boolean> {
  const member = await getMemberByEmail(email);
  return member?.isAdmin === true && member?.status === 'ACTIVE';
}
