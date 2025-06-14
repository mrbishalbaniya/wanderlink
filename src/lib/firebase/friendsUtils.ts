
'use server';

import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';

/**
 * Fetches the profiles of users matched with the current user.
 */
export async function getMatchedUsers(currentUserId: string): Promise<UserProfile[]> {
  if (!currentUserId) {
    console.warn('getMatchedUsers called without currentUserId');
    return [];
  }

  try {
    const matchesQuery = query(
      collection(db, 'matches'),
      where('users', 'array-contains', currentUserId)
    );
    const matchesSnapshot = await getDocs(matchesQuery);

    if (matchesSnapshot.empty) {
      return [];
    }

    const matchedUserIds = new Set<string>();
    matchesSnapshot.forEach(matchDoc => {
      const users = matchDoc.data().users as string[];
      users.forEach(uid => {
        if (uid !== currentUserId) {
          matchedUserIds.add(uid);
        }
      });
    });

    if (matchedUserIds.size === 0) {
      return [];
    }
    
    const userProfilePromises: Promise<UserProfile | null>[] = [];
    matchedUserIds.forEach(userId => {
      const userDocRef = doc(db, 'users', userId);
      userProfilePromises.push(
        getDoc(userDocRef).then(userSnap => {
          if (userSnap.exists()) {
            const data = userSnap.data();
            // Convert Timestamps to Dates
            const profile: UserProfile = {
              uid: userSnap.id,
              ...data,
              joinedAtDate: data.joinedAt instanceof Timestamp ? data.joinedAt.toDate() : data.joinedAt,
              dateOfBirthDate: data.dateOfBirth instanceof Timestamp ? data.dateOfBirth.toDate() : data.dateOfBirth,
              lastUpdatedDate: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : data.lastUpdated,
            } as UserProfile;
            return profile;
          }
          return null;
        })
      );
    });

    const resolvedProfiles = await Promise.all(userProfilePromises);
    return resolvedProfiles.filter(profile => profile !== null) as UserProfile[];

  } catch (error) {
    console.error("Error fetching matched users:", error);
    // Depending on error handling strategy, you might want to throw the error
    // or return an empty array / specific error object.
    return []; 
  }
}
