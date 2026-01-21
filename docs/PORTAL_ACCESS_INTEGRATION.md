# Portal Access Control Integration

This document explains how to integrate the member status checking into your existing portal layout.

## Current Portal Layout

The portal currently uses Firebase Auth with Google OAuth. We need to add member status checking to ensure only ACTIVE members can access the portal.

## Integration Steps

### Option 1: Update Portal Layout (Recommended)

Update `app/portal/layout.tsx` to check member status:

```tsx
'use client';

import { AuthProvider } from '@/lib/firebase/auth';
import PortalNav from './_components/PortalNav';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { useEffect, useState } from 'react';
import { checkMemberAccess } from '@/lib/firebase/memberAccess';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/portal/login';
  const isOnboardingPage = pathname?.startsWith('/portal/onboarding');

  return (
    <AuthProvider>
      {isLoginPage || isOnboardingPage ? (
        children
      ) : (
        <PortalShellWithAccessCheck>{children}</PortalShellWithAccessCheck>
      )}
    </AuthProvider>
  );
}

function PortalShellWithAccessCheck({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, signOut } = useAuth();
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAccess() {
      if (!loading && user && user.email) {
        try {
          const accessCheck = await checkMemberAccess(user.email);
          
          if (!accessCheck.hasAccess) {
            setAccessDenied(accessCheck.reason || 'Access denied');
            
            // If member exists but not active, redirect to onboarding
            if (accessCheck.member) {
              router.push('/portal/onboarding');
              return;
            }
          }
          
          setCheckingAccess(false);
        } catch (error) {
          console.error('Error checking member access:', error);
          setCheckingAccess(false);
        }
      } else if (!loading && !user) {
        router.push('/portal/login');
      }
    }

    verifyAccess();
  }, [loading, user, router]);

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex items-center justify-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading…</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur p-6">
          <h1 className="text-xl font-bold">Access Restricted</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {accessDenied}
          </p>
          <button
            onClick={() => signOut()}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Original portal shell content here...
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display antialiased">
      <PortalNav />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
```

### Option 2: Middleware Approach (Alternative)

Create `middleware.ts` at the project root:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and onboarding
  if (
    pathname.startsWith('/portal/login') ||
    pathname.startsWith('/portal/onboarding') ||
    !pathname.startsWith('/portal')
  ) {
    return NextResponse.next();
  }

  // Check auth token (from Firebase)
  const authToken = request.cookies.get('__session')?.value;
  
  if (!authToken) {
    return NextResponse.redirect(new URL('/portal/login', request.url));
  }

  // Additional member status check would require API call
  // This is why Option 1 is recommended for now

  return NextResponse.next();
}

export const config = {
  matcher: '/portal/:path*',
};
```

## Gradual Integration Plan

If you want to integrate gradually without breaking existing functionality:

### Phase 1: Add Routes (No Breaking Changes)
✅ Already done:
- Admin invite page: `/admin/members/invite`
- Onboarding flow: `/portal/onboarding`
- Stripe API routes

### Phase 2: Test Independently
Test the new onboarding system separately:
1. Invite test members
2. Complete onboarding flow
3. Verify payments work
4. Check member records in Firestore

### Phase 3: Enable Access Control (Breaking Change)
Once tested, implement Option 1 above to:
- Check member status on portal access
- Redirect non-ACTIVE members to onboarding
- Show appropriate error messages

### Phase 4: Data Migration
If you have existing users in the `users` collection:

```javascript
// Script to migrate existing users to members collection
// Run in Firebase Admin or as a one-time script

const admin = require('firebase-admin');
const db = admin.firestore();

async function migrateUsers() {
  const usersSnapshot = await db.collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const user = doc.data();
    
    // Check if already migrated
    const existingMember = await db
      .collection('members')
      .where('email', '==', user.email)
      .limit(1)
      .get();
    
    if (!existingMember.empty) {
      console.log(`Skipping ${user.email} - already exists`);
      continue;
    }
    
    // Create member record
    const memberData = {
      id: doc.id,
      email: user.email,
      firstName: user.name.split(' ')[0] || user.name,
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      fullName: user.name,
      bio: user.bio || '',
      photoURL: user.photoURL || '',
      role: user.role || '',
      status: user.status === 'active' ? 'ACTIVE' : 'INACTIVE',
      isAdmin: user.role === 'ADMIN',
      dues: {
        amount: 8500,
        currency: 'USD',
        paid: user.status === 'active', // Assume active = paid
        paidAt: user.status === 'active' ? new Date() : null,
      },
      createdAt: user.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection('members').doc(doc.id).set(memberData);
    console.log(`Migrated ${user.email}`);
  }
}

// Run: node migrate-users.js
migrateUsers().then(() => console.log('Done'));
```

## Compatibility Notes

### Existing User Collection
The onboarding system creates a **new** `members` collection separate from your existing `users` collection. This means:

✅ **No Breaking Changes**: Existing portal continues to work
✅ **Gradual Migration**: Can migrate users at your own pace
✅ **Easy Rollback**: Can disable onboarding features without affecting existing users

### Future Integration
To fully integrate both systems:

1. **Unified Auth**: Use the same user ID for both collections
2. **Dual Reads**: Check both `users` and `members` collections
3. **Deprecation Path**: Gradually migrate all users to `members` collection
4. **Single Source**: Eventually use only `members` collection

## Testing Without Breaking Existing Portal

### Isolated Testing
1. Keep existing portal routes working
2. Test onboarding at `/admin/members/invite` and `/portal/onboarding`
3. Create test members separate from existing users
4. Verify Stripe payments work

### Parallel Systems
- Existing users continue using `/portal` with `users` collection
- New members use onboarding flow → `members` collection
- Both can coexist until ready to merge

### Safe Deployment
1. Deploy onboarding routes
2. Test with new test members
3. Verify no impact on existing members
4. When ready, implement access control
5. Migrate existing users
6. Deprecate old system

## Questions to Answer Before Integration

1. **Do you want to enforce dues payment for existing members?**
   - Yes → Migrate all to `members` collection and require payment
   - No → Keep existing members in `users`, only new members pay

2. **Should existing active members automatically become ACTIVE in new system?**
   - Yes → Migration script marks them as dues paid
   - No → They go through onboarding too

3. **When to cut over to new system?**
   - Gradual: New members only, existing members stay as-is
   - Big Bang: Migrate everyone at once
   - Hybrid: Migrate over time with dual-collection support

## Recommended Approach

**For minimal disruption:**

1. ✅ Deploy all onboarding files (already done)
2. ✅ Test with new test members
3. ⏳ Create migration script for existing users
4. ⏳ Run migration to populate `members` collection
5. ⏳ Update portal layout to check `members` collection
6. ⏳ Monitor for issues
7. ⏳ Deprecate `users` collection once stable

**Timeline:**
- Week 1: Deploy + test onboarding with test members
- Week 2: Migrate existing users to `members` collection
- Week 3: Enable access control for new portal layout
- Week 4+: Monitor and iterate

---

**Need help with integration?** Check:
- Full docs: `docs/MEMBER_ONBOARDING.md`
- Quick reference: `docs/ONBOARDING_QUICK_REFERENCE.md`
