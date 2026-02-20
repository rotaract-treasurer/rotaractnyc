/**
 * Seed script: creates the default Rotaract NYC committees.
 *
 * Run from the project root:
 *   npx ts-node --project tsconfig.json -e "require('./scripts/seed-committees.ts')"
 *
 * Or simply: npx tsx scripts/seed-committees.ts
 *
 * Requires .env.local with FIREBASE_SERVICE_ACCOUNT_KEY or
 * FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ─── Init ────────────────────────────────────────────────────────────────────
if (!getApps().length) {
  const saJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saJson) {
    let sa: ServiceAccount;
    try {
      sa = JSON.parse(saJson) as ServiceAccount;
    } catch {
      sa = JSON.parse(saJson.replace(/\n/g, '\\n')) as ServiceAccount;
    }
    initializeApp({ credential: cert(sa) });
  } else if (process.env.FIREBASE_PROJECT_ID) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as ServiceAccount),
    });
  } else {
    console.error('❌  No Firebase credentials found in .env.local');
    process.exit(1);
  }
}

const db = getFirestore();

// ─── Committee definitions ────────────────────────────────────────────────────
const COMMITTEES = [
  {
    slug: 'community-service',
    name: 'Community Service',
    description:
      'Plan and execute local NYC community service projects. We partner with organizations across the five boroughs to create meaningful, hands-on impact in our communities.',
    capacity: 8,
    meetingCadence: 'Every 2nd and 4th Tuesday, 7:00 PM',
  },
  {
    slug: 'international-service',
    name: 'International Service',
    description:
      'Connect with Rotaract clubs worldwide, coordinate international projects, and represent our club in the broader Rotary global network.',
    capacity: 6,
    meetingCadence: 'Every 1st Monday, 7:00 PM',
  },
  {
    slug: 'professional-development',
    name: 'Professional Development',
    description:
      'Organize career panels, mentorship programs, skill-building workshops, and networking events that help members grow personally and professionally.',
    capacity: 8,
    meetingCadence: 'Every 3rd Wednesday, 7:00 PM',
  },
  {
    slug: 'fellowship',
    name: 'Fellowship',
    description:
      'Build club culture through social events, member spotlights, and activities that keep everyone connected, engaged, and having fun.',
    capacity: 8,
    meetingCadence: 'Every 2nd Thursday, 7:00 PM',
  },
  {
    slug: 'membership',
    name: 'Membership',
    description:
      'Grow and retain our membership by welcoming new members, running recruitment campaigns, and continuously improving the onboarding experience.',
    capacity: 6,
    meetingCadence: 'Every 1st and 3rd Tuesday, 7:00 PM',
  },
  {
    slug: 'fundraising',
    name: 'Fundraising',
    description:
      'Develop and execute fundraising strategies that sustain club projects, fund service initiatives, and support our charitable causes.',
    capacity: 6,
    meetingCadence: 'Every 3rd Monday, 7:00 PM',
  },
  {
    slug: 'marketing-communications',
    name: 'Marketing & Communications',
    description:
      'Manage social media, the club newsletter, website content, and all public-facing communications to grow our brand and reach new audiences.',
    capacity: 6,
    meetingCadence: 'Every 2nd Wednesday, 7:00 PM',
  },
  {
    slug: 'events',
    name: 'Events',
    description:
      'Lead the end-to-end planning and execution of club events — from securing venues and managing logistics to day-of coordination and post-event wrap-ups.',
    capacity: 8,
    meetingCadence: 'Every 1st and 3rd Thursday, 7:00 PM',
  },
];

// ─── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱  Seeding committees…\n');

  for (const c of COMMITTEES) {
    // Check if already exists by slug
    const existing = await db
      .collection('committees')
      .where('slug', '==', c.slug)
      .limit(1)
      .get();

    if (!existing.empty) {
      console.log(`⏭   Skipped  "${c.name}" (already exists)`);
      continue;
    }

    await db.collection('committees').add({
      slug: c.slug,
      name: c.name,
      description: c.description,
      status: 'active',
      capacity: c.capacity,
      memberIds: [],
      waitlistIds: [],
      termHistory: [],
      driveURL: '',
      meetingCadence: c.meetingCadence,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅  Created  "${c.name}"`);
  }

  console.log('\n✨  Done!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
