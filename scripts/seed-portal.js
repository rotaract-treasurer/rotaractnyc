#!/usr/bin/env node

/**
 * Seed script for Rotaract NYC Members Portal
 * 
 * This script helps set up initial data for the portal including:
 * - Promoting a user to ADMIN role
 * - Creating sample events, announcements, documents
 * 
 * Usage:
 *   node scripts/seed-portal.js --admin email@example.com
 *   node scripts/seed-portal.js --sample-data
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(decoded);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.error('Error: Firebase credentials not found in environment variables');
    process.exit(1);
  }
} catch (error) {
  console.error('Error initializing Firebase:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

async function promoteToAdmin(email) {
  try {
    console.log(`Promoting ${email} to ADMIN...`);
    
    // Get user by email
    const user = await auth.getUserByEmail(email);
    
    // Set custom claims
    await auth.setCustomUserClaims(user.uid, { role: 'ADMIN' });
    
    // Update Firestore
    await db.collection('users').doc(user.uid).set({
      name: user.displayName || 'Admin User',
      email: user.email,
      photoURL: user.photoURL || null,
      role: 'ADMIN',
      status: 'active',
      phoneOptIn: false,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    }, { merge: true });
    
    console.log(`✓ Successfully promoted ${email} to ADMIN`);
    console.log(`  UID: ${user.uid}`);
    console.log(`  User must sign out and sign back in for role to take effect`);
  } catch (error) {
    console.error(`✗ Error promoting user:`, error.message);
    throw error;
  }
}

async function createSampleData() {
  try {
    console.log('Creating sample data...\n');

    // Create a few sample users (Firestore docs only)
    const now = admin.firestore.Timestamp.now();
    const sampleUsers = [
      {
        uid: 'system',
        name: 'Rotaract NYC',
        email: 'no-reply@rotaractnyc.org',
        photoURL: null,
        role: 'ADMIN',
        status: 'active',
        committee: 'Leadership',
        phoneOptIn: false,
        spotlightQuote: 'Welcome to the Rotaract NYC members portal!',
      },
      {
        uid: 'u_elena',
        name: 'Elena Rodriguez',
        email: 'elena@example.com',
        photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
        role: 'BOARD',
        status: 'active',
        committee: 'Service',
        phoneOptIn: false,
        spotlightQuote: 'Service is how we build community — together.',
      },
      {
        uid: 'u_marcus',
        name: 'Marcus Chen',
        email: 'marcus@example.com',
        photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
        role: 'BOARD',
        status: 'active',
        committee: 'Operations',
        phoneOptIn: false,
      },
      {
        uid: 'u_sarah',
        name: 'Sarah Kim',
        email: 'sarah@example.com',
        photoURL: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&h=200&fit=crop',
        role: 'MEMBER',
        status: 'active',
        committee: 'Fundraising',
        phoneOptIn: false,
      },
      {
        uid: 'u_amina',
        name: 'Amina Patel',
        email: 'amina@example.com',
        photoURL: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop',
        role: 'TREASURER',
        status: 'active',
        committee: 'Finance',
        phoneOptIn: false,
      }
    ];

    for (const u of sampleUsers) {
      await db.collection('users').doc(u.uid).set({
        name: u.name,
        email: u.email,
        photoURL: u.photoURL,
        role: u.role,
        status: u.status,
        committee: u.committee,
        phoneOptIn: u.phoneOptIn,
        spotlightQuote: u.spotlightQuote || null,
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
    }
    console.log(`✓ Upserted ${sampleUsers.length} sample users`);
    
    // Sample portal events (keep separate from public site events)
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;

    const eventRef = await db.collection('portalEvents').add({
      title: 'Monthly General Meeting',
      description: 'Join us for our monthly general meeting to discuss upcoming projects and initiatives.',
      startAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + oneWeek)),
      endAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + oneWeek + 2 * 60 * 60 * 1000)),
      location: 'Virtual (Zoom link will be shared)',
      visibility: 'member',
      createdBy: 'system',
      createdAt: now,
      updatedAt: now
    });
    console.log(`✓ Created sample event: ${eventRef.id}`);

    const eventRef2 = await db.collection('portalEvents').add({
      title: 'Community Service: Food Pantry Support',
      description: 'Help sort and pack food donations for NYC families. Gloves provided.',
      startAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + twoWeeks)),
      endAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + twoWeeks + 3 * 60 * 60 * 1000)),
      location: 'Manhattan, NY',
      visibility: 'member',
      createdBy: 'u_elena',
      createdAt: now,
      updatedAt: now
    });
    console.log(`✓ Created sample event: ${eventRef2.id}`);
    
    // Sample announcements
    const announcementRef = await db.collection('announcements').add({
      title: 'Welcome to the Members Portal!',
      body: 'We\'re excited to launch our new members portal. Here you can access events, announcements, documents, and more. Please take a moment to update your profile and explore the features.',
      pinned: true,
      visibility: 'member',
      createdBy: 'system',
      createdAt: now
    });
    console.log(`✓ Created sample announcement: ${announcementRef.id}`);

    const announcementRef2 = await db.collection('announcements').add({
      title: 'Volunteer Spotlight',
      body: 'Huge thanks to everyone who joined last weekend’s cleanup — we made a real impact.',
      pinned: false,
      visibility: 'member',
      createdBy: 'u_marcus',
      createdAt: now
    });
    console.log(`✓ Created sample announcement: ${announcementRef2.id}`);
    
    // Sample document
    const documentRef = await db.collection('documents').add({
      title: 'Club Bylaws',
      category: 'Governance',
      url: 'https://example.com/bylaws.pdf',
      visibility: 'member',
      createdBy: 'system',
      createdAt: now
    });
    console.log(`✓ Created sample document: ${documentRef.id}`);

    const documentRef2 = await db.collection('documents').add({
      title: 'Monthly Meeting Minutes (Sample)',
      category: 'Minutes',
      url: 'https://example.com/minutes.pdf',
      visibility: 'member',
      createdBy: 'u_marcus',
      createdAt: now
    });
    console.log(`✓ Created sample document: ${documentRef2.id}`);

    // Sample community posts
    const posts = [
      {
        authorUid: 'u_elena',
        authorName: 'Elena Rodriguez',
        authorRole: 'Service Committee Chair',
        authorPhotoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
        title: 'Highlights from the Park Clean-up',
        body: 'Amazing turnout this weekend — thank you everyone who helped keep NYC beautiful!',
        type: 'text',
        images: null,
        document: null,
        likesCount: 24,
        commentsCount: 6,
        createdAt: now,
      },
      {
        authorUid: 'system',
        authorName: 'Rotaract NYC',
        authorRole: 'Official Announcement',
        authorPhotoURL: null,
        title: 'Welcome our newest members!',
        body: 'We are thrilled to welcome new members this month. Say hi at the next meetup!',
        type: 'announcement',
        images: null,
        document: null,
        likesCount: 42,
        commentsCount: 12,
        createdAt: now,
      },
      {
        authorUid: 'u_marcus',
        authorName: 'Marcus Chen',
        authorRole: 'Club Secretary',
        authorPhotoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
        title: null,
        body: "Just uploaded a sample minutes doc — please review before next week.",
        type: 'document',
        images: null,
        document: {
          name: 'Meeting_Minutes_Sample.pdf',
          size: '1.2 MB',
          url: 'https://example.com/minutes.pdf'
        },
        likesCount: 8,
        commentsCount: 3,
        createdAt: now,
      }
    ];

    for (const p of posts) {
      const ref = await db.collection('communityPosts').add(p);
      console.log(`✓ Created community post: ${ref.id}`);
    }

    // Sample acknowledgements on announcements
    await db
      .collection('announcements')
      .doc(announcementRef.id)
      .collection('acknowledgements')
      .doc('u_sarah')
      .set({ createdAt: now });
    await db
      .collection('announcements')
      .doc(announcementRef.id)
      .collection('acknowledgements')
      .doc('u_marcus')
      .set({ createdAt: now });
    console.log('✓ Added sample acknowledgements');

    // Sample transactions (member-visible)
    const txs = [
      {
        date: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
        vendor: 'Office Depot',
        category: 'Operations',
        amount: -86.42,
        noteForMembers: 'Supplies for meeting materials',
        visibility: 'member',
        createdBy: 'u_amina',
        createdAt: now,
      },
      {
        date: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)),
        vendor: 'Member Dues',
        category: 'Fundraising',
        amount: 250,
        noteForMembers: 'Monthly dues collected (sample)',
        visibility: 'member',
        createdBy: 'u_amina',
        createdAt: now,
      }
    ];
    for (const t of txs) {
      const ref = await db.collection('transactions').add(t);
      console.log(`✓ Created transaction: ${ref.id}`);
    }
    
    // Sample monthly summary
    const currentDate = new Date();
    const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    await db.collection('monthlySummaries').doc(month).set({
      month,
      startingBalance: 1000,
      incomeTotal: 500,
      expenseTotal: 300,
      endingBalance: 1200,
      categoryTotals: {
        'Fundraising': 500,
        'Events': -200,
        'Operations': -100
      },
      notes: 'Sample monthly summary',
      updatedAt: now
    });
    console.log(`✓ Created sample monthly summary: ${month}`);
    
    console.log('\n✓ Sample data created successfully!');
  } catch (error) {
    console.error('✗ Error creating sample data:', error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/seed-portal.js --admin email@example.com');
    console.log('  node scripts/seed-portal.js --sample-data');
    console.log('  node scripts/seed-portal.js --admin email@example.com --sample-data');
    process.exit(0);
  }
  
  try {
    if (args.includes('--admin')) {
      const emailIndex = args.indexOf('--admin') + 1;
      const email = args[emailIndex];
      if (!email || !email.includes('@')) {
        console.error('Error: Invalid email address');
        process.exit(1);
      }
      await promoteToAdmin(email);
    }
    
    if (args.includes('--sample-data')) {
      await createSampleData();
    }
    
    console.log('\n✓ All operations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Script failed:', error.message);
    process.exit(1);
  }
}

main();
