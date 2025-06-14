
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Camera, CalendarIcon, MapPin, UploadCloud, ShieldCheck, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { UserProfile, Gender, InterestedIn, TravelStyle, TransportMode, LookingFor, ExpensePreference, SimplePreference, Coordinates } from '@/types';
import InteractiveMap from '@/components/map/InteractiveMap';
import type { LatLng, LatLngTuple } from 'leaflet';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Image from 'next/image';

const MAX_IMAGE_SIZE_MB = 5;

const socialPlatforms = [
  { id: 'instagram', name: 'Instagram', placeholder: 'your_nepali_travelgram' },
  { id: 'linkedin', name: 'LinkedIn', placeholder: 'your_linkedin_profile_url' },
  { id: 'twitter', name: 'Twitter/X', placeholder: 'your_twitter_handle' },
  { id: 'facebook', name: 'Facebook', placeholder: 'your_facebook_profile_url' },
  { id: 'tiktok', name: 'TikTok', placeholder: 'your_tiktok_username_nepal' },
  { id: 'website', name: 'Personal Website', placeholder: 'https://yourwebsite.com.np' },
];

const lookingForOptions: { id: LookingFor; label: string }[] = [
    { id: 'friendship', label: 'Friendship' },
    { id: 'travel-buddy', label: 'Travel Buddy' },
    { id: 'dating', label: 'Casual Dating' },
    { id: 'long-term-relationship', label: 'Long-Term Relationship' },
].filter(option => option.id !== '');


const stringToArray = (str: string | undefined): string[] => str ? str.split(',').map(s => s.trim()).filter(s => s) : [];
const arrayToString = (arr: string[] | undefined): string => arr ? arr.join(', ') : '';

const profileSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters.'),
  username: z.string().min(3, 'Username must be at least 3 characters.').regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores.').optional().or(z.literal('')),
  dateOfBirth: z.date().optional().nullable(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say', '']).optional(),
  interestedIn: z.array(z.enum(['men', 'women', 'everyone'])).optional(),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters.').optional(),
  phoneNumber: z.string().optional().or(z.literal('')),
  socialMediaLinks: z.object({
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    tiktok: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  travelStyles: z.array(z.enum(['adventure', 'budget', 'luxury', 'solo', 'group', 'family', 'business', 'other', ''])).optional(),
  favoriteDestinations: z.string().optional(),
  bucketList: z.string().optional(),
  preferredTransportModes: z.array(z.enum(['flight', 'train', 'car', 'bus', 'bicycle', 'boat', 'other', ''])).optional(),
  travelFrequency: z.string().optional(),
  travelAvailability: z.string().optional(),
  travelBudgetRange: z.string().optional(),
  interests: z.string().optional(),
  languagesSpoken: z.string().optional(),
  musicPreferences: z.string().optional(),
  moviePreferences: z.string().optional(),
  bookPreferences: z.string().optional(),
  currentLocationAddress: z.string().optional(),
  willingToTravelTo: z.string().optional(),
  maxTravelDistance: z.number().min(0).max(10000).optional().nullable(),
  matchPreferences_ageRange: z.array(z.number()).length(2).optional().nullable(),
  matchPreferences_genderPreference: z.array(z.enum(['men', 'women', 'everyone'])).optional(),
  matchPreferences_lookingFor: z.array(z.enum(['friendship', 'travel-buddy', 'dating', 'long-term-relationship', ''])).optional(),
  matchPreferences_smokingPreference: z.enum(['yes', 'no', 'ask', '']).optional(),
  matchPreferences_drinkingPreference: z.enum(['yes', 'no', 'ask', '']).optional(),
  matchPreferences_petFriendly: z.boolean().optional().nullable(),
  matchPreferences_expensesPreference: z.enum(['yes', 'no', 'depends', '']).optional(),
  emergencyContact_name: z.string().optional(),
  emergencyContact_phone: z.string().optional(),
  emergencyContact_relationship: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const genderOptions: Exclude<Gender, ''>[] = ['male', 'female', 'non-binary', 'prefer-not-to-say'];
const interestedInOptions: Exclude<InterestedIn, ''>[] = ['men', 'women', 'everyone'];
const travelStyleOptions: Exclude<TravelStyle, ''>[] = ['adventure', 'budget', 'luxury', 'solo', 'group', 'family', 'business', 'other'];
const transportModeOptions: Exclude<TransportMode, ''>[] = ['flight', 'train', 'car', 'bus', 'bicycle', 'boat', 'other'];
const travelFrequencyOptions = ['Multiple times a year', 'Once a year', 'Every few years', 'Rarely but open to it'];
const travelBudgetOptions = ['$ - Shoestring/Backpacker', '$$ - Budget Traveler', '$$$ - Mid-Range Comfort', '$$$$ - Luxury Seeker', '$$$$$ - Ultra Luxury'];
const simplePreferenceOptions: Exclude<SimplePreference, ''>[] = ['yes', 'no', 'ask'];
const expensePreferenceOptions: Exclude<ExpensePreference, ''>[] = ['yes', 'no', 'depends'];


export default function EditProfilePage() {
  const { currentUser, userProfile, loading: authLoading, setUserProfile: updateAuthProviderProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [idVerificationFile, setIdVerificationFile] = useState<File | null>(null);
  const [idVerificationPreview, setIdVerificationPreview] = useState<string | null>(null);
  
  const [currentLocationCoords, setCurrentLocationCoords] = useState<LatLngTuple | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);

  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      username: '',
      dateOfBirth: null,
      gender: '',
      interestedIn: [],
      bio: '',
      phoneNumber: '',
      socialMediaLinks: { instagram: '', linkedin: '', twitter: '', facebook: '', tiktok: '', website: '' },
      travelStyles: [],
      favoriteDestinations: '',
      bucketList: '',
      preferredTransportModes: [],
      travelFrequency: '',
      travelAvailability: '',
      travelBudgetRange: '',
      interests: '',
      languagesSpoken: '',
      musicPreferences: '',
      moviePreferences: '',
      bookPreferences: '',
      currentLocationAddress: '',
      willingToTravelTo: '',
      maxTravelDistance: 500,
      matchPreferences_ageRange: [18, 99],
      matchPreferences_genderPreference: [],
      matchPreferences_lookingFor: [],
      matchPreferences_smokingPreference: '',
      matchPreferences_drinkingPreference: '',
      matchPreferences_petFriendly: false,
      matchPreferences_expensesPreference: '',
      emergencyContact_name: '',
      emergencyContact_phone: '',
      emergencyContact_relationship: '',
    },
  });
  
  const calculateProfileCompletion = useCallback((profileDataForCalc: Partial<ProfileFormData>, currentProfile: UserProfile | null): number => {
    if (!currentProfile && !Object.keys(profileDataForCalc).length) return 0;
    
    const dataToUse = { ...currentProfile, ...profileDataForCalc };

    const fields = [
      dataToUse.name,
      dataToUse.username,
      avatarPreview || dataToUse.avatar,
      dataToUse.dateOfBirth || dataToUse.dateOfBirthDate,
      dataToUse.gender,
      Array.isArray(dataToUse.interestedIn) && dataToUse.interestedIn.length > 0,
      dataToUse.bio,
      dataToUse.phoneNumber,
      Array.isArray(dataToUse.travelStyles) && dataToUse.travelStyles.length > 0,
      stringToArray(dataToUse.favoriteDestinations).length > 0,
      stringToArray(dataToUse.bucketList).length > 0,
      stringToArray(dataToUse.interests).length > 0,
      stringToArray(dataToUse.languagesSpoken).length > 0,
      dataToUse.currentLocationAddress || dataToUse.currentLocation?.address,
      dataToUse.matchPreferences_ageRange || dataToUse.matchPreferences?.ageRange,
      Array.isArray(dataToUse.matchPreferences_lookingFor) && dataToUse.matchPreferences_lookingFor.length > 0,
    ];
    const filledFields = fields.filter(field => {
      if (typeof field === 'string') return field.trim() !== '';
      if (typeof field === 'number') return field > 0; // For counts or distances
      if (typeof field === 'boolean') return field === true; // For checkbox-like values
      return !!field; // For dates, objects, arrays (existence)
    }).length;
    return Math.min(100, Math.round((filledFields / fields.length) * 100) + 10); // Base 10% for joining
  }, [avatarPreview]);


  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    if (userProfile) {
      const currentSocials = userProfile.socialMediaLinks;
      const initialFormValues = {
        name: userProfile.name || '',
        username: userProfile.username || '',
        dateOfBirth: userProfile.dateOfBirthDate || null,
        gender: userProfile.gender || '',
        interestedIn: userProfile.interestedIn || [],
        bio: userProfile.bio || '',
        phoneNumber: userProfile.phoneNumber || '',
        socialMediaLinks: {
          instagram: currentSocials?.instagram || '',
          linkedin: currentSocials?.linkedin || '',
          twitter: currentSocials?.twitter || '',
          facebook: currentSocials?.facebook || '',
          tiktok: currentSocials?.tiktok || '',
          website: currentSocials?.website || '',
        },
        travelStyles: userProfile.travelStyles || [],
        favoriteDestinations: arrayToString(userProfile.favoriteDestinations),
        bucketList: arrayToString(userProfile.bucketList),
        preferredTransportModes: userProfile.preferredTransportModes || [],
        travelFrequency: userProfile.travelFrequency || '',
        travelAvailability: userProfile.travelAvailability || '',
        travelBudgetRange: userProfile.travelBudgetRange || '',
        interests: arrayToString(userProfile.interests),
        languagesSpoken: arrayToString(userProfile.languagesSpoken),
        musicPreferences: arrayToString(userProfile.musicPreferences),
        moviePreferences: arrayToString(userProfile.moviePreferences),
        bookPreferences: arrayToString(userProfile.bookPreferences),
        currentLocationAddress: userProfile.currentLocation?.address || '',
        willingToTravelTo: arrayToString(userProfile.willingToTravelTo),
        maxTravelDistance: userProfile.maxTravelDistance ?? 500,
        matchPreferences_ageRange: userProfile.matchPreferences?.ageRange ? [userProfile.matchPreferences.ageRange.min, userProfile.matchPreferences.ageRange.max] : [18, 99],
        matchPreferences_genderPreference: userProfile.matchPreferences?.genderPreference || [],
        matchPreferences_lookingFor: userProfile.matchPreferences?.lookingFor || [],
        matchPreferences_smokingPreference: userProfile.matchPreferences?.smokingPreference || '',
        matchPreferences_drinkingPreference: userProfile.matchPreferences?.drinkingPreference || '',
        matchPreferences_petFriendly: userProfile.matchPreferences?.petFriendly ?? false,
        matchPreferences_expensesPreference: userProfile.matchPreferences?.expensesPreference || '',
        emergencyContact_name: userProfile.emergencyContact?.name || '',
        emergencyContact_phone: userProfile.emergencyContact?.phone || '',
        emergencyContact_relationship: userProfile.emergencyContact?.relationship || '',
      };
      form.reset(initialFormValues);
      setAvatarPreview(userProfile.avatar);
      setIdVerificationPreview(userProfile.idVerificationImageUrl || null);
      if (userProfile.currentLocation?.coordinates) {
        setCurrentLocationCoords([userProfile.currentLocation.coordinates.latitude, userProfile.currentLocation.coordinates.longitude]);
      }
      setProfileCompletion(userProfile.profileCompletionScore || calculateProfileCompletion(initialFormValues, userProfile));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, form.reset]);


  useEffect(() => {
    const subscription = form.watch((value) => {
        setProfileCompletion(calculateProfileCompletion(value as Partial<ProfileFormData>, userProfile));
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch, userProfile, calculateProfileCompletion]);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'id') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          toast({ title: "File Too Large", description: `${file.name} exceeds ${MAX_IMAGE_SIZE_MB}MB.`, variant: "destructive" });
          return;
      }
      if (type === 'avatar') {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      } else if (type === 'id') {
        setIdVerificationFile(file);
        setIdVerificationPreview(URL.createObjectURL(file));
      }
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error("Cloudinary configuration is missing.");
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await response.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || 'Cloudinary upload failed');
  };

  const handleMapClick = useCallback((latlng: LatLng) => {
    setCurrentLocationCoords([latlng.lat, latlng.lng]);
  }, []);


  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!currentUser || !userProfile) return;
    setIsUpdating(true);

    try {
      let newAvatarUrl = userProfile.avatar;
      if (avatarFile) {
        newAvatarUrl = await uploadImageToCloudinary(avatarFile);
      }

      let newIdVerificationUrl = userProfile.idVerificationImageUrl;
      if (idVerificationFile) {
        newIdVerificationUrl = await uploadImageToCloudinary(idVerificationFile);
      }
      
      const dobTimestamp = data.dateOfBirth ? Timestamp.fromDate(data.dateOfBirth) : null;

      const baseProfileUpdate: Partial<UserProfile> = {
        name: data.name,
        username: data.username || null,
        avatar: newAvatarUrl,
        dateOfBirth: dobTimestamp,
        gender: data.gender || null,
        interestedIn: data.interestedIn?.length ? data.interestedIn : null,
        bio: data.bio || null,
        phoneNumber: data.phoneNumber || null,
        socialMediaLinks: {
          instagram: data.socialMediaLinks?.instagram || null,
          linkedin: data.socialMediaLinks?.linkedin || null,
          twitter: data.socialMediaLinks?.twitter || null,
          facebook: data.socialMediaLinks?.facebook || null,
          tiktok: data.socialMediaLinks?.tiktok || null,
          website: data.socialMediaLinks?.website || null,
        },
        travelStyles: data.travelStyles?.length ? data.travelStyles : null,
        favoriteDestinations: stringToArray(data.favoriteDestinations).length ? stringToArray(data.favoriteDestinations) : null,
        bucketList: stringToArray(data.bucketList).length ? stringToArray(data.bucketList) : null,
        preferredTransportModes: data.preferredTransportModes?.length ? data.preferredTransportModes : null,
        travelFrequency: data.travelFrequency || null,
        travelAvailability: data.travelAvailability || null,
        travelBudgetRange: data.travelBudgetRange || null,
        interests: stringToArray(data.interests).length ? stringToArray(data.interests) : null,
        languagesSpoken: stringToArray(data.languagesSpoken).length ? stringToArray(data.languagesSpoken) : null,
        musicPreferences: stringToArray(data.musicPreferences).length ? stringToArray(data.musicPreferences) : null,
        moviePreferences: stringToArray(data.moviePreferences).length ? stringToArray(data.moviePreferences) : null,
        bookPreferences: stringToArray(data.bookPreferences).length ? stringToArray(data.bookPreferences) : null,
        willingToTravelTo: stringToArray(data.willingToTravelTo).length ? stringToArray(data.willingToTravelTo) : null,
        maxTravelDistance: (data.maxTravelDistance !== undefined && data.maxTravelDistance !== null) ? data.maxTravelDistance : null,
        emergencyContact: {
          name: data.emergencyContact_name || null,
          phone: data.emergencyContact_phone || null,
          relationship: data.emergencyContact_relationship || null,
        },
        idVerificationImageUrl: newIdVerificationUrl || null,
        lastUpdated: serverTimestamp(),
      };

      let finalCurrentLocation: UserProfile['currentLocation'] | null = null;
      const formAddress = data.currentLocationAddress || '';
      if (formAddress || currentLocationCoords) {
          finalCurrentLocation = { address: formAddress };
          if (currentLocationCoords && typeof currentLocationCoords[0] === 'number' && typeof currentLocationCoords[1] === 'number') {
              finalCurrentLocation.coordinates = { latitude: currentLocationCoords[0], longitude: currentLocationCoords[1] };
          }
      }
      baseProfileUpdate.currentLocation = finalCurrentLocation;

      let finalMatchPreferences: UserProfile['matchPreferences'] | null = null;
      const {
        matchPreferences_ageRange, matchPreferences_genderPreference, matchPreferences_lookingFor,
        matchPreferences_smokingPreference, matchPreferences_drinkingPreference,
        matchPreferences_petFriendly, matchPreferences_expensesPreference
      } = data;

      if (matchPreferences_ageRange || matchPreferences_genderPreference?.length || matchPreferences_lookingFor?.length || matchPreferences_smokingPreference || matchPreferences_drinkingPreference || matchPreferences_petFriendly !== undefined || matchPreferences_expensesPreference) {
          finalMatchPreferences = {};
          if (matchPreferences_ageRange && matchPreferences_ageRange.length === 2) {
              finalMatchPreferences.ageRange = { min: matchPreferences_ageRange[0], max: matchPreferences_ageRange[1] };
          } else {
              finalMatchPreferences.ageRange = null; 
          }
          finalMatchPreferences.genderPreference = matchPreferences_genderPreference?.length ? matchPreferences_genderPreference : null;
          finalMatchPreferences.lookingFor = matchPreferences_lookingFor?.length ? matchPreferences_lookingFor : null;
          finalMatchPreferences.smokingPreference = matchPreferences_smokingPreference || null;
          finalMatchPreferences.drinkingPreference = matchPreferences_drinkingPreference || null;
          finalMatchPreferences.petFriendly = (matchPreferences_petFriendly !== undefined && matchPreferences_petFriendly !== null) ? matchPreferences_petFriendly : null;
          finalMatchPreferences.expensesPreference = matchPreferences_expensesPreference || null;
      }
      baseProfileUpdate.matchPreferences = finalMatchPreferences;
      
      baseProfileUpdate.profileCompletionScore = calculateProfileCompletion(data, userProfile);

      const finalUpdateData: Record<string, any> = {};
      for (const [key, value] of Object.entries(baseProfileUpdate)) {
          if (value !== undefined) {
              finalUpdateData[key] = value;
          }
      }

      await updateAuthProfile(currentUser, { displayName: data.name, photoURL: newAvatarUrl });
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, finalUpdateData);
      
      if (typeof updateAuthProviderProfile === 'function') {
        const fullyUpdatedProfile = { 
            ...userProfile, 
            ...finalUpdateData, 
            dateOfBirthDate: data.dateOfBirth, 
            lastUpdatedDate: new Date(),
            interestedIn: finalUpdateData.interestedIn === null ? [] : finalUpdateData.interestedIn,
            travelStyles: finalUpdateData.travelStyles === null ? [] : finalUpdateData.travelStyles,
            favoriteDestinations: finalUpdateData.favoriteDestinations === null ? [] : finalUpdateData.favoriteDestinations,
            bucketList: finalUpdateData.bucketList === null ? [] : finalUpdateData.bucketList,
            preferredTransportModes: finalUpdateData.preferredTransportModes === null ? [] : finalUpdateData.preferredTransportModes,
            interests: finalUpdateData.interests === null ? [] : finalUpdateData.interests,
            languagesSpoken: finalUpdateData.languagesSpoken === null ? [] : finalUpdateData.languagesSpoken,
            musicPreferences: finalUpdateData.musicPreferences === null ? [] : finalUpdateData.musicPreferences,
            moviePreferences: finalUpdateData.moviePreferences === null ? [] : finalUpdateData.moviePreferences,
            bookPreferences: finalUpdateData.bookPreferences === null ? [] : finalUpdateData.bookPreferences,
            willingToTravelTo: finalUpdateData.willingToTravelTo === null ? [] : finalUpdateData.willingToTravelTo,
            matchPreferences: finalMatchPreferences ? {
              ...finalMatchPreferences,
              genderPreference: finalMatchPreferences.genderPreference === null ? [] : finalMatchPreferences.genderPreference,
              lookingFor: finalMatchPreferences.lookingFor === null ? [] : finalMatchPreferences.lookingFor,
            } : null,
        } as UserProfile;
        updateAuthProviderProfile(fullyUpdatedProfile);
      }
      setAvatarFile(null);
      setIdVerificationFile(null);

      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.', className: 'bg-accent text-accent-foreground' });
      router.push('/profile');
    } catch (error: any) {
      toast({ title: 'Update Failed', description: error.message || 'Could not update profile.', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || !userProfile) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <p className="text-lg text-muted-foreground">Please log in to edit your profile.</p>
        <Button onClick={() => router.push('/login')} className="mt-6">Login</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 md:py-12">
      <Card className="max-w-3xl mx-auto glassmorphic-card shadow-soft-xl">
        <CardHeader className="text-center pb-6 border-b border-border/30">
          <CardTitle className="font-headline text-4xl text-primary mb-2">Edit Your Profile</CardTitle>
          <CardDescription className="text-base text-muted-foreground">Keep your information up-to-date to find the best travel matches!</CardDescription>
          <div className="pt-4">
            <Label className="text-sm font-medium text-foreground/80">Profile Completion</Label>
            <Progress value={profileCompletion} className="w-full h-2.5 mt-1" />
            <p className="text-xs text-muted-foreground text-right mt-1">{profileCompletion}% Complete</p>
            {profileCompletion < 70 && (
                 <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 text-center flex items-center justify-center">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> 
                    Complete your profile (70%+) to unlock all features like matching.
                </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              
              <Card className="bg-card/80 dark:bg-card/70 shadow-md">
                <CardHeader><CardTitle className="text-2xl font-headline text-primary">🧍 Basic Information</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                      <Avatar className="h-36 w-36 border-4 border-primary/70 shadow-lg">
                        <AvatarImage src={avatarPreview || userProfile.avatar} alt={userProfile.name} data-ai-hint="person portrait"/>
                        <AvatarFallback className="text-5xl bg-muted text-muted-foreground">{userProfile.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <label htmlFor="avatarUpload" className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                        <Camera size={40} />
                        <input id="avatarUpload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Sita Sharma" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="username" render={({ field }) => (
                    <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="e.g., nepal_explorer_88" {...field} /></FormControl><FormDescription>Lowercase letters, numbers, and underscores only.</FormDescription><FormMessage /></FormItem>
                  )} />
                 <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date of Birth</FormLabel>
                      <Popover><PopoverTrigger asChild>
                          <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} captionLayout="dropdown-buttons" fromYear={1920} toYear={new Date().getFullYear() - 18} disabled={(date) => date > new Date(new Date().setFullYear(new Date().getFullYear() - 18)) || date < new Date("1920-01-01") } initialFocus /></PopoverContent>
                      </Popover><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select your gender" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {genderOptions.map(g => <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>)}
                        </SelectContent></Select><FormMessage /></FormItem>
                  )} />
                   <Controller control={form.control} name="interestedIn" render={({ field }) => (
                    <FormItem><FormLabel>Interested In</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                        {interestedInOptions.map((item) => (
                          <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                                  return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((value) => value !== item));
                                }} />
                            </FormControl>
                            <FormLabel className="font-normal">{item.charAt(0).toUpperCase() + item.slice(1)}</FormLabel>
                          </FormItem>
                        ))}
                      </div><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem><FormLabel>Bio / About Me</FormLabel><FormControl><Textarea placeholder="Namaste! I love trekking in the Himalayas and exploring ancient temples. Looking for travel buddies for my next adventure to Mustang!" {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card className="bg-card/80 dark:bg-card/70 shadow-md">
                <CardHeader><CardTitle className="text-2xl font-headline text-primary">📞 Contact & Verification</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <FormItem><FormLabel>Email Address</FormLabel><Input type="email" value={userProfile.email} disabled className="cursor-not-allowed bg-muted/60" /><FormDescription>Your email is used for login and cannot be changed here.</FormDescription></FormItem>
                  <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number (Optional)</FormLabel><FormControl><Input type="tel" placeholder="+977 98********" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <div>
                    <Label className="text-md font-medium text-foreground/90 mb-2 block">Social Media Links (Optional)</Label>
                    <div className="space-y-4">
                      {socialPlatforms.map(platform => (
                        <FormField key={platform.id} control={form.control} name={`socialMediaLinks.${platform.id as keyof ProfileFormData['socialMediaLinks']}`} render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor={`social-${platform.id}`}>{platform.name}</FormLabel>
                            <FormControl>
                              <Input id={`social-${platform.id}`} placeholder={platform.placeholder} {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/80 dark:bg-card/70 shadow-md">
                <CardHeader><CardTitle className="text-2xl font-headline text-primary">🧳 Travel Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <Controller control={form.control} name="travelStyles" render={({ field }) => (
                    <FormItem><FormLabel>Travel Styles</FormLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                        {travelStyleOptions.map((item) => (
                          <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                                  return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((value) => value !== item));
                                }} />
                            </FormControl>
                            <FormLabel className="font-normal">{item.charAt(0).toUpperCase() + item.slice(1)}</FormLabel>
                          </FormItem>
                        ))}
                      </div><FormDescription>Select one or more styles that best describe you.</FormDescription><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="favoriteDestinations" render={({ field }) => (
                    <FormItem><FormLabel>Favorite Destinations</FormLabel><FormControl><Textarea placeholder="e.g., Pokhara, Chitwan National Park, Lumbini" {...field} rows={3} /></FormControl><FormDescription>Comma-separated list.</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="bucketList" render={({ field }) => (
                    <FormItem><FormLabel>Bucket List Destinations</FormLabel><FormControl><Textarea placeholder="e.g., Everest Base Camp Trek, Rara Lake, Upper Mustang" {...field} rows={3} /></FormControl><FormDescription>Comma-separated list.</FormDescription><FormMessage /></FormItem>
                  )} />
                   <Controller control={form.control} name="preferredTransportModes" render={({ field }) => (
                    <FormItem><FormLabel>Preferred Transport Modes</FormLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                        {transportModeOptions.map((item) => (
                          <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                                  return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((value) => value !== item));
                                }} />
                            </FormControl>
                            <FormLabel className="font-normal">{item.charAt(0).toUpperCase() + item.slice(1)}</FormLabel>
                          </FormItem>
                        ))}
                      </div><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="travelFrequency" render={({ field }) => (
                    <FormItem><FormLabel>Travel Frequency</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="How often do you travel?" /></SelectTrigger></FormControl>
                        <SelectContent>{travelFrequencyOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="travelAvailability" render={({ field }) => (
                    <FormItem><FormLabel>Typical Travel Availability</FormLabel><FormControl><Input placeholder="e.g., Dashain holidays, Weekends, Tihar break" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="travelBudgetRange" render={({ field }) => (
                    <FormItem><FormLabel>Typical Travel Budget</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select your typical budget" /></SelectTrigger></FormControl>
                        <SelectContent>{travelBudgetOptions.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card className="bg-card/80 dark:bg-card/70 shadow-md">
                <CardHeader><CardTitle className="text-2xl font-headline text-primary">🎯 Interests & Hobbies</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="interests" render={({ field }) => (
                    <FormItem><FormLabel>General Interests</FormLabel><FormControl><Textarea placeholder="e.g., trekking, momo making, photography, cultural festivals" {...field} rows={3} /></FormControl><FormDescription>Comma-separated list of your interests.</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="languagesSpoken" render={({ field }) => (
                    <FormItem><FormLabel>Languages Spoken</FormLabel><FormControl><Textarea placeholder="e.g., Nepali, English, Hindi, Newari (basic)" {...field} rows={2} /></FormControl><FormDescription>Comma-separated list.</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="musicPreferences" render={({ field }) => (
                    <FormItem><FormLabel>Favorite Music Genres/Artists (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Nepali Folk, Sajjan Raj Vaidya, Rock" {...field} rows={2} /></FormControl><FormDescription>Comma-separated list.</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="moviePreferences" render={({ field }) => (
                    <FormItem><FormLabel>Favorite Movies/TV Shows (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Loot, Kalo Pothi, Nepali sitcoms" {...field} rows={2} /></FormControl><FormDescription>Comma-separated list.</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="bookPreferences" render={({ field }) => (
                    <FormItem><FormLabel>Favorite Books/Authors (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Palpasa Cafe, Parijat, Historical Nepali literature" {...field} rows={2} /></FormControl><FormDescription>Comma-separated list.</FormDescription><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card className="bg-card/80 dark:bg-card/70 shadow-md">
                <CardHeader><CardTitle className="text-2xl font-headline text-primary">📍 Location Information</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="currentLocationAddress" render={({ field }) => (
                    <FormItem><FormLabel>Current City/General Location</FormLabel><FormControl><Input placeholder="e.g., Kathmandu, Bagmati" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div>
                    <Label>Pinpoint on Map (Optional)</Label>
                    <InteractiveMap 
                        onMapClick={handleMapClick} 
                        selectedLocation={currentLocationCoords}
                        center={userProfile?.currentLocation?.coordinates ? [userProfile.currentLocation.coordinates.latitude, userProfile.currentLocation.coordinates.longitude] : [27.7172, 85.3240]} 
                        zoom={userProfile?.currentLocation?.coordinates ? 10 : 7} 
                        className="h-[250px] w-full mt-2 rounded-lg shadow-md"
                    />
                    {currentLocationCoords && <p className="text-xs text-muted-foreground mt-1">Selected: Lat: {currentLocationCoords[0].toFixed(4)}, Lng: {currentLocationCoords[1].toFixed(4)}</p>}
                  </div>
                  <FormField control={form.control} name="willingToTravelTo" render={({ field }) => (
                    <FormItem><FormLabel>Regions/Countries Willing To Travel To</FormLabel><FormControl><Textarea placeholder="e.g., All regions of Nepal, India, Tibet" {...field} rows={3} /></FormControl><FormDescription>Comma-separated list.</FormDescription><FormMessage /></FormItem>
                  )} />
                  <Controller control={form.control} name="maxTravelDistance" render={({ field }) => (
                    <FormItem><FormLabel>Max Travel Distance for Short Trips (km)</FormLabel>
                      <FormControl><Slider value={field.value ? [field.value] : [500]} max={10000} step={50} onValueChange={(value) => field.onChange(value[0])} /></FormControl>
                      <FormDescription>Current: {field.value ?? 500} km</FormDescription><FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card className="bg-card/80 dark:bg-card/70 shadow-md">
                <CardHeader><CardTitle className="text-2xl font-headline text-primary">❤️ Match Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                   <Controller control={form.control} name="matchPreferences_ageRange" render={({ field }) => (
                    <FormItem><FormLabel>Preferred Age Range</FormLabel>
                      <FormControl><Slider value={field.value || [18,99]} min={18} max={99} step={1} onValueChange={field.onChange} /></FormControl>
                      <FormDescription>Current: {field.value ? `${field.value[0]} - ${field.value[1]}` : "18 - 99"} years</FormDescription><FormMessage />
                    </FormItem>
                  )} />
                  <Controller control={form.control} name="matchPreferences_genderPreference" render={({ field }) => (
                    <FormItem><FormLabel>Interested in Matching With</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                        {interestedInOptions.map((item) => (
                          <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                                  return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((value) => value !== item));
                                }} />
                            </FormControl>
                            <FormLabel className="font-normal">{item.charAt(0).toUpperCase() + item.slice(1)}</FormLabel>
                          </FormItem>
                        ))}
                      </div><FormMessage />
                    </FormItem>
                  )} />
                  <Controller control={form.control} name="matchPreferences_lookingFor" render={({ field }) => (
                    <FormItem><FormLabel>Looking For</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {lookingForOptions.map((item) => (
                          <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                  return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id));
                                }}/>
                            </FormControl>
                            <FormLabel className="font-normal">{item.label}</FormLabel>
                          </FormItem>
                        ))}
                      </div><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="matchPreferences_smokingPreference" render={({ field }) => (
                    <FormItem><FormLabel>Smoking Preference (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger></FormControl>
                        <SelectContent>{simplePreferenceOptions.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="matchPreferences_drinkingPreference" render={({ field }) => (
                    <FormItem><FormLabel>Drinking Preference (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger></FormControl>
                        <SelectContent>{simplePreferenceOptions.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="matchPreferences_petFriendly" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-input/30"><div className="space-y-0.5">
                        <FormLabel>Are you pet-friendly for travel?</FormLabel>
                        <FormDescription>Do you mind traveling with or around pets?</FormDescription>
                      </div><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="matchPreferences_expensesPreference" render={({ field }) => (
                    <FormItem><FormLabel>Willing to Share Expenses (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger></FormControl>
                        <SelectContent>{expensePreferenceOptions.map(e => <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card className="bg-card/80 dark:bg-card/70 shadow-md">
                <CardHeader><CardTitle className="text-2xl font-headline text-primary">🔒 Safety & Trust</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="idUpload" className="text-md font-medium text-foreground/90">ID Verification (Optional)</Label>
                    <FormDescription>Upload a government-issued ID (e.g., Nagarikta) for verification. This helps build trust in the community. Your ID will be stored securely and not shared publicly.</FormDescription>
                    <div className="mt-2 flex items-center justify-center w-full">
                       <label htmlFor="idUpload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload ID</span> or drag & drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, PDF (MAX. {MAX_IMAGE_SIZE_MB}MB)</p>
                            </div>
                            <input id="idUpload" type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'id')} className="hidden" />
                        </label>
                    </div>
                    {idVerificationPreview && (
                      <div className="mt-2 text-center">
                        <p className="text-sm text-muted-foreground">Current ID preview:</p>
                        {idVerificationFile?.type.startsWith('image/') || (userProfile?.idVerificationImageUrl && !idVerificationFile && (userProfile.idVerificationImageUrl.includes('.png') || userProfile.idVerificationImageUrl.includes('.jpg') || userProfile.idVerificationImageUrl.includes('.jpeg'))) ? (
                           <Image src={idVerificationPreview} alt="ID Preview" width={200} height={120} className="rounded-md object-contain mx-auto mt-1 border" data-ai-hint="document id card"/>
                        ) : (
                           <a href={idVerificationPreview} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Uploaded ID (PDF or other)</a>
                        )}
                      </div>
                    )}
                    {userProfile.isIdVerified && <p className="mt-2 text-sm text-green-600 flex items-center justify-center"><ShieldCheck className="mr-1.5 h-4 w-4"/> Your ID is verified.</p>}
                  </div>
                  <FormField control={form.control} name="emergencyContact_name" render={({ field }) => (
                    <FormItem><FormLabel>Emergency Contact Name (Optional)</FormLabel><FormControl><Input placeholder="e.g., Ram Bahadur Thapa" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="emergencyContact_phone" render={({ field }) => (
                    <FormItem><FormLabel>Emergency Contact Phone (Optional)</FormLabel><FormControl><Input type="tel" placeholder="+977 98********" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="emergencyContact_relationship" render={({ field }) => (
                    <FormItem><FormLabel>Emergency Contact Relationship (Optional)</FormLabel><FormControl><Input placeholder="e.g., Daju, Bhai, Sathi" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              <Button type="submit" className="w-full text-lg py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isUpdating}>
                {isUpdating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Updating Profile...</> : 'Save All Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

