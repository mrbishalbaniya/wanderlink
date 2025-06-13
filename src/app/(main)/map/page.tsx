
'use client';

import InteractiveMap from '@/components/map/InteractiveMap';
import PostCard from '@/components/posts/PostCard';
import { db } from '@/lib/firebase';
import type { Post, UserProfile } from '@/types';
import { collection, getDocs, orderBy, query, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, Globe } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Map as LeafletMap } from 'leaflet';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; // Added usePathname, useSearchParams
import Image from 'next/image';

export default function MapPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostForSheet, setSelectedPostForSheet] = useState<Post | null>(null);
  const mapRefForPopupClose = useRef<LeafletMap | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();


  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const postsCollection = collection(db, 'posts');
      const q = query(postsCollection, orderBy('createdAt', 'desc'));
      const postsSnapshot = await getDocs(q);
      
      const postsData = await Promise.all(postsSnapshot.docs.map(async (docSnapshot) => {
        const post = { id: docSnapshot.id, ...docSnapshot.data() } as Post;
        
        if (post.createdAt && typeof (post.createdAt as Timestamp).toDate === 'function') {
          post.createdAtDate = (post.createdAt as Timestamp).toDate();
        } else if (post.createdAt instanceof Date) {
           post.createdAtDate = post.createdAt;
        }

        if (post.userId) {
          const userRef = doc(db, 'users', post.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            post.user = userSnap.data() as UserProfile;
            if (post.user.joinedAt && typeof (post.user.joinedAt as Timestamp).toDate === 'function') {
              post.user.joinedAtDate = (post.user.joinedAt as Timestamp).toDate();
            }
          }
        }
        return post;
      }));
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching posts for map:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostMarkerClickOnMap = useCallback((postId: string) => {
    mapRefForPopupClose.current?.closePopup(); 
    const postToView = posts.find(p => p.id === postId);
    if (postToView) {
        setSelectedPostForSheet(postToView);
    } else {
        // If post not found locally (should be rare), redirect to main feed with postId
        router.push(`/?postId=${postId}`); 
    }
  }, [posts, router]);
  
  const handleLikeUpdateInSheet = useCallback((postId: string, newLikes: string[]) => {
    setPosts(currentPosts => 
      currentPosts.map(p => 
        p.id === postId ? { ...p, likes: newLikes } : p
      )
    );
     if (selectedPostForSheet && selectedPostForSheet.id === postId) {
      setSelectedPostForSheet(prev => prev ? { ...prev, likes: newLikes } : null);
    }
  }, [selectedPostForSheet]);

  const handleSaveUpdateInSheet = useCallback((postId: string, newSavedBy: string[]) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.id === postId ? { ...p, savedBy: newSavedBy } : p
      )
    );
    if (selectedPostForSheet && selectedPostForSheet.id === postId) {
      setSelectedPostForSheet(prev => prev ? { ...prev, savedBy: newSavedBy } : null);
    }
  }, [selectedPostForSheet]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="pb-4 sticky top-0 z-10 bg-background/80 dark:bg-background/70 backdrop-blur-md pt-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4 shadow-sm">
        <h1 className="text-2xl font-headline text-primary">Global Adventure Map</h1>
        <p className="text-sm text-muted-foreground">Explore shared experiences from around the world.</p>
      </div>

      <div className="flex-1 overflow-hidden relative rounded-xl shadow-soft-lg">
        {posts.length === 0 && !loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-muted rounded-xl">
                <Globe size={80} className="text-muted-foreground/30 mb-6" />
                <h2 className="text-2xl font-semibold text-foreground mb-3">The Map is Quiet... For Now</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                No adventures have been plotted on the map yet. Why not be the first to share yours?
                </p>
            </div>
        ) : (
            <InteractiveMap 
                posts={posts} 
                className="absolute inset-0" 
                onPostClick={handlePostMarkerClickOnMap} 
                setMapInstance={(mapInstance) => mapRefForPopupClose.current = mapInstance}
            />
        )}
      </div>
      
      <Sheet 
        open={!!selectedPostForSheet} 
        onOpenChange={(isOpen) => { 
            if (!isOpen) {
                setSelectedPostForSheet(null);
                 if (searchParams.get('postId')) { // Check if postId was in query
                    router.replace(pathname, { scroll: false }); // Clear query params
                }
            }
        }}
      >
        <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 glassmorphic-card border-none z-[1000]" side="right">
          {selectedPostForSheet && (
            <ScrollArea className="h-full">
              <SheetHeader className="p-6 pb-2 sr-only">
                <SheetTitle className="sr-only">{selectedPostForSheet.title}</SheetTitle>
                <SheetDescription className="sr-only">Detailed view of: {selectedPostForSheet.caption.substring(0,100)}</SheetDescription>
              </SheetHeader>
              <div className="p-1">
                <PostCard post={selectedPostForSheet} onLikeUpdate={handleLikeUpdateInSheet} onSaveUpdate={handleSaveUpdateInSheet}/>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
