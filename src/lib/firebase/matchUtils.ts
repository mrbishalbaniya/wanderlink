
'use server';

import { db } from '@/lib/firebase';
import type { UserProfile, SwipeAction, Coordinates } from '@/types';
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
  addDoc,
} from 'firebase/firestore';

const PROFILES_PER_FETCH = 10;
const PROFILES_FETCH_MULTIPLIER_FOR_RADIUS_FILTER = 3; // Fetch more if radius filtering

// Helper function to get a sorted match ID
const getMatchDocId = (uid1: string, uid2: string): string => {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};

// --- Haversine Distance Calculation ---
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
// --- End Haversine Distance Calculation ---

/**
 * Fetches potential users to swipe.
 */
export async function getUsersToSwipe(
  currentUserId: string,
  lastFetchedUserSnap: QueryDocumentSnapshot | null,
  currentUserCoordinates?: Coordinates,
  searchRadiusKm?: number
): Promise<{profiles: UserProfile[], newLastFetchedUserSnap: QueryDocumentSnapshot | null}> {
  try {
    const swipesQuery = query(collection(db, 'swipes'), where('swiperId', '==', currentUserId));
    const swipesSnapshot = await getDocs(swipesQuery);
    const swipedUserIds = swipesSnapshot.docs.map(doc => doc.data().swipedUserId);

    const matchesQuery = query(collection(db, 'matches'), where('users', 'array-contains', currentUserId));
    const matchesSnapshot = await getDocs(matchesQuery);
    const matchedUserIds = matchesSnapshot.docs.flatMap(doc => doc.data().users).filter(uid => uid !== currentUserId);
    
    const excludedUserIds = new Set([currentUserId, ...swipedUserIds, ...matchedUserIds]);
    
    let usersQuery;
    const usersCollectionRef = collection(db, 'users');
    
    // Determine fetch limit: fetch more if radius filter is active to get enough results after client-side filtering
    const fetchLimit = (currentUserCoordinates && searchRadiusKm) 
        ? PROFILES_PER_FETCH * PROFILES_FETCH_MULTIPLIER_FOR_RADIUS_FILTER 
        : PROFILES_PER_FETCH;

    if (excludedUserIds.size > 0 && excludedUserIds.size <= 30) { // Firestore 'not-in' limit is 30 in v9+
        usersQuery = query(
            usersCollectionRef,
            where('uid', 'not-in', Array.from(excludedUserIds)),
            orderBy('uid'), 
            ...(lastFetchedUserSnap ? [startAfter(lastFetchedUserSnap)] : []),
            limit(fetchLimit)
        );
    } else {
        usersQuery = query(
            usersCollectionRef,
            where('uid', '!=', currentUserId), 
            orderBy('uid'),
            ...(lastFetchedUserSnap ? [startAfter(lastFetchedUserSnap)] : []),
            limit(fetchLimit) 
        );
    }
    
    const usersSnapshot = await getDocs(usersQuery);
    
    let fetchedProfiles: UserProfile[] = usersSnapshot.docs
      .map(doc => {
          const data = doc.data();
          const profile: UserProfile = { 
            uid: doc.id, // Use doc.id as uid if 'uid' field isn't explicitly set (though it should be)
            ...data,
            // Ensure date fields are converted if necessary (though this should ideally happen in AuthContext or when data is set)
            dateOfBirthDate: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : data.dateOfBirth,
            joinedAtDate: data.joinedAt?.toDate ? data.joinedAt.toDate() : data.joinedAt,
           } as UserProfile;
          return profile;
      })
      .filter(profile => !excludedUserIds.has(profile.uid)); // Ensure final exclusion

    let profilesToReturn: UserProfile[] = [];

    if (currentUserCoordinates && searchRadiusKm && searchRadiusKm > 0) {
      profilesToReturn = fetchedProfiles.filter(profile => {
        if (!profile.currentLocation?.coordinates) return false; // Skip profiles without location
        const distance = getDistanceFromLatLonInKm(
          currentUserCoordinates.latitude,
          currentUserCoordinates.longitude,
          profile.currentLocation.coordinates.latitude,
          profile.currentLocation.coordinates.longitude
        );
        return distance <= searchRadiusKm;
      });
    } else {
      profilesToReturn = fetchedProfiles;
    }
    
    // Ensure we don't return more than PROFILES_PER_FETCH, even if radius filter fetched more
    if (profilesToReturn.length > PROFILES_PER_FETCH) {
        profilesToReturn = profilesToReturn.slice(0, PROFILES_PER_FETCH);
    }
    
    // The newLastFetchedUserSnap should be from the original unfiltered fetch,
    // to ensure pagination continues correctly over the whole dataset.
    const newLastSnap = usersSnapshot.docs.length > 0 ? usersSnapshot.docs[usersSnapshot.docs.length - 1] : null;

    return { profiles: profilesToReturn, newLastFetchedUserSnap: newLastSnap };

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
    await addDoc(collection(db, 'swipes'), swipeData);
  } catch (error) {
    console.error("Error recording swipe:", error);
    throw error;
  }
}

/**
 * Checks if a mutual like exists and creates a match document.
 */
export async function checkForAndCreateMatch(swiperId: string, likedUserId: string): Promise<UserProfile | null> {
  try {
    const reverseSwipeQuery = query(
      collection(db, 'swipes'),
      where('swiperId', '==', likedUserId),
      where('swipedUserId', '==', swiperId),
      where('action', '==', 'like'),
      limit(1)
    );
    const reverseSwipeSnapshot = await getDocs(reverseSwipeQuery);

    if (!reverseSwipeSnapshot.empty) {
      const matchId = getMatchDocId(swiperId, likedUserId);
      const matchDocRef = doc(db, 'matches', matchId);
      const matchDocSnap = await getDoc(matchDocRef);

      if (matchDocSnap.exists()) {
        console.log("Match already exists:", matchId);
        const likedUserProfileSnap = await getDoc(doc(db, 'users', likedUserId));
        return likedUserProfileSnap.exists() ? ({ uid: likedUserId, ...likedUserProfileSnap.data() } as UserProfile) : null;
      }
      
      const batch = writeBatch(db);
      batch.set(matchDocRef, {
        users: [swiperId, likedUserId].sort(), 
        timestamp: serverTimestamp(),
      });
      await batch.commit();

      const likedUserProfileSnap = await getDoc(doc(db, 'users', likedUserId));
      if (likedUserProfileSnap.exists()) {
        const data = likedUserProfileSnap.data();
        return { 
            uid: likedUserId, 
            ...data,
            dateOfBirthDate: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : data.dateOfBirth,
            joinedAtDate: data.joinedAt?.toDate ? data.joinedAt.toDate() : data.joinedAt,
        } as UserProfile;
      }
    }
    return null;
  } catch (error) {
    console.error("Error checking for or creating match:", error);
    throw error; 
  }
}
