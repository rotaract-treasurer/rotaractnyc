'use client';

import { 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getFirebaseClientApp } from './client';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { User } from '@/types/portal';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const app = getFirebaseClientApp();
  const auth = app ? getAuth(app) : null;
  const db = app ? getFirestore(app) : null;

  useEffect(() => {
    if (!auth) {
      console.log('[Auth] Firebase auth not initialized');
      setLoading(false);
      return;
    }

    console.log('[Auth] Setting up auth state listener');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] State changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
      setUser(firebaseUser);
      
      if (firebaseUser && db) {
        // Fetch user data from Firestore
        try {
          console.log('[Auth] Fetching user document for:', firebaseUser.uid);
          let userDoc;
          try {
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          } catch (error: any) {
            if (error?.code === 'permission-denied') {
              // If custom claims were just updated (e.g., after seeding/role assignment),
              // force-refresh the ID token once and retry.
              try {
                await firebaseUser.getIdToken(true);
                userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              } catch {
                throw error;
              }
            }
            throw error;
          }
          if (userDoc.exists()) {
            console.log('[Auth] User document found:', userDoc.data());
            setUserData({ uid: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            console.log('[Auth] User document does not exist');
            // Create a minimal pending profile so admins can approve the account.
            try {
              await setDoc(
                doc(db, 'users', firebaseUser.uid),
                {
                  name: firebaseUser.displayName || firebaseUser.email || 'Member',
                  email: firebaseUser.email,
                  photoURL: firebaseUser.photoURL || null,
                  role: 'MEMBER',
                  status: 'pending',
                  phoneOptIn: false,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );

              const created = await getDoc(doc(db, 'users', firebaseUser.uid));
              setUserData(created.exists() ? ({ uid: firebaseUser.uid, ...created.data() } as User) : null);
            } catch (error: any) {
              if (error?.code !== 'permission-denied') {
                console.error('[Auth] Error creating pending user profile:', error);
              }
              setUserData(null);
            }
          }
        } catch (error: any) {
          // Ignore permission errors on first sign-in
          if (error?.code !== 'permission-denied') {
            console.error('[Auth] Error fetching user data:', error);
          } else {
            console.log('[Auth] Permission denied (expected for new users)');
          }
          setUserData(null);
        }
      } else {
        console.log('[Auth] No user or no db');
        setUserData(null);
      }
      
      console.log('[Auth] Loading complete');
      setLoading(false);
    });

    return unsubscribe;
  }, [auth, db]);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase not configured');
    
    const provider = new GoogleAuthProvider();
    try {
      console.log('[Auth] Starting Google sign in');
      const result = await signInWithPopup(auth, provider);
      console.log('[Auth] Sign in successful:', result.user.email);
      
      // Create session cookie on server
      const idToken = await result.user.getIdToken();
      console.log('[Auth] Got ID token, setting session');
      
      const response = await fetch('/api/portal/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      if (!response.ok) {
        console.error('[Auth] Failed to set session:', await response.text());
      } else {
        const json = await response.json().catch(() => null);
        console.log('[Auth] Session set successfully');

        // If the server bootstrapped custom claims, refresh token and re-set session.
        if (json?.needsTokenRefresh) {
          console.log('[Auth] Refreshing ID token to pick up custom claims');
          const refreshedToken = await result.user.getIdToken(true);
          const response2 = await fetch('/api/portal/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: refreshedToken }),
          });
          if (!response2.ok) {
            console.error('[Auth] Failed to set refreshed session:', await response2.text());
          } else {
            console.log('[Auth] Refreshed session set successfully');
          }
        }
      }
    } catch (error) {
      console.error('[Auth] Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) return;
    
    try {
      console.log('[Auth] Signing out');
      await firebaseSignOut(auth);
      // Clear session cookie on server
      await fetch('/api/portal/auth/session', {
        method: 'DELETE',
      });
      console.log('[Auth] Signed out successfully');
    } catch (error) {
      console.error('[Auth] Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    userData,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
