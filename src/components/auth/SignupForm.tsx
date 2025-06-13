'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Chrome } from 'lucide-react';
import type { UserProfile } from '@/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: values.name });

      // Create user document in Firestore
      const newUserProfile: UserProfile = {
        uid: user.uid,
        name: values.name,
        email: values.email,
        avatar: `https://placehold.co/100x100.png?text=${values.name.charAt(0).toUpperCase()}`, // Default avatar
        joinedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', user.uid), newUserProfile);

      toast({ title: 'Signup Successful', description: 'Welcome to WanderMap!' });
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Signup Failed',
        description: error.message || 'Could not create account. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleGoogleSignup() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists, if not create one
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const newUserProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Anonymous Wanderer',
          email: user.email || '',
          avatar: user.photoURL || `https://placehold.co/100x100.png?text=${(user.displayName || user.email || 'U').charAt(0)}`,
          joinedAt: serverTimestamp(),
        };
        await setDoc(userRef, newUserProfile);
      }
      
      toast({ title: 'Signup Successful', description: `Welcome, ${user.displayName || user.email}!` });
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Google Signup Failed',
        description: error.message || 'Could not sign up with Google. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-card shadow-xl rounded-lg">
      <div className="text-center">
        <h1 className="font-headline text-3xl font-bold text-primary">Create an Account</h1>
        <p className="text-muted-foreground">Join WanderMap and start sharing your journeys!</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or sign up with
          </span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogleSignup}>
        <Chrome className="mr-2 h-4 w-4" /> Google
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Button variant="link" asChild className="text-primary p-0 h-auto">
          <Link href="/login">Log in</Link>
        </Button>
      </p>
    </div>
  );
}
