
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
            const profile: UserProfile = {
              uid: userSnap.id,
              ...data,
            } as UserProfile; // Cast initially, then refine dates

            // Robust date conversion for joinedAt
            if (data.joinedAt) {
              if (data.joinedAt instanceof Timestamp) {
                profile.joinedAtDate = data.joinedAt.toDate();
              } else if (data.joinedAt instanceof Date) {
                profile.joinedAtDate = data.joinedAt;
              } else if (typeof data.joinedAt === 'object' && (data.joinedAt as any).seconds) {
                profile.joinedAtDate = new Timestamp((data.joinedAt as any).seconds, (data.joinedAt as any).nanoseconds).toDate();
              }
            }

            // Robust date conversion for dateOfBirth
            if (data.dateOfBirth) {
              if (data.dateOfBirth instanceof Timestamp) {
                profile.dateOfBirthDate = data.dateOfBirth.toDate();
              } else if (data.dateOfBirth instanceof Date) {
                profile.dateOfBirthDate = data.dateOfBirth;
              } else if (typeof data.dateOfBirth === 'object' && (data.dateOfBirth as any).seconds) {
                profile.dateOfBirthDate = new Timestamp((data.dateOfBirth as any).seconds, (data.dateOfBirth as any).nanoseconds).toDate();
              }
            }
            
            // Robust date conversion for lastUpdated
            if (data.lastUpdated) {
              if (data.lastUpdated instanceof Timestamp) {
                profile.lastUpdatedDate = data.lastUpdated.toDate();
              } else if (data.lastUpdated instanceof Date) {
                profile.lastUpdatedDate = data.lastUpdated;
              } else if (typeof data.lastUpdated === 'object' && (data.lastUpdated as any).seconds) {
                 profile.lastUpdatedDate = new Timestamp((data.lastUpdated as any).seconds, (data.lastUpdated as any).nanoseconds).toDate();
              }
            }
            return profile;
          }
          console.warn(`Matched user profile not found for userId: ${userId}`);
          return null;
        }).catch(err => {
            console.error(`Error fetching profile for matched user ${userId}:`, err);
            return null;
        })
      );
    });

    const resolvedProfiles = await Promise.all(userProfilePromises);
    return resolvedProfiles.filter(profile => profile !== null) as UserProfile[];

  } catch (error) {
    console.error("Error fetching matched users:", error);
    return []; 
  }
}
