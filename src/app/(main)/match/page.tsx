
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import TinderCard from 'react-tinder-card';
import { useAuth } from '@/contexts/AuthContext';
import { getUsersToSwipe, recordSwipe, checkForAndCreateMatch } from '@/lib/firebase/matchUtils';
import type { UserProfile, SwipeAction } from '@/types';
import SwipeCard from '@/components/match/SwipeCard';
import MatchPopup from '@/components/match/MatchPopup';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw, X, Heart, Users, Frown } from 'lucide-react';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

export default function MatchPage() {
  const { currentUser, userProfile: currentUserProfile } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [matchedWith, setMatchedWith] = useState<UserProfile | null>(null);
  const [lastSwipedDirection, setLastSwipedDirection] = useState<SwipeAction | null>(null);
  const [lastFetchedUserSnap, setLastFetchedUserSnap] = useState<QueryDocumentSnapshot | null>(null);
  const [allProfilesFetched, setAllProfilesFetched] = useState(false);

  const currentIndexRef = useRef(0);
  const canSwipe = currentIndexRef.current < profiles.length;
  const childRefs = useMemo(
    () =>
      Array(profiles.length)
        .fill(0)
        .map(() => React.createRef<any>()), // For TinderCard API
    [profiles.length]
  );
  
  const fetchProfiles = async (isInitialLoad = false) => {
    if (!currentUser || allProfilesFetched) {
      if(!allProfilesFetched) setIsLoading(false);
      return;
    }
    if(!isInitialLoad) setIsLoading(true); // show loader for subsequent fetches

    const { profiles: newProfiles, newLastFetchedUserSnap } = await getUsersToSwipe(currentUser.uid, isInitialLoad ? null : lastFetchedUserSnap);
    
    if (newProfiles.length === 0 && !isInitialLoad) {
        setAllProfilesFetched(true);
    } else {
        setProfiles(prevProfiles => isInitialLoad ? newProfiles : [...prevProfiles, ...newProfiles]);
        currentIndexRef.current = isInitialLoad ? newProfiles.length -1 : prevProfiles.length + newProfiles.length -1;
    }
    
    setLastFetchedUserSnap(newLastFetchedUserSnap);
    setIsLoading(false);
  };


  useEffect(() => {
    fetchProfiles(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const swiped = async (direction: SwipeAction, swipedProfile: UserProfile, index: number) => {
    if (!currentUser) return;
    setLastSwipedDirection(direction);
    currentIndexRef.current = index - 1;

    try {
      await recordSwipe(currentUser.uid, swipedProfile.uid, direction);
      if (direction === 'like') {
        const match = await checkForAndCreateMatch(currentUser.uid, swipedProfile.uid);
        if (match) {
          setMatchedWith(match);
          setShowMatchPopup(true);
        }
      }
    } catch (error) {
      console.error("Error processing swipe:", error);
      // Potentially show a toast message
    }
    
    // Check if we need to fetch more profiles
    if (currentIndexRef.current < 2 && !isLoading && !allProfilesFetched) {
        // Fetch more profiles when few are left
        fetchProfiles();
    }
  };

  const swipeButtonAction = async (dir: SwipeAction) => {
    if (canSwipe && currentIndexRef.current >= 0 && childRefs[currentIndexRef.current]) {
      await childRefs[currentIndexRef.current].current?.swipe(dir);
    }
  };

  if (isLoading && profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Finding potential travel buddies...</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center h-full overflow-hidden relative p-4 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="pb-4 sticky top-0 z-10 bg-transparent pt-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4">
        <h1 className="text-3xl font-headline text-primary text-center">Find Your Travel Match</h1>
        <p className="text-sm text-muted-foreground text-center">Swipe right to connect, left to pass.</p>
      </div>
      
      <div className="relative w-[300px] h-[450px] md:w-[350px] md:h-[520px]">
        {profiles.length > 0 ? (
          profiles.map((profile, index) => (
            <TinderCard
              ref={childRefs[index]}
              className="absolute"
              key={profile.uid}
              onSwipe={(dir) => swiped(dir as SwipeAction, profile, index)}
              preventSwipe={['up', 'down']}
            >
              <SwipeCard user={profile} />
            </TinderCard>
          ))
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 glassmorphic-card rounded-2xl w-full">
              <Frown size={64} className="text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No More Profiles</h2>
              <p className="text-muted-foreground mb-4">You've seen everyone for now. Check back later for new travel buddies!</p>
              <Button onClick={() => { setAllProfilesFetched(false); fetchProfiles(true); }} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          )
        )}
      </div>

      {profiles.length > 0 && (
        <div className="flex space-x-6 mt-8 z-10">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-20 h-20 p-0 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive shadow-lg"
            onClick={() => swipeButtonAction('skip')}
            disabled={!canSwipe || isLoading}
          >
            <X size={40} />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-20 h-20 p-0 border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-600 shadow-lg"
            onClick={() => swipeButtonAction('like')}
            disabled={!canSwipe || isLoading}
          >
            <Heart size={36} />
          </Button>
        </div>
      )}
      
      {isLoading && profiles.length > 0 && <Loader2 className="h-8 w-8 animate-spin text-primary mt-4" />}

      <MatchPopup
        isOpen={showMatchPopup}
        onClose={() => setShowMatchPopup(false)}
        matchedUser={matchedWith}
        currentUserAvatar={currentUserProfile?.avatar}
      />
    </div>
  );
}
