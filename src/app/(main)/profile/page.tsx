'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { Loader2, Edit3 } from 'lucide-react';
import { format } from 'date-fns'; // For displaying joinedAt date

export default function ProfilePage() {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setAvatarPreview(userProfile.avatar);
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

      // Update Firebase Auth profile
      await updateAuthProfile(currentUser, {
        displayName: name,
        photoURL: newAvatarUrl,
      });

      // Update Firestore profile
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        name: name,
        avatar: newAvatarUrl,
      });
      
      // Update local state if AuthProvider doesn't auto-refresh (it should, but good practice)
      // This part might be removed if AuthProvider handles it well
      if (userProfile) {
         userProfile.name = name;
         userProfile.avatar = newAvatarUrl;
      }


      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
    } catch (error: any) {
      toast({ title: 'Update Failed', description: error.message || 'Could not update profile.', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || !userProfile) {
    // This should ideally be handled by a route guard or redirect in a wrapper component
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Please log in to view your profile.</p>
        <Button onClick={() => window.location.href = '/login'} className="mt-4">Login</Button>
      </div>
    );
  }
  
  const joinedDate = userProfile.joinedAt && typeof (userProfile.joinedAt as any).toDate === 'function' 
    ? format((userProfile.joinedAt as any).toDate(), 'MMMM d, yyyy')
    : 'Date not available';


  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary">Your Profile</CardTitle>
          <CardDescription>Manage your personal information and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-primary shadow-md">
                  <AvatarImage src={avatarPreview || userProfile.avatar} alt={userProfile.name} data-ai-hint="person portrait" />
                  <AvatarFallback className="text-4xl">{userProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <label htmlFor="avatarUpload" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Edit3 size={32} />
                  <input id="avatarUpload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg">Name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" className="text-base" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg">Email</Label>
              <Input id="email" type="email" value={userProfile.email} disabled className="text-base bg-muted/50" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-lg">Joined</Label>
              <p className="text-base text-muted-foreground">{joinedDate}</p>
            </div>

            <Button type="submit" className="w-full" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
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
