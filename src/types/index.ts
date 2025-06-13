
import type { Timestamp, FieldValue } from 'firebase/firestore';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type PostCategory = 'hiking' | 'city' | 'beach' | 'food' | 'culture' | 'nature' | 'other';

export interface Post {
  id: string;
  userId: string;
  user?: UserProfile; // Optionally populated
  title: string;
  description: string;
  coordinates: Coordinates;
  category: PostCategory;
  images: string[];
  createdAt: Timestamp | Date; // Firestore timestamp or Date object for optimistic updates
  likes: string[]; // Array of user IDs
  // For client-side display, convert Timestamp to Date
  createdAtDate?: Date; 
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string; // Added bio field
  joinedAt: Timestamp | FieldValue;
  interests?: string[]; // Added interests field
   // For client-side display, convert Timestamp to Date
  joinedAtDate?: Date;
}

export type SwipeAction = 'like' | 'skip';

export interface SwipeData {
  id?: string; // Optional, if you want to store doc ID on the object
  swiperId: string;
  swipedUserId: string;
  action: SwipeAction;
  timestamp: FieldValue;
}

export interface MatchData {
  id?: string; // Optional, like concatenated UIDs
  users: [string, string]; // Array of two user UIDs
  timestamp: FieldValue;
  chatId?: string; // Optional for future chat integration
}
