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
  sessionReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  member: null,
  loading: true,
  sessionReady: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

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

        // Step 1: Get the ID token (we'll need it for the session cookie)
        try {
          idToken = await firebaseUser.getIdToken();
        } catch (err) {
          console.error('Auth: Failed to fetch ID token:', err);
          setMember(null);
          setLoading(false);
          return;
        }

        // Step 2: Establish the session cookie FIRST. The server uses the
        // Admin SDK to (a) auto-approve admin-allowlisted emails, and
        // (b) migrate any board-created "invited" member doc — which lives
        // under an auto-generated id keyed by email — to be keyed by the
        // user's uid with status='active'. Firestore rules prevent the
        // client from doing this migration itself, so it must happen here
        // before we attempt to read or create the user's member doc.
        let serverAutoApproved = false;
        if (idToken) {
          try {
            const res = await fetch('/api/portal/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            });
            if (res.ok) {
              setSessionReady(true);
              const data = await res.json().catch(() => null);
              serverAutoApproved = !!(data?.autoApproved || data?.migratedFromInvite);
            } else {
              console.error('Auth: Session cookie creation returned', res.status);
              setSessionReady(false);
            }
          } catch (err) {
            console.error('Auth: Session cookie creation failed:', err);
            setSessionReady(false);
          }
        }

        // Step 3: Fetch the member profile (now that any invite migration
        // has been applied server-side).
        try {
          const memberRef = doc(getDb(), 'members', firebaseUser.uid);
          const memberSnap = await getDoc(memberRef);
          if (memberSnap.exists()) {
            resolvedMember = { id: memberSnap.id, ...memberSnap.data() } as Member;
          }
        } catch (err) {
          console.error('Auth: Failed to fetch member profile:', err);
        }

        // Step 4: Create a brand-new pending member if no doc exists yet.
        // (Only reached when the user has never been invited — the create
        // rule allows status='pending' for self-owned docs.)
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

        // Step 5: If the server flipped the user's status (admin auto-approve
        // or invite migration), make sure we have the freshest copy.
        if (serverAutoApproved) {
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

        setMember(resolvedMember);
        setLoading(false);
      } else {
        setMember(null);
        setSessionReady(false);
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
    setSessionReady(false);
  };

  return (
    <AuthContext.Provider value={{ user, member, loading, sessionReady, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
