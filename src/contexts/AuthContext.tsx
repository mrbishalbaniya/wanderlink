
// src/contexts/AuthContext.tsx
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>; 
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const profileData = userSnap.data() as UserProfile;
          
          if (profileData.joinedAt && typeof (profileData.joinedAt as any).toDate === 'function') {
            profileData.joinedAtDate = (profileData.joinedAt as Timestamp).toDate();
          }
          if (profileData.dateOfBirth && typeof (profileData.dateOfBirth as any).toDate === 'function') {
            profileData.dateOfBirthDate = (profileData.dateOfBirth as Timestamp).toDate();
          }
           if (profileData.lastUpdated && typeof (profileData.lastUpdated as any).toDate === 'function') {
            profileData.lastUpdatedDate = (profileData.lastUpdated as Timestamp).toDate();
          }
          setUserProfile(profileData);
        } else {
          const initialName = user.displayName || user.email?.split('@')[0] || 'Wanderer';
          const newUserProfile: UserProfile = {
            uid: user.uid,
            name: initialName,
            email: user.email || '',
            avatar: user.photoURL || `https://placehold.co/100x100.png?text=${initialName.charAt(0).toUpperCase()}`,
            joinedAt: serverTimestamp(), 
            profileCompletionScore: 10, // Initial small score
          };
          try {
            await setDoc(userRef, newUserProfile);
            setUserProfile({ ...newUserProfile, joinedAtDate: new Date(), profileCompletionScore: 10 });
          } catch (profileError) {
            console.error("Error creating user profile:", profileError);
            setUserProfile(null); 
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();
  };
  
  const value = {
    currentUser,
    userProfile,
    setUserProfile, 
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
