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
  joinedAt: Timestamp | FieldValue;
   // For client-side display, convert Timestamp to Date
  joinedAtDate?: Date;
}
