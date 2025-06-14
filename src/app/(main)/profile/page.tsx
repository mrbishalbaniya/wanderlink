
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Edit3, MapPin, CalendarDays, Mail, Users, Heart, Sparkles, ShieldCheck, AlertTriangle, Briefcase, Languages,Palette, LocateFixed, Globe, Plane, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { UserProfile } from '@/types';
import Image from 'next/image';

const calculateProfileCompletion = (profile: UserProfile | null): number => {
  if (!profile) return 0;
  const fields = [
    profile.name, profile.username, profile.avatar, profile.dateOfBirth, profile.gender, 
    profile.interestedIn?.length, profile.bio, profile.phoneNumber,
    profile.travelStyles?.length, profile.favoriteDestinations?.length, profile.bucketList?.length,
    profile.interests?.length, profile.languagesSpoken?.length,
    profile.currentLocation?.address,
    profile.matchPreferences?.ageRange, profile.matchPreferences?.lookingFor?.length
  ];
  const filledFields = fields.filter(field => {
    if (typeof field === 'string') return field.trim() !== '';
    if (typeof field === 'number') return field > 0;
    return !!field;
  }).length;
  return Math.min(100, Math.round((filledFields / fields.length) * 100) + 10);
};

const ProfileDataItem: React.FC<{ icon: React.ElementType; label: string; value?: string | string[] | null | React.ReactNode; className?: string }> = ({ icon: Icon, label, value, className }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Array.isArray(value) ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {value.map((item, index) => <Badge key={index} variant="secondary">{item}</Badge>)}
          </div>
        ) : typeof value === 'string' ? (
          <p className="text-foreground">{value}</p>
        ) : (
          value
        )}
      </div>
    </div>
  );
};


export default function ViewProfilePage() {
  const { currentUser, userProfile, loading: authLoading } = useAuth();

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
        <p className="text-lg text-muted-foreground">Please log in to view your profile.</p>
        <Button onClick={() => window.location.href = '/login'} className="mt-6">Login</Button>
      </div>
    );
  }

  const completion = userProfile.profileCompletionScore || calculateProfileCompletion(userProfile);
  const joinedDate = userProfile.joinedAtDate ? format(userProfile.joinedAtDate, 'MMMM d, yyyy') : 'Date not available';
  const dob = userProfile.dateOfBirthDate ? format(userProfile.dateOfBirthDate, 'MMMM d, yyyy') : 'Not specified';
  
  const socialLinks = Object.entries(userProfile.socialMediaLinks || {})
    .filter(([, value]) => value)
    .map(([key, value]) => ({ platform: key.charAt(0).toUpperCase() + key.slice(1), link: value as string}));

  return (
    <div className="container mx-auto py-8 px-4 md:py-12">
      <Card className="max-w-3xl mx-auto glassmorphic-card shadow-soft-xl">
        <CardHeader className="text-center relative pb-8 border-b border-border/30">
          <Avatar className="h-32 w-32 mx-auto border-4 border-primary/70 shadow-lg mb-4">
            <AvatarImage src={userProfile.avatar} alt={userProfile.name} data-ai-hint="person portrait"/>
            <AvatarFallback className="text-5xl bg-muted text-muted-foreground">{userProfile.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <CardTitle className="font-headline text-4xl text-primary">{userProfile.name}</CardTitle>
          {userProfile.username && <CardDescription className="text-lg text-muted-foreground">@{userProfile.username}</CardDescription>}
          <Button asChild size="sm" className="absolute top-4 right-4 bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/profile/edit">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Link>
          </Button>
          <div className="pt-6 w-full max-w-sm mx-auto">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Profile Completion</span>
              <span>{completion}%</span>
            </div>
            <Progress value={completion} className="w-full h-2.5" />
            {completion < 70 && (
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 text-center flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> 
                Complete your profile (70%+) to unlock all features like matching.
              </p>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-8 space-y-8">
          {/* Basic Info Section */}
          <section>
            <h2 className="text-xl font-headline text-primary mb-4 flex items-center"><UserCheck className="mr-3 h-6 w-6"/>Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <ProfileDataItem icon={Mail} label="Email" value={userProfile.email} />
              <ProfileDataItem icon={CalendarDays} label="Date of Birth" value={dob} />
              <ProfileDataItem icon={Users} label="Gender" value={userProfile.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : 'Not specified'} />
              {userProfile.interestedIn && userProfile.interestedIn.length > 0 && (
                <ProfileDataItem icon={Heart} label="Interested In" value={userProfile.interestedIn.map(i => i.charAt(0).toUpperCase() + i.slice(1))} />
              )}
            </div>
            {userProfile.bio && (
              <div className="mt-6">
                <h3 className="text-md font-semibold text-foreground mb-1">Bio</h3>
                <p className="text-muted-foreground whitespace-pre-line">{userProfile.bio}</p>
              </div>
            )}
          </section>

          {/* Location Info Section */}
          {(userProfile.currentLocation?.address || userProfile.willingToTravelTo?.length) && (
            <section>
                <h2 className="text-xl font-headline text-primary mb-4 flex items-center"><MapPin className="mr-3 h-6 w-6"/>Location & Travel</h2>
                <div className="space-y-4">
                <ProfileDataItem icon={LocateFixed} label="Current Location" value={userProfile.currentLocation?.address || 'Not specified'} />
                {userProfile.currentLocation?.coordinates && (
                  <p className="ml-8 text-xs text-muted-foreground">
                    (Lat: {userProfile.currentLocation.coordinates.latitude.toFixed(4)}, Lng: {userProfile.currentLocation.coordinates.longitude.toFixed(4)})
                  </p>
                )}
                <ProfileDataItem icon={Globe} label="Willing to Travel To" value={userProfile.willingToTravelTo} />
                <ProfileDataItem icon={Plane} label="Max Travel Distance for Short Trips" value={userProfile.maxTravelDistance ? `${userProfile.maxTravelDistance} km` : 'Not specified'} />
                </div>
            </section>
          )}

          {/* Travel Preferences Section */}
          {(userProfile.travelStyles?.length || userProfile.favoriteDestinations?.length || userProfile.bucketList?.length || userProfile.preferredTransportModes?.length || userProfile.travelFrequency || userProfile.travelBudgetRange) && (
            <section>
                <h2 className="text-xl font-headline text-primary mb-4 flex items-center"><Briefcase className="mr-3 h-6 w-6"/>Travel Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <ProfileDataItem label="Travel Styles" icon={Sparkles} value={userProfile.travelStyles} />
                    <ProfileDataItem label="Favorite Destinations" icon={Sparkles} value={userProfile.favoriteDestinations} />
                    <ProfileDataItem label="Bucket List" icon={Sparkles} value={userProfile.bucketList} />
                    <ProfileDataItem label="Preferred Transport" icon={Sparkles} value={userProfile.preferredTransportModes} />
                    <ProfileDataItem label="Travel Frequency" icon={Sparkles} value={userProfile.travelFrequency} />
                    <ProfileDataItem label="Typical Budget" icon={Sparkles} value={userProfile.travelBudgetRange} />
                    <ProfileDataItem label="Typical Availability" icon={Sparkles} value={userProfile.travelAvailability} />
                </div>
            </section>
          )}

          {/* Interests & Hobbies Section */}
          {(userProfile.interests?.length || userProfile.languagesSpoken?.length || userProfile.musicPreferences?.length || userProfile.moviePreferences?.length || userProfile.bookPreferences?.length) && (
            <section>
                <h2 className="text-xl font-headline text-primary mb-4 flex items-center"><Palette className="mr-3 h-6 w-6"/>Interests & Hobbies</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <ProfileDataItem label="General Interests" icon={Sparkles} value={userProfile.interests} />
                    <ProfileDataItem label="Languages Spoken" icon={Languages} value={userProfile.languagesSpoken} />
                    <ProfileDataItem label="Music Preferences" icon={Sparkles} value={userProfile.musicPreferences} />
                    <ProfileDataItem label="Movie Preferences" icon={Sparkles} value={userProfile.moviePreferences} />
                    <ProfileDataItem label="Book Preferences" icon={Sparkles} value={userProfile.bookPreferences} />
                </div>
            </section>
          )}
          
          {/* Match Preferences Section */}
          {userProfile.matchPreferences && (Object.values(userProfile.matchPreferences).some(val => val !== null && val !== undefined && (!Array.isArray(val) || val.length > 0) )) && (
            <section>
                <h2 className="text-xl font-headline text-primary mb-4 flex items-center"><Heart className="mr-3 h-6 w-6"/>Match Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <ProfileDataItem label="Preferred Age Range" icon={Sparkles} value={userProfile.matchPreferences.ageRange ? `${userProfile.matchPreferences.ageRange.min} - ${userProfile.matchPreferences.ageRange.max} years` : 'Not specified'} />
                    <ProfileDataItem label="Interested in Matching With" icon={Sparkles} value={userProfile.matchPreferences.genderPreference?.map(g => g.charAt(0).toUpperCase() + g.slice(1))} />
                    <ProfileDataItem label="Looking For" icon={Sparkles} value={userProfile.matchPreferences.lookingFor?.map(lf => lf.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))} />
                    <ProfileDataItem label="Smoking Preference" icon={Sparkles} value={userProfile.matchPreferences.smokingPreference ? userProfile.matchPreferences.smokingPreference.charAt(0).toUpperCase() + userProfile.matchPreferences.smokingPreference.slice(1) : 'Not specified'} />
                    <ProfileDataItem label="Drinking Preference" icon={Sparkles} value={userProfile.matchPreferences.drinkingPreference ? userProfile.matchPreferences.drinkingPreference.charAt(0).toUpperCase() + userProfile.matchPreferences.drinkingPreference.slice(1) : 'Not specified'} />
                    <ProfileDataItem label="Pet Friendly" icon={Sparkles} value={userProfile.matchPreferences.petFriendly === null || userProfile.matchPreferences.petFriendly === undefined ? 'Not specified' : (userProfile.matchPreferences.petFriendly ? 'Yes' : 'No')} />
                    <ProfileDataItem label="Share Expenses" icon={Sparkles} value={userProfile.matchPreferences.expensesPreference ? userProfile.matchPreferences.expensesPreference.charAt(0).toUpperCase() + userProfile.matchPreferences.expensesPreference.slice(1) : 'Not specified'} />
                </div>
            </section>
          )}

           {/* Contact & Verification Section */}
            <section>
                <h2 className="text-xl font-headline text-primary mb-4 flex items-center"><ShieldCheck className="mr-3 h-6 w-6"/>Contact & Verification</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <ProfileDataItem icon={Mail} label="Phone Number" value={userProfile.phoneNumber || 'Not provided'} />
                     {userProfile.isIdVerified && (
                        <div className="flex items-center space-x-2 text-green-600 dark:text-green-500">
                            <UserCheck className="h-5 w-5" />
                            <span>ID Verified</span>
                        </div>
                    )}
                    {!userProfile.isIdVerified && userProfile.idVerificationImageUrl && (
                        <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-500">
                            <AlertTriangle className="h-5 w-5" />
                            <span>ID Verification Pending</span>
                        </div>
                    )}
                     {!userProfile.isIdVerified && !userProfile.idVerificationImageUrl && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                            <AlertTriangle className="h-5 w-5" />
                            <span>ID Not Verified</span>
                        </div>
                    )}
                 </div>
                 {socialLinks.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-md font-semibold text-foreground mb-2">Social Media</h3>
                        <div className="flex flex-wrap gap-3">
                        {socialLinks.map(social => (
                            <Button key={social.platform} variant="outline" size="sm" asChild>
                                <a href={social.link.startsWith('http') ? social.link : `https://www.${social.platform.toLowerCase()}.com/${social.link}`} target="_blank" rel="noopener noreferrer">
                                    {/* Basic icon mapping, can be improved */}
                                    {social.platform === "Instagram" && <Sparkles className="mr-2 h-4 w-4"/>}
                                    {social.platform === "Twitter" && <Sparkles className="mr-2 h-4 w-4"/>}
                                    {social.platform !== "Instagram" && social.platform !== "Twitter" && <Globe className="mr-2 h-4 w-4"/>}
                                    {social.platform}
                                </a>
                            </Button>
                        ))}
                        </div>
                    </div>
                 )}
            </section>


          <div className="border-t border-border/30 pt-6 text-center">
            <p className="text-sm text-muted-foreground">Joined WanderLink on {joinedDate}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
