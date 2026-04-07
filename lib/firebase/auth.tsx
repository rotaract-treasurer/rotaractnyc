'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth as getAuth, db as getDb } from './client';
import type { Member } from '@/types';

interface AuthContextType {
  user: User | null;
  member: Member | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  member: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle redirect result (from signInWithRedirect fallback)
  useEffect(() => {
    getRedirectResult(getAuth()).catch(() => {});
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let resolvedMember: Member | null = null;
        let idToken: string | null = null;

        // Step 1: Fetch member profile and ID token
        try {
          const memberRef = doc(getDb(), 'members', firebaseUser.uid);
          const [memberSnap, token] = await Promise.all([
            getDoc(memberRef),
            firebaseUser.getIdToken(),
          ]);
          idToken = token;

          if (memberSnap.exists()) {
            resolvedMember = { id: memberSnap.id, ...memberSnap.data() } as Member;
          }
        } catch (err) {
          console.error('Auth: Failed to fetch member profile or ID token:', err);
          setMember(null);
          setLoading(false);
          return;
        }

        // Step 2: Handle invite migration or new member creation
        if (!resolvedMember) {
          try {
            const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
            const memberRef = doc(getDb(), 'members', firebaseUser.uid);
            const inviteQuery = query(
              collection(getDb(), 'members'),
              where('email', '==', (firebaseUser.email || '').toLowerCase()),
            );
            const inviteSnap = await getDocs(inviteQuery);
            const invitedDoc = inviteSnap.docs.find((d) => d.id !== firebaseUser.uid);

            if (invitedDoc) {
              // Migrate the invited member doc to the Firebase UID key
              try {
                const inviteData = invitedDoc.data();
                const migratedMember: Record<string, any> = {
                  ...inviteData,
                  displayName: firebaseUser.displayName || inviteData.displayName || '',
                  photoURL: firebaseUser.photoURL || inviteData.photoURL || '',
                  status: 'active',
                };
                if (!inviteData.onboardingComplete) {
                  migratedMember.onboardingComplete = false;
                }
                await setDoc(memberRef, migratedMember);
                await deleteDoc(invitedDoc.ref);
                resolvedMember = { id: firebaseUser.uid, ...migratedMember } as Member;
              } catch (migrateErr) {
                console.error('Auth: Invite migration failed, creating new member instead:', migrateErr);
                // Fall through to new member creation below
              }
            }
          } catch (err) {
            console.error('Auth: Failed to check for invited member:', err);
            // Fall through to new member creation below
          }
        }

        // Step 3: Create new member if still unresolved
        if (!resolvedMember) {
          try {
            const memberRef = doc(getDb(), 'members', firebaseUser.uid);
            const newMember: Omit<Member, 'id'> = {
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              firstName: firebaseUser.displayName?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
              photoURL: firebaseUser.photoURL || '',
              role: 'member',
              status: 'pending',
              onboardingComplete: false,
              joinedAt: new Date().toISOString(),
            };
            await setDoc(memberRef, { ...newMember, createdAt: serverTimestamp() });
            resolvedMember = { id: firebaseUser.uid, ...newMember };
          } catch (err) {
            console.error('Auth: Failed to create new member record:', err);
          }
        }

        // Step 4: Set session cookie BEFORE updating state — the middleware
        // checks this cookie on every /portal/* navigation, so it must exist
        // before the login-page redirect fires.
        if (idToken) {
          try {
            const res = await fetch('/api/portal/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            });
            if (res.ok) {
              const data = await res.json().catch(() => null);
              if (data?.autoApproved) {
                try {
                  const memberRef = doc(getDb(), 'members', firebaseUser.uid);
                  const freshSnap = await getDoc(memberRef);
                  if (freshSnap.exists()) {
                    resolvedMember = { id: freshSnap.id, ...freshSnap.data() } as Member;
                  }
                } catch (err) {
                  console.warn('Auth: Failed to refresh member after auto-approval:', err);
                }
              }
            }
          } catch (err) {
            console.warn('Session cookie creation failed:', err);
          }
        }

        setMember(resolvedMember);
        setLoading(false);
      } else {
        setMember(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(getAuth(), provider);
    } catch (err: any) {
      // If popup is blocked or fails, fall back to redirect
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        console.warn('Popup blocked/closed, falling back to redirect');
        await signInWithRedirect(getAuth(), provider);
      } else {
        console.error('Google sign-in error:', err?.code, err?.message);
        throw err;
      }
    }
  };

  const signOut = async () => {
    await fetch('/api/portal/auth/session', { method: 'DELETE' });
    await firebaseSignOut(getAuth());
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{ user, member, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
