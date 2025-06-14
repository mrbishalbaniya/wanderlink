
import type { Timestamp, FieldValue } from 'firebase/firestore';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type PostCategory = 'hiking' | 'city' | 'beach' | 'food' | 'culture' | 'nature' | 'other';
export type TripStatus = 'upcoming' | 'in-progress' | 'completed' | 'cancelled' | 'planning'; // Added 'planning'

export interface Post {
  id: string;
  userId: string;
  user?: UserProfile; 
  title: string;
  caption: string; 
  coordinates: Coordinates;
  locationLabel?: string; 
  category: PostCategory;
  images: string[];
  createdAt: Timestamp | Date; 
  likes: string[]; 
  savedBy?: string[]; 
  commentCount?: number;

  // Trip-specific fields
  tripStatus?: TripStatus;
  tripStartDate?: Timestamp | Date | null;
  tripEndDate?: Timestamp | Date | null;
  participants?: string[]; // Array of user UIDs
  packingList?: string; // Simple text or markdown

  // Client-side processed dates
  createdAtDate?: Date; 
  tripStartDateDate?: Date | null;
  tripEndDateDate?: Date | null;
}

export type Gender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | '';
export type InterestedIn = 'men' | 'women' | 'everyone' | '';
export type TravelStyle = 'adventure' | 'budget' | 'luxury' | 'solo' | 'group' | 'family' | 'business' | 'other' | '';
export type TransportMode = 'flight' | 'train' | 'car' | 'bus' | 'bicycle' | 'boat' | 'other' | '';
export type LookingFor = 'friendship' | 'travel-buddy' | 'dating' | 'long-term-relationship' | ''; // Can be an array
export type ExpensePreference = 'yes' | 'no' | 'depends' | '';
export type SimplePreference = 'yes' | 'no' | 'ask' | '';


export interface UserProfile {
  uid: string;
  email: string; 

  name: string; 
  username?: string; 
  avatar: string; 
  dateOfBirth?: Timestamp | Date | null; 
  gender?: Gender;
  interestedIn?: InterestedIn[]; 
  bio?: string; 

  phoneNumber?: string;
  socialMediaLinks?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
    website?: string;
  };
  emailVerified?: boolean; 
  phoneVerified?: boolean; 

  travelStyles?: TravelStyle[]; 
  favoriteDestinations?: string[]; 
  bucketList?: string[]; 
  preferredTransportModes?: TransportMode[];
  travelFrequency?: string; 
  travelAvailability?: string; 
  travelBudgetRange?: string; 

  interests?: string[]; 
  languagesSpoken?: string[]; 
  musicPreferences?: string[];
  moviePreferences?: string[];
  bookPreferences?: string[];

  currentLocation?: {
    address?: string; 
    coordinates?: Coordinates; 
  };
  willingToTravelTo?: string[]; 
  maxTravelDistance?: number; 

  matchPreferences?: {
    ageRange?: { min: number; max: number } | null; 
    genderPreference?: InterestedIn[] | null; 
    lookingFor?: LookingFor[] | null; 
    smokingPreference?: SimplePreference | null;
    drinkingPreference?: SimplePreference | null;
    petFriendly?: boolean | null;
    expensesPreference?: ExpensePreference | null;
  };

  idVerificationImageUrl?: string | null; 
  isIdVerified?: boolean; 
  emergencyContact?: {
    name?: string | null;
    phone?: string | null;
    relationship?: string | null;
  };
  
  profileCompletionScore?: number; 

  joinedAt: Timestamp | FieldValue;
  lastUpdated?: Timestamp | FieldValue | null; 

  joinedAtDate?: Date;
  dateOfBirthDate?: Date | null;
  lastUpdatedDate?: Date | null;
}


export type SwipeAction = 'like' | 'skip';

export interface SwipeData {
  id?: string; 
  swiperId: string;
  swipedUserId: string;
  action: SwipeAction;
  timestamp: FieldValue;
}

export interface MatchData {
  id?: string; 
  users: [string, string]; 
  timestamp: FieldValue;
  chatId?: string; 
}

