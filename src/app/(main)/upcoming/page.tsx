
'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import type { Post, TripStatus } from '@/types';
import { collection, onSnapshot, orderBy, query, Timestamp, doc, getDoc } from 'firebase/firestore';
import { Loader2, CalendarClock, Frown } from 'lucide-react';
import UpcomingTripCard from '@/components/trips/UpcomingTripCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

const getLiveTripStatus = (post: Post): TripStatus => {
  if (post.tripStatus === 'cancelled') return 'cancelled';

  const now = new Date();
  const startDate = post.tripStartDateDate;
  const endDate = post.tripEndDateDate;

  if (endDate && endDate < now) return 'completed';
  if (startDate && startDate <= now && (!endDate || endDate >= now)) return 'in-progress';
  if (startDate && startDate > now) return 'upcoming';
  
  return post.tripStatus || 'planning'; // Default to planning or stored status
};


export default function UpcomingTripsPage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('tripStartDate', 'asc'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const postsDataPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const postData = docSnapshot.data();
        const post: Post = { id: docSnapshot.id, ...postData } as Post;

        if (postData.createdAt && postData.createdAt instanceof Timestamp) {
          post.createdAtDate = postData.createdAt.toDate();
        }
        if (postData.tripStartDate && postData.tripStartDate instanceof Timestamp) {
          post.tripStartDateDate = postData.tripStartDate.toDate();
        } else if (postData.tripStartDate instanceof Date) {
          post.tripStartDateDate = postData.tripStartDate;
        }
        if (postData.tripEndDate && postData.tripEndDate instanceof Timestamp) {
          post.tripEndDateDate = postData.tripEndDate.toDate();
        } else if (postData.tripEndDate instanceof Date) {
          post.tripEndDateDate = postData.tripEndDate;
        }
        
        if (postData.userId) {
            const userRef = doc(db, 'users', postData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                post.user = { uid: userSnap.id, ...userSnap.data() } as any;
            }
        }
        return post;
      });

      const resolvedPostsData = await Promise.all(postsDataPromises);
      setAllPosts(resolvedPostsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts for upcoming trips:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const upcomingAndInProgressTrips = useMemo(() => {
    return allPosts
      .map(post => ({ ...post, liveStatus: getLiveTripStatus(post) }))
      .filter(post => post.liveStatus === 'upcoming' || post.liveStatus === 'in-progress')
      .sort((a, b) => {
        const dateA = a.tripStartDateDate || new Date(0); // Handle null dates for sorting
        const dateB = b.tripStartDateDate || new Date(0);
        return dateA.getTime() - dateB.getTime();
      });
  }, [allPosts]);


  return (
    <div className="flex flex-col h-full">
      <div className="pb-4 sticky top-0 z-10 bg-background/80 dark:bg-background/70 backdrop-blur-md pt-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4 shadow-sm">
        <h1 className="text-2xl font-headline text-primary">Upcoming & Ongoing Trips</h1>
        <p className="text-sm text-muted-foreground">Discover exciting trips and events planned or happening now.</p>
      </div>

      {loading && upcomingAndInProgressTrips.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      ) : !loading && upcomingAndInProgressTrips.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 bg-card/60 dark:bg-card/50 rounded-xl shadow-soft-lg glassmorphic-card max-w-lg">
            <Frown size={64} className="mx-auto text-muted-foreground/40 mb-6" />
            <h2 className="text-xl font-semibold text-foreground mb-3">No Upcoming Adventures Yet</h2>
            <p className="text-muted-foreground mb-6">
              It looks like there are no trips planned or in progress right now. Why not plan one?
            </p>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/create">Plan a New Trip</Link>
            </Button>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
            {upcomingAndInProgressTrips.map(post => (
              <UpcomingTripCard key={post.id} post={post} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
