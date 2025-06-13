
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Added Textarea
import { useToast } from '@/hooks/use-toast';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { Loader2, Camera } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { currentUser, userProfile, loading: authLoading, setUserProfile: updateAuthProviderProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [interestsInput, setInterestsInput] = useState(''); // State for interests textarea
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setAvatarPreview(userProfile.avatar);
      setInterestsInput(userProfile.interests?.join(', ') || ''); // Populate interests
    }
  }, [userProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUpdating(true);

    try {
      let newAvatarUrl = userProfile?.avatar || '';
      if (avatarFile) {
        const avatarRef = ref(storage, `avatars/${currentUser.uid}/${avatarFile.name}`);
        await uploadBytes(avatarRef, avatarFile);
        newAvatarUrl = await getDownloadURL(avatarRef);
      }

      await updateAuthProfile(currentUser, {
        displayName: name,
        photoURL: newAvatarUrl,
      });

      const interestsArray = interestsInput.split(',').map(interest => interest.trim()).filter(interest => interest !== '');

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        name: name,
        avatar: newAvatarUrl,
        interests: interestsArray, // Save interests
      });
      
      if (userProfile) {
        const updatedProfile = { 
          ...userProfile, 
          name, 
          avatar: newAvatarUrl,
          interests: interestsArray, // Update local profile context
        };
         if (typeof updateAuthProviderProfile === 'function') {
            updateAuthProviderProfile(updatedProfile);
        }
      }
      setAvatarFile(null); 

      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.', className: 'bg-accent text-accent-foreground' });
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
        <p className="text-lg text-muted-foreground">Please log in to view your profile.</p>
        <Button onClick={() => window.location.href = '/login'} className="mt-6">Login</Button>
      </div>
    );
  }
  
  const joinedDate = userProfile.joinedAtDate 
    ? format(userProfile.joinedAtDate, 'MMMM d, yyyy')
    : 'Date not available';


  return (
    <div className="container mx-auto py-8 px-4 md:py-12">
      <Card className="max-w-2xl mx-auto glassmorphic-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-headline text-4xl text-primary mb-2">Your Profile</CardTitle>
          <CardDescription className="text-base text-muted-foreground">Manage your personal information, preferences, and interests.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col items-center space-y-4 pt-4">
              <div className="relative group">
                <Avatar className="h-36 w-36 border-4 border-primary/70 shadow-lg">
                  <AvatarImage src={avatarPreview || userProfile.avatar} alt={userProfile.name} data-ai-hint="person portrait" />
                  <AvatarFallback className="text-5xl bg-muted text-muted-foreground">{userProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <label htmlFor="avatarUpload" className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                  <Camera size={40} />
                  <input id="avatarUpload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
              {avatarPreview && avatarFile && <p className="text-xs text-muted-foreground">New avatar preview</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="name" className="text-md font-medium text-foreground/90">Full Name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" className="text-base py-3 px-4 rounded-lg shadow-sm focus:ring-primary focus:border-primary bg-input" />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-md font-medium text-foreground/90">Email Address</Label>
              <Input id="email" type="email" value={userProfile.email} disabled className="text-base py-3 px-4 rounded-lg bg-muted/60 border-border/50 cursor-not-allowed shadow-sm" />
            </div>

            <div className="space-y-3">
              <Label htmlFor="interests" className="text-md font-medium text-foreground/90">Your Interests</Label>
              <Textarea 
                id="interests" 
                value={interestsInput} 
                onChange={(e) => setInterestsInput(e.target.value)} 
                placeholder="e.g., hiking, photography, museums, coding, cooking" 
                rows={3}
                className="text-base py-3 px-4 rounded-lg shadow-sm focus:ring-primary focus:border-primary bg-input"
              />
              <p className="text-xs text-muted-foreground">Separate interests with a comma.</p>
            </div>
            
            <div className="space-y-3">
              <Label className="text-md font-medium text-foreground/90">Joined WanderLink</Label>
              <p className="text-base text-muted-foreground pt-1">{joinedDate}</p>
            </div>

            <Button type="submit" className="w-full text-lg py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating Profile...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

