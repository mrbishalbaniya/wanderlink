
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMatchedUsers } from '@/lib/firebase/friendsUtils';
import type { UserProfile } from '@/types';
import FriendCard from '@/components/friends/FriendCard';
import { Loader2, Users, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FriendsPage() {
  const { currentUser } = useAuth();
  const [matchedFriends, setMatchedFriends] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      getMatchedUsers(currentUser.uid)
        .then(users => {
          setMatchedFriends(users);
        })
        .catch(error => {
          console.error("Failed to fetch matched friends:", error);
          // Optionally, set an error state here to display to the user
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false); // Not logged in, so not loading
      setMatchedFriends([]); // Clear friends if user logs out
    }
  }, [currentUser]);

  return (
    <div className="container mx-auto py-8 px-4 md:py-12">
      <div className="pb-4 sticky top-0 z-10 bg-background/80 dark:bg-background/70 backdrop-blur-md pt-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-6 shadow-sm">
        <h1 className="text-3xl font-headline text-primary">Your Connections</h1>
        <p className="text-sm text-muted-foreground">People you've matched with on WanderLink.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-15rem)] text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-md text-muted-foreground">Loading your connections...</p>
        </div>
      ) : matchedFriends.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {matchedFriends.map(friend => (
            <FriendCard key={friend.uid} user={friend} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-15rem)] text-center p-8 bg-card/60 dark:bg-card/50 rounded-xl shadow-soft-lg glassmorphic-card">
          <SearchX size={64} className="mx-auto text-muted-foreground/40 mb-6" />
          <h2 className="text-xl font-semibold text-foreground mb-3">No Connections Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            It looks like you haven't made any connections. Head over to the "Match" section to find and connect with fellow travelers!
          </p>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/match">Find Matches</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
