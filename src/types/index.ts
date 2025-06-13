
import type { Timestamp, FieldValue } from 'firebase/firestore';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type PostCategory = 'hiking' | 'city' | 'beach' | 'food' | 'culture' | 'nature' | 'other';

export interface Post {
  id: string;
  userId: string;
  user?: UserProfile; 
  title: string;
  description: string;
  coordinates: Coordinates;
  category: PostCategory;
  images: string[];
  createdAt: Timestamp | Date; 
  likes: string[]; 
  savedBy?: string[]; // Added for save/favorite feature
  createdAtDate?: Date; 
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
  email: string; // From Firebase Auth, non-editable by user directly on this form

  // Section 1: Basic Information
  name: string; // Full Name
  username?: string; // Unique, lowercase slug
  avatar: string; // Profile Photo URL (Cloudinary)
  dateOfBirth?: Timestamp | Date | null; // Store as Timestamp, handle as Date in form
  gender?: Gender;
  interestedIn?: InterestedIn[]; // Array for multi-select if needed, or single string
  bio?: string; // Short bio/about me

  // Section 2: Contact & Verification
  phoneNumber?: string;
  socialMediaLinks?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
    website?: string;
  };
  emailVerified?: boolean; // From Firebase Auth
  phoneVerified?: boolean; // Future implementation

  // Section 3: Travel Preferences
  travelStyles?: TravelStyle[]; // e.g., ['adventure', 'budget']
  favoriteDestinations?: string[]; // Tags or text
  bucketList?: string[]; // Tags or text
  preferredTransportModes?: TransportMode[];
  travelFrequency?: string; // e.g., "Once a year", "Multiple times a month"
  travelAvailability?: string; // e.g., "Weekends", "Summer"
  travelBudgetRange?: string; // e.g., "$ - Budget", "$$ - Mid-range", "$$$ - Luxury"

  // Section 4: Interests & Hobbies
  interests?: string[]; // General interests like "hiking", "photography"
  languagesSpoken?: string[]; // e.g., ["English", "Spanish"]
  musicPreferences?: string[];
  moviePreferences?: string[];
  bookPreferences?: string[];

  // Section 5: Location Information
  currentLocation?: {
    address?: string; // Full address string
    coordinates?: Coordinates; // Lat/Lng
  };
  willingToTravelTo?: string[]; // Regions or countries
  maxTravelDistance?: number; // In km or miles

  // Section 6: Match Preferences
  matchPreferences?: {
    ageRange?: { min: number; max: number } | null; // Made ageRange potentially null
    genderPreference?: InterestedIn[] | null; // Who they are looking for in matches
    lookingFor?: LookingFor[] | null; // e.g., ["friendship", "travel-buddy"]
    smokingPreference?: SimplePreference | null;
    drinkingPreference?: SimplePreference | null;
    petFriendly?: boolean | null;
    expensesPreference?: ExpensePreference | null;
  };

  // Section 7: Safety & Trust
  idVerificationImageUrl?: string | null; // URL of uploaded ID (Cloudinary)
  isIdVerified?: boolean; // Admin flag
  emergencyContact?: {
    name?: string | null;
    phone?: string | null;
    relationship?: string | null;
  };
  // tripHistory?: any[]; // Array of trip IDs or summary objects - derived data
  // reviewsReceived?: any[]; // Array of review IDs or summary objects - derived data
  verifiedTravelerBadge?: boolean; // Derived from profile completion, ID verification, etc.

  // Section 8: Profile Completion Score
  profileCompletionScore?: number; // Percentage 0-100

  // Timestamps
  joinedAt: Timestamp | FieldValue;
  lastUpdated?: Timestamp | FieldValue | null; // Make lastUpdated potentially null

  // For client-side display, convert Timestamp to Date
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
