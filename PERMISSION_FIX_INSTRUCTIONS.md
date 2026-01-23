# Fix Permission Errors - Quick Guide

## Problem
Users seeing "Missing or insufficient permissions" errors when accessing admin pages, events, or posts.

## Root Cause
Firestore security rules check `request.auth.token.role` (Firebase custom claims), but user roles are only stored in Firestore documents, not synced to custom claims.

## Solution

### Option 1: Use the Admin UI (Recommended)
1. Go to: https://rotaractnyc-henna.vercel.app/admin/fix-permissions
2. Click "Sync All User Claims"
3. **Sign out and sign back in** (this is critical!)
4. Try accessing the service-hours page again

### Option 2: Call the API Directly
```bash
curl -X POST https://rotaractnyc-henna.vercel.app/api/portal/admin/sync-claims \
  -H "Cookie: your-session-cookie"
```

### Option 3: Run Script Locally (Requires Firebase Admin SDK credentials)
```bash
# Set the Firebase service account JSON
export FIREBASE_SERVICE_ACCOUNT='{"project_id":"...", ...}'

# Run the sync script
node scripts/sync-custom-claims.js
```

## What This Does
- Reads all user roles from the `users` collection in Firestore
- Sets Firebase Auth custom claims for each user: `{ role: 'MEMBER' }`, `{ role: 'BOARD' }`, etc.
- After syncing, users must sign out and back in to refresh their auth token

## Why This is Necessary
Firebase Auth custom claims are embedded in the JWT token and checked by Firestore rules. They're:
- Faster than database reads
- Work offline
- Checked on every Firestore request

Without synced custom claims, even users with correct Firestore roles will get permission errors.

## For the Current User (treasurerrcun@gmail.com)
Your role is TREASURER in Firestore but not synced to custom claims. After running the sync tool:
1. Sign out of the admin panel
2. Sign back in
3. Your permissions will work correctly

## How to Prevent This in the Future
When creating or updating user roles, always sync custom claims:

```typescript
// In any API route or script
const auth = getAuth(app);
await auth.setCustomUserClaims(uid, { role: 'TREASURER' });
```

The project already has this implemented in:
- `/api/portal/admin/set-role` - Sets role for individual users
- `/api/portal/admin/sync-claims` - Syncs all users at once
- `scripts/sync-custom-claims.js` - CLI script for syncing

## Related Documentation
- [docs/PERMISSION_ISSUES_FIX.md](docs/PERMISSION_ISSUES_FIX.md) - Detailed technical explanation
- [docs/portal/PERMISSION_FIX_SUMMARY.md](docs/portal/PERMISSION_FIX_SUMMARY.md) - Architecture overview
