
'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import TinderCard from 'react-tinder-card';
import { useAuth } from '@/contexts/AuthContext';
import { getUsersToSwipe, recordSwipe, checkForAndCreateMatch } from '@/lib/firebase/matchUtils';
import type { UserProfile, SwipeAction } from '@/types';
import SwipeCard from '@/components/match/SwipeCard';
import MatchPopup from '@/components/match/MatchPopup';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw, X, Heart, Users, Frown, Globe } from 'lucide-react';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function MatchPage() {
  const { currentUser, userProfile: currentUserProfile } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [matchedWith, setMatchedWith] = useState<UserProfile | null>(null);
  const [lastSwipedDirection, setLastSwipedDirection] = useState<SwipeAction | null>(null);
  const [lastFetchedUserSnap, setLastFetchedUserSnap] = useState<QueryDocumentSnapshot | null>(null);
  const [allProfilesFetched, setAllProfilesFetched] = useState(false);
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(100); // Default 100km

  const currentIndexRef = useRef(0);
  const canSwipe = currentIndexRef.current < profiles.length && profiles.length > 0;

  const childRefs = useMemo(
    () =>
      Array(profiles.length)
        .fill(0)
        .map(() => React.createRef<any>()), // For TinderCard API
    [profiles.length]
  );
  
  const fetchProfiles = useCallback(async (isInitialLoadOrRadiusChange = false) => {
    if (!currentUser || (allProfilesFetched && !isInitialLoadOrRadiusChange)) {
      if (!allProfilesFetched || isInitialLoadOrRadiusChange) setIsLoading(false);
      return;
    }
    setIsLoading(true);
    if (isInitialLoadOrRadiusChange) {
      setLastFetchedUserSnap(null); // Reset pagination for new radius or initial load
      setProfiles([]); // Clear existing profiles for new radius
      currentIndexRef.current = 0;
      setAllProfilesFetched(false);
    }

    const currentUserCoordinates = currentUserProfile?.currentLocation?.coordinates;

    const { profiles: newProfiles, newLastFetchedUserSnap } = await getUsersToSwipe(
      currentUser.uid,
      isInitialLoadOrRadiusChange ? null : lastFetchedUserSnap,
      currentUserCoordinates,
      searchRadiusKm
    );
    
    if (newProfiles.length === 0 && !isInitialLoadOrRadiusChange) {
      setAllProfilesFetched(true);
    } else {
      setProfiles(prevProfiles => isInitialLoadOrRadiusChange ? newProfiles : [...prevProfiles, ...newProfiles]);
      // Adjust currentIndexRef based on whether it's an initial load or appending
      currentIndexRef.current = isInitialLoadOrRadiusChange ? newProfiles.length -1 : (prevProfiles.length + newProfiles.length -1) ;
    }
    
    setLastFetchedUserSnap(newLastFetchedUserSnap);
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, allProfilesFetched, lastFetchedUserSnap, searchRadiusKm, currentUserProfile?.currentLocation?.coordinates]);


  useEffect(() => {
    fetchProfiles(true); // Initial fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Only re-run if currentUser changes

  const handleRadiusChange = (newRadius: number[]) => {
    setSearchRadiusKm(newRadius[0]);
  };
  
  const handleRadiusChangeCommit = useCallback(() => {
      fetchProfiles(true); // Treat as initial load for the new radius
  }, [fetchProfiles]);

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
    }
    
    if (currentIndexRef.current < 2 && profiles.length > 0 && !isLoading && !allProfilesFetched) {
        fetchProfiles(false); // Fetch more, not an initial load
    } else if (profiles.length > 0 && currentIndexRef.current < 0 && !isLoading && !allProfilesFetched) {
      // If all visible cards swiped & more could exist
      fetchProfiles(false);
    }
  };

  const swipeButtonAction = async (dir: SwipeAction) => {
    if (canSwipe && currentIndexRef.current >= 0 && childRefs[currentIndexRef.current]) {
      await childRefs[currentIndexRef.current].current?.swipe(dir);
    }
  };

  const hasCurrentUserLocation = !!currentUserProfile?.currentLocation?.coordinates;

  if (isLoading && profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Finding potential travel buddies...</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-start h-full overflow-y-auto p-4 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="text-center mb-6 sticky top-0 z-20 bg-transparent py-4 w-full max-w-md">
        <h1 className="text-3xl font-headline text-primary">Find Your Travel Match</h1>
        <p className="text-sm text-muted-foreground">Swipe right to connect, left to pass.</p>
      </div>
      
      <Card className="w-full max-w-md mb-6 glassmorphic-card shadow-soft-lg">
        <CardHeader className="pb-2">
            <Label htmlFor="radius-slider" className="text-sm font-medium text-foreground flex items-center">
              <Globe className="h-4 w-4 mr-2 text-primary" />
              Search Radius: <span className="font-bold text-primary ml-1">{searchRadiusKm} km</span>
            </Label>
        </CardHeader>
        <CardContent>
          <Slider
            id="radius-slider"
            min={10}
            max={500}
            step={10}
            value={[searchRadiusKm]}
            onValueChange={handleRadiusChange}
            onValueCommit={handleRadiusChangeCommit}
            disabled={!hasCurrentUserLocation || isLoading}
            className="my-2"
          />
          {!hasCurrentUserLocation && (
            <p className="text-xs text-muted-foreground mt-1">Set your location in your profile to use the radius filter.</p>
          )}
        </CardContent>
      </Card>
      
      <div className="relative w-[300px] h-[450px] md:w-[350px] md:h-[520px]">
        {profiles.length > 0 ? (
          profiles.map((profile, index) => (
            <TinderCard
              ref={childRefs[index]}
              className="absolute"
              key={profile.uid + '-' + index} // Ensure key is unique if profiles can be re-added
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
              <p className="text-muted-foreground mb-4 text-sm">
                No one new around here, or try adjusting your radius. Check back later for new travel buddies!
              </p>
              <Button onClick={() => fetchProfiles(true)} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          )
        )}
         {isLoading && profiles.length > 0 && 
            <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm rounded-2xl z-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          }
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
      

      <MatchPopup
        isOpen={showMatchPopup}
        onClose={() => setShowMatchPopup(false)}
        matchedUser={matchedWith}
        currentUserAvatar={currentUserProfile?.avatar}
      />
    </div>
  );
}

