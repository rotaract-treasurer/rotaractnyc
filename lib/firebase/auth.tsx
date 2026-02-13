'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './client';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create member profile
        const memberRef = doc(db, 'members', firebaseUser.uid);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          setMember({ id: memberSnap.id, ...memberSnap.data() } as Member);
        } else {
          // Auto-create pending profile
          const newMember: Omit<Member, 'id'> = {
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            photoURL: firebaseUser.photoURL || '',
            role: 'member',
            status: 'pending',
            joinedAt: new Date().toISOString(),
          };
          await setDoc(memberRef, { ...newMember, createdAt: serverTimestamp() });
          setMember({ id: firebaseUser.uid, ...newMember });
        }
        // Set session cookie
        const idToken = await firebaseUser.getIdToken();
        await fetch('/api/portal/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      } else {
        setMember(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await fetch('/api/portal/auth/session', { method: 'DELETE' });
    await firebaseSignOut(auth);
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
