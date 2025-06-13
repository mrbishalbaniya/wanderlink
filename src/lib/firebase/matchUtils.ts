
'use server';

import { db } from '@/lib/firebase';
import type { UserProfile, SwipeAction } from '@/types';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp,
  writeBatch,
  doc,
  getDoc,
  orderBy,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

const PROFILES_PER_FETCH = 10;

// Helper function to get a sorted match ID
const getMatchDocId = (uid1: string, uid2: string): string => {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};

/**
 * Fetches potential users to swipe, excluding the current user, users already swiped by the current user,
 * and users already matched with the current user.
 */
export async function getUsersToSwipe(
  currentUserId: string,
  lastFetchedUserSnap: QueryDocumentSnapshot | null
): Promise<{profiles: UserProfile[], newLastFetchedUserSnap: QueryDocumentSnapshot | null}> {
  try {
    // 1. Get UIDs of users already swiped by the current user
    const swipesQuery = query(collection(db, 'swipes'), where('swiperId', '==', currentUserId));
    const swipesSnapshot = await getDocs(swipesQuery);
    const swipedUserIds = swipesSnapshot.docs.map(doc => doc.data().swipedUserId);

    // 2. Get UIDs of users already matched with the current user
    const matchesQuery = query(collection(db, 'matches'), where('users', 'array-contains', currentUserId));
    const matchesSnapshot = await getDocs(matchesQuery);
    const matchedUserIds = matchesSnapshot.docs.flatMap(doc => doc.data().users).filter(uid => uid !== currentUserId);
    
    const excludedUserIds = new Set([currentUserId, ...swipedUserIds, ...matchedUserIds]);
    
    // 3. Fetch users, excluding the ones identified above
    // Firestore does not support 'not-in' queries with more than 10 items directly in a scalable way for large datasets,
    // nor does it support multiple '!=' clauses efficiently.
    // A common workaround is to fetch users and filter client-side, or use more complex data structures / backend logic.
    // For this example, we'll fetch users and if the excluded list is small enough, try to use 'not-in'.
    // If excludedUserIds is too large, we fetch and filter. This isn't ideal for massive scale.

    let usersQuery;
    const usersCollectionRef = collection(db, 'users');

    if (excludedUserIds.size > 0 && excludedUserIds.size <= 10) { // Firestore 'not-in' limit
        usersQuery = query(
            usersCollectionRef,
            where('uid', 'not-in', Array.from(excludedUserIds)),
            orderBy('uid'), // Required for pagination with 'not-in'
            ...(lastFetchedUserSnap ? [startAfter(lastFetchedUserSnap)] : []),
            limit(PROFILES_PER_FETCH)
        );
    } else {
         // Fallback: fetch users and filter client-side if 'not-in' is not viable
        usersQuery = query(
            usersCollectionRef,
            where('uid', '!=', currentUserId), // Basic exclusion
            orderBy('uid'),
            ...(lastFetchedUserSnap ? [startAfter(lastFetchedUserSnap)] : []),
            limit(PROFILES_PER_FETCH * 2) // Fetch more to account for client-side filtering
        );
    }
    
    const usersSnapshot = await getDocs(usersQuery);
    
    let profiles: UserProfile[] = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
      .filter(profile => !excludedUserIds.has(profile.uid)); // Client-side filter if not-in wasn't used or to be sure

    if (profiles.length > PROFILES_PER_FETCH) {
        profiles = profiles.slice(0, PROFILES_PER_FETCH);
    }
    
    const newLastFetchedUserSnap = usersSnapshot.docs.length > 0 ? usersSnapshot.docs[usersSnapshot.docs.length - 1] : null;

    return { profiles, newLastFetchedUserSnap };

  } catch (error) {
    console.error("Error fetching users to swipe:", error);
    return { profiles: [], newLastFetchedUserSnap: null };
  }
}


/**
 * Records a swipe action in Firestore.
 */
export async function recordSwipe(swiperId: string, swipedUserId: string, action: SwipeAction): Promise<void> {
  try {
    const swipeData = {
      swiperId,
      swipedUserId,
      action,
      timestamp: serverTimestamp(),
    };
    // Use a specific ID for swipes to easily check for existing swipes if needed, or allow multiple swipes (e.g., if a user changes their mind)
    // For simplicity, we'll let Firestore auto-generate IDs for swipe documents.
    await addDoc(collection(db, 'swipes'), swipeData);
  } catch (error) {
    console.error("Error recording swipe:", error);
    throw error;
  }
}

/**
 * Checks if a mutual like exists (i.e., if the other user has also liked the current user).
 * If a mutual like is found, creates a match document in Firestore.
 * Returns the UserProfile of the matched user if a match is made, otherwise null.
 */
export async function checkForAndCreateMatch(swiperId: string, likedUserId: string): Promise<UserProfile | null> {
  try {
    // Check if likedUserId has also liked swiperId
    const reverseSwipeQuery = query(
      collection(db, 'swipes'),
      where('swiperId', '==', likedUserId),
      where('swipedUserId', '==', swiperId),
      where('action', '==', 'like'),
      limit(1)
    );
    const reverseSwipeSnapshot = await getDocs(reverseSwipeQuery);

    if (!reverseSwipeSnapshot.empty) {
      // Mutual like! Create a match.
      const matchId = getMatchDocId(swiperId, likedUserId);
      const matchDocRef = doc(db, 'matches', matchId);

      // Check if match already exists to prevent duplicates (though sorted ID should handle this)
      const matchDocSnap = await getDoc(matchDocRef);
      if (matchDocSnap.exists()) {
        console.log("Match already exists:", matchId);
        // Optionally, fetch and return profile if needed, or handle as "already matched"
        const likedUserProfileSnap = await getDoc(doc(db, 'users', likedUserId));
        return likedUserProfileSnap.exists() ? ({ uid: likedUserId, ...likedUserProfileSnap.data() } as UserProfile) : null;
      }
      
      const batch = writeBatch(db);
      batch.set(matchDocRef, {
        users: [swiperId, likedUserId].sort(), // Store sorted UIDs
        timestamp: serverTimestamp(),
      });
      await batch.commit();

      // Fetch the profile of the matched user to return
      const likedUserProfileSnap = await getDoc(doc(db, 'users', likedUserId));
      if (likedUserProfileSnap.exists()) {
        return { uid: likedUserId, ...likedUserProfileSnap.data() } as UserProfile;
      }
    }
    return null; // No mutual like found
  } catch (error) {
    console.error("Error checking for or creating match:", error);
    throw error; // Re-throw to be handled by the caller
  }
}

// Placeholder for fetching user profiles (already in use in other parts of the app)
// For example, in /app/(main)/explore/page.tsx
// You might need a dedicated function if you want to fetch multiple specific profiles by ID.
import { addDoc } from 'firebase/firestore'; // Ensure addDoc is imported
