/**
 * One-off script to clean up the Fundraiser Gala event description.
 *
 *  • Removes the stray U+FFFC object-replacement char that came from a
 *    paste out of Apple Notes / Pages.
 *  • Drops duplicated logistics that the page already shows in the
 *    Date/Time, Location, and Pricing cards.
 *  • Restructures into short paragraphs + a bullet list so the new
 *    EventDescription renderer can format it nicely.
 *
 * Usage:
 *   npx tsx scripts/update-gala-description.ts            # dry-run, prints diff
 *   npx tsx scripts/update-gala-description.ts --write    # actually writes
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const saJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saJson) {
    console.error(
      '❌ FIREBASE_SERVICE_ACCOUNT_KEY (or FIREBASE_SERVICE_ACCOUNT) not set in .env.local',
    );
    process.exit(1);
  }
  let sa: any;
  try {
    sa = JSON.parse(saJson);
  } catch {
    sa = JSON.parse(saJson.replace(/\n/g, '\\n'));
  }
  initializeApp({ credential: cert(sa) });
}

const db = getFirestore();

const SLUG = 'fundraiser-gala-30th-year-celebration';

const NEW_DESCRIPTION = `Celebrate three decades of service, leadership, and impact with an evening of connection, community, and purpose. Join us as we mark 30 years of the Rotaract Club at the United Nations.

**What's included**
- Entry to the gala
- Appetizers
- One complimentary drink

**Dress code:** semi-formal.

Questions? Email us at rotaractnewyorkcity@gmail.com or DM @rotaractnyc on Instagram.`;

async function main() {
  const write = process.argv.includes('--write');

  const snap = await db
    .collection('events')
    .where('slug', '==', SLUG)
    .limit(1)
    .get();

  if (snap.empty) {
    console.error(`❌ No event found with slug "${SLUG}"`);
    process.exit(1);
  }

  const doc = snap.docs[0];
  const current = (doc.data().description as string) || '';

  console.log('── Current description ──');
  console.log(current);
  console.log('\n── New description ──');
  console.log(NEW_DESCRIPTION);

  if (!write) {
    console.log('\n💡 Dry run only. Re-run with --write to apply.');
    return;
  }

  await doc.ref.update({
    description: NEW_DESCRIPTION,
    updatedAt: new Date().toISOString(),
  });
  console.log('\n✅ Updated event description in Firestore.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
