#!/usr/bin/env node
/**
 * Sync Firestore user roles to Firebase Auth custom claims
 * 
 * This script fixes permission errors by ensuring all users have their
 * Firestore role synced to their Firebase Auth custom claims.
 * 
 * The Firestore security rules check request.auth.token.role, which comes from
 * custom claims. If these aren't set, users will get "Missing or insufficient permissions"
 * errors even though they have the correct role in Firestore.
 * 
 * Usage: node scripts/sync-custom-claims.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  try {
    // Try to use service account from environment
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Use default credentials (works in Cloud Functions, etc.)
      admin.initializeApp();
    }
    console.log('✓ Firebase Admin initialized');
  } catch (error) {
    console.error('✗ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

const auth = admin.auth();
const db = admin.firestore();

async function syncCustomClaims() {
  try {
    console.log('\n🔄 Syncing user roles to custom claims...\n');
    
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️  No users found in Firestore');
      return;
    }
    
    console.log(`Found ${usersSnapshot.size} user(s) in Firestore\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process each user
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const uid = doc.id;
      const role = userData.role;
      const email = userData.email;
      
      if (!role) {
        console.log(`⚠️  Skipping ${email || uid}: No role in Firestore`);
        continue;
      }
      
      try {
        // Get current custom claims
        const userRecord = await auth.getUser(uid);
        const currentRole = userRecord.customClaims?.role;
        
        if (currentRole === role) {
          console.log(`✓ ${email || uid}: Role already synced (${role})`);
          successCount++;
          continue;
        }
        
        // Set custom claims
        await auth.setCustomUserClaims(uid, { role });
        console.log(`✅ ${email || uid}: Synced role to ${role} (was: ${currentRole || 'none'})`);
        successCount++;
        
      } catch (error) {
        errorCount++;
        const errorMsg = `✗ ${email || uid}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Summary:');
    console.log(`  ✓ Success: ${successCount}`);
    console.log(`  ✗ Errors:  ${errorCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (errors.length > 0) {
      console.log('Errors encountered:');
      errors.forEach(err => console.log(`  ${err}`));
      console.log('');
    }
    
    console.log('⚠️  IMPORTANT: Users must sign out and sign back in for changes to take effect.');
    console.log('   Or refresh their token by calling: await firebase.auth().currentUser.getIdToken(true)\n');
    
    return { successCount, errorCount };
    
  } catch (error) {
    console.error('\n✗ Fatal error:', error);
    throw error;
  }
}

// Run the sync
syncCustomClaims()
  .then(result => {
    if (result && result.errorCount > 0) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to sync custom claims:', error);
    process.exit(1);
  });
