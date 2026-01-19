# Portal Permission Issues - Fix Guide

## Problem

Users experiencing "Missing or insufficient permissions" errors when accessing portal content despite:
- Being successfully authenticated
- Having correct roles in Firestore user documents
- Having `status: 'active'` in their profile

## Root Cause

The Firestore security rules check `request.auth.token.role`, which comes from **Firebase Auth Custom Claims**, not from the Firestore user document. When a user's role is updated in Firestore but custom claims aren't synced, the security rules deny access.

```javascript
// In firestore.rules
function getUserRole() {
  return request.auth.token.role;  // ← This checks custom claims
}

function isMember() {
  return isAuthenticated() && getUserRole() in ['MEMBER', 'BOARD', 'TREASURER', 'ADMIN'];
}
```

## When This Happens

1. **Manual Firestore Updates**: Updating a user's role directly in Firestore console
2. **Seeding Scripts**: Running scripts that create/update users without syncing claims
3. **Role Changes**: When an admin changes a user's role through the UI but claims don't sync
4. **New Deployments**: After deploying without proper user initialization

## The Fix

### 1. Sync Custom Claims (Immediate Fix)

Run the sync script to update all users' custom claims:

```bash
node scripts/sync-custom-claims.js
```

This script:
- Reads all users from Firestore
- Syncs their `role` field to Firebase Auth custom claims
- Reports success/failure for each user

### 2. Deploy Updated Storage Rules

The original storage rules blocked all client access. Deploy the updated rules:

```bash
firebase deploy --only storage
```

### 3. Force Token Refresh

After syncing claims, affected users must refresh their authentication token:

**Option A: Sign out and back in** (easiest)
```typescript
await signOut();
// Then sign back in
```

**Option B: Force token refresh** (in client code)
```typescript
const user = firebase.auth().currentUser;
if (user) {
  await user.getIdToken(true); // true = force refresh
}
```

The client code in `auth.tsx` already handles this automatically when permission errors occur during initial sign-in.

## Prevention

### When Creating Users

Always set custom claims when creating or updating user roles:

```typescript
// ✓ Correct
await auth.setCustomUserClaims(uid, { role: 'TREASURER' });
await db.collection('users').doc(uid).set({
  role: 'TREASURER',
  // ... other fields
}, { merge: true });
```

### When Changing Roles

Use the `/api/portal/admin/set-role` endpoint which handles both:

```typescript
// ✓ Correct - syncs both Firestore and custom claims
await fetch('/api/portal/admin/set-role', {
  method: 'POST',
  body: JSON.stringify({ email, role }),
});

// ✗ Incorrect - only updates Firestore
await db.collection('users').doc(uid).update({ role });
```

### In Admin Scripts

Any script that modifies user roles should call `setCustomUserClaims`:

```javascript
const admin = require('firebase-admin');
const auth = admin.auth();
const db = admin.firestore();

// Update both!
await auth.setCustomUserClaims(uid, { role: 'BOARD' });
await db.collection('users').doc(uid).set({ role: 'BOARD' }, { merge: true });
```

## Verification

### Check Custom Claims

```javascript
// In Node.js with Firebase Admin
const user = await admin.auth().getUser(uid);
console.log('Custom claims:', user.customClaims);
// Should show: { role: 'TREASURER' }
```

### Check Token in Browser

```javascript
// In browser console
const user = firebase.auth().currentUser;
const token = await user.getIdTokenResult();
console.log('Claims:', token.claims);
// Should show: { role: 'TREASURER', ... }
```

### Test Firestore Access

If custom claims are set correctly, this should work:

```javascript
const db = firebase.firestore();
const events = await db.collection('portalEvents').get();
console.log('Events:', events.docs.length);
```

## Common Errors

### "Missing or insufficient permissions"
- **Cause**: Custom claims not set or out of sync
- **Fix**: Run `sync-custom-claims.js` and have user refresh token

### "CORS policy blocked"
- **Cause**: Storage rules too restrictive
- **Fix**: Deploy updated `storage.rules`

### "User document not found"
- **Cause**: User exists in Auth but not Firestore
- **Fix**: Create Firestore document via admin panel or seeding script

## Architecture Notes

### Why Custom Claims?

Firebase security rules can only access data from:
1. The authentication token (`request.auth`)
2. The resource being accessed (`resource.data`)
3. Other documents via `get()` or `exists()` (limited, slower)

Custom claims are embedded in the auth token, making role checks fast and efficient without extra Firestore reads.

### Claim Propagation

```
1. Server sets claims:     auth.setCustomUserClaims(uid, { role })
2. Client refreshes token:  user.getIdToken(true)
3. New requests include:    Authorization: Bearer <token-with-claims>
4. Rules can check:         request.auth.token.role
```

### Session vs Token

- **Session Cookie**: Server-side, created from ID token
- **ID Token**: Client-side, contains custom claims
- Both need refreshing when claims change

## Deployment Checklist

When deploying to production:

- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Storage rules: `firebase deploy --only storage`
- [ ] Run sync script: `node scripts/sync-custom-claims.js`
- [ ] Test with different user roles
- [ ] Verify Storage CORS (check browser console for CORS errors)
- [ ] Document any new admin users in allowlist

## Support

If issues persist after following this guide:

1. Check Firebase console → Authentication → Users → [User] → Custom claims
2. Check Firestore console → users → [uid] → role field
3. Verify both match
4. Check browser console for specific error codes
5. Review [docs/PORTAL_ARCHITECTURE.md](./PORTAL_ARCHITECTURE.md) for system overview
