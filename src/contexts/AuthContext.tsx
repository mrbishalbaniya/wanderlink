
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true); // Ensure loading is true when effect runs
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserProfile(userSnap.data() as UserProfile);
        } else {
          const newUserProfile: UserProfile = {
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Anonymous Wanderer',
            email: user.email || '',
            avatar: user.photoURL || `https://placehold.co/100x100.png?text=${(user.displayName || user.email || 'U').charAt(0)}`,
            joinedAt: serverTimestamp(),
          };
          try {
            await setDoc(userRef, newUserProfile);
            setUserProfile(newUserProfile);
          } catch (profileError) {
            console.error("Error creating user profile:", profileError);
            // Decide how to handle profile creation error, maybe set userProfile to a default/error state
          }
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase onAuthStateChanged error:", error);
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false); // Ensure loading is set to false even on auth listener error
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();
  };
  
  const value = {
    currentUser,
    userProfile,
    loading,
    logout
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
