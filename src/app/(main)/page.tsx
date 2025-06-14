
'use client';

import PostCard from '@/components/posts/PostCard';
import { db } from '@/lib/firebase';
import type { Post, UserProfile } from '@/types';
import { collection, onSnapshot, orderBy, query, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { Loader2, Compass } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function HomePage() { 
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const postIdFromQuery = searchParams.get('postId');

  useEffect(() => {
    setLoading(true);
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        const postsDataPromises = querySnapshot.docs.map(async (docSnapshot) => {
          try {
            const postData = docSnapshot.data();
            const post: Post = { 
              id: docSnapshot.id, 
              // Ensure all required fields from Post type are initialized even if not in postData
              userId: postData.userId || '',
              title: postData.title || 'Untitled Post',
              caption: postData.caption || '',
              coordinates: postData.coordinates || { latitude: 0, longitude: 0 },
              category: postData.category || 'other',
              images: postData.images || [],
              likes: postData.likes || [],
              savedBy: postData.savedBy || [],
              commentCount: postData.commentCount ?? 0,
              createdAt: postData.createdAt, // Keep as original Firestore type initially
              ...postData 
            };
            
            // Robust date conversion for post.createdAt
            if (postData.createdAt) {
              if (postData.createdAt instanceof Timestamp) {
                post.createdAtDate = postData.createdAt.toDate();
              } else if (postData.createdAt instanceof Date) {
                post.createdAtDate = postData.createdAt;
              } else if (typeof postData.createdAt === 'object' && postData.createdAt.seconds) {
                // Handle case where it might be a plain object from Firestore offline cache or similar
                post.createdAtDate = new Timestamp(postData.createdAt.seconds, postData.createdAt.nanoseconds).toDate();
              }
            }


            if (postData.userId) {
              const userRef = doc(db, 'users', postData.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data() as Omit<UserProfile, 'uid'>; // UserProfile without uid, as uid is from userRef.id
                post.user = { uid: userSnap.id, ...userData } as UserProfile;

                // Robust date conversion for user.joinedAt
                if (userData.joinedAt) {
                  if (userData.joinedAt instanceof Timestamp) {
                    post.user.joinedAtDate = userData.joinedAt.toDate();
                  } else if (userData.joinedAt instanceof Date) {
                    post.user.joinedAtDate = userData.joinedAt;
                  } else if (typeof userData.joinedAt === 'object' && (userData.joinedAt as any).seconds) {
                     post.user.joinedAtDate = new Timestamp((userData.joinedAt as any).seconds, (userData.joinedAt as any).nanoseconds).toDate();
                  }
                }
                // Robust date conversion for user.dateOfBirth
                if (userData.dateOfBirth) {
                  if (userData.dateOfBirth instanceof Timestamp) {
                    post.user.dateOfBirthDate = userData.dateOfBirth.toDate();
                  } else if (userData.dateOfBirth instanceof Date) {
                    post.user.dateOfBirthDate = userData.dateOfBirth;
                  } else if (typeof userData.dateOfBirth === 'object' && (userData.dateOfBirth as any).seconds) {
                    post.user.dateOfBirthDate = new Timestamp((userData.dateOfBirth as any).seconds, (userData.dateOfBirth as any).nanoseconds).toDate();
                  }
                }
              } else {
                post.user = undefined; 
                console.warn(`User profile not found for userId: ${postData.userId} on post ${post.id}`);
              }
            }
            return post;
          } catch (postError) {
            console.error(`Error processing post ${docSnapshot.id}:`, postError);
            return null; // Skip this post if it causes an error
          }
        });

        const resolvedPostsData = await Promise.all(postsDataPromises);
        const validPostsData = resolvedPostsData.filter(p => p !== null) as Post[];
        setPosts(validPostsData);

      } catch (snapshotProcessingError) {
        console.error("Error processing snapshot data:", snapshotProcessingError);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching posts with onSnapshot:", error);
      setLoading(false);
    });

    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    if (!loading && posts.length > 0) {
      if (postIdFromQuery) {
        const postToSelect = posts.find(p => p.id === postIdFromQuery);
        if (postToSelect) {
          setSelectedPost(postToSelect);
        } else {
           router.replace(pathname, { scroll: false });
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, loading, postIdFromQuery, router, pathname, setSelectedPost]); // Added setSelectedPost

  const handlePostCardClick = useCallback((post: Post) => {
    setSelectedPost(post);
  }, [setSelectedPost]);

  const handleLikeUpdateInHome = useCallback((postId: string, newLikes: string[]) => {
    setPosts(currentPosts => 
      currentPosts.map(p => 
        p.id === postId ? { ...p, likes: newLikes } : p
      )
    );
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, likes: newLikes } : null);
    }
  }, [selectedPost, setSelectedPost]);

  const handleSaveUpdateInHome = useCallback((postId: string, newSavedBy: string[]) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.id === postId ? { ...p, savedBy: newSavedBy } : p
      )
    );
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, savedBy: newSavedBy } : null);
    }
  }, [selectedPost, setSelectedPost]);

  const handleSheetOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setSelectedPost(null);
      if (postIdFromQuery) {
          router.replace(pathname, { scroll: false }); 
      }
    }
  }, [postIdFromQuery, router, pathname, setSelectedPost]);


  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="pb-4 sticky top-0 z-10 bg-background/80 dark:bg-background/70 backdrop-blur-md pt-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4 shadow-sm">
        <h1 className="text-2xl font-headline text-primary">Explore Adventures</h1>
        <p className="text-sm text-muted-foreground">Discover new destinations and experiences shared by the community.</p>
      </div>

      <ScrollArea className="flex-1 pr-3">
        {posts.length === 0 && !loading ? (
          <div className="text-center py-20 glassmorphic-card">
            <Compass size={64} className="mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Nothing to explore yet!</h2>
            <p className="text-muted-foreground mb-6">Be the first to share an adventure, or check back soon.</p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/create">Share Your Adventure</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map(post => (
              <div key={post.id} onClick={() => handlePostCardClick(post)} className="cursor-pointer">
                <PostCard post={post} onLikeUpdate={handleLikeUpdateInHome} onSaveUpdate={handleSaveUpdateInHome} />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <Sheet 
        open={!!selectedPost} 
        onOpenChange={handleSheetOpenChange}
      >
        <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 glassmorphic-card border-none z-[1000]" side="right">
          {selectedPost && (
            <ScrollArea className="h-full">
              <SheetHeader className="p-6 pb-2 sr-only">
                <SheetTitle className="sr-only">{selectedPost.title}</SheetTitle>
                <SheetDescription className="sr-only">Detailed view of: {(selectedPost.caption || "").substring(0,100)}</SheetDescription>
              </SheetHeader>
              <div className="p-1">
                <PostCard post={selectedPost} onLikeUpdate={handleLikeUpdateInHome} onSaveUpdate={handleSaveUpdateInHome} />
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
