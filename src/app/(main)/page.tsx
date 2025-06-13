
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
import { useSearchParams, useRouter, usePathname } from 'next/navigation'; // Added usePathname

export default function HomePage() { 
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  useEffect(() => {
    setLoading(true);
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const postsData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
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
             if (post.user.dateOfBirth && typeof (post.user.dateOfBirth as Timestamp).toDate === 'function') {
              post.user.dateOfBirthDate = (post.user.dateOfBirth as Timestamp).toDate();
            }
          }
        }
        return post;
      }));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts with onSnapshot:", error);
      setLoading(false);
    });

    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    if (!loading && posts.length > 0) {
      const postIdFromQuery = searchParams.get('postId');
      if (postIdFromQuery) {
        const postToSelect = posts.find(p => p.id === postIdFromQuery);
        if (postToSelect) {
          setSelectedPost(postToSelect);
        }
      }
    }
  }, [posts, loading, searchParams, router]);

  const handlePostCardClick = useCallback((post: Post) => {
    setSelectedPost(post);
  }, []);

  const handleLikeUpdateInHome = useCallback((postId: string, newLikes: string[]) => {
    setPosts(currentPosts => 
      currentPosts.map(p => 
        p.id === postId ? { ...p, likes: newLikes } : p
      )
    );
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, likes: newLikes } : null);
    }
  }, [selectedPost]);

  const handleSaveUpdateInHome = useCallback((postId: string, newSavedBy: string[]) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.id === postId ? { ...p, savedBy: newSavedBy } : p
      )
    );
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, savedBy: newSavedBy } : null);
    }
  }, [selectedPost]);


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
        onOpenChange={(isOpen) => { 
          if (!isOpen) {
            setSelectedPost(null);
            if (searchParams.get('postId')) {
                router.replace(pathname, { scroll: false }); // Use current pathname
            }
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 glassmorphic-card border-none z-[1000]" side="right">
          {selectedPost && (
            <ScrollArea className="h-full">
              <SheetHeader className="p-6 pb-2 sr-only">
                <SheetTitle className="sr-only">{selectedPost.title}</SheetTitle>
                <SheetDescription className="sr-only">Detailed view of: {selectedPost.caption.substring(0,100)}</SheetDescription>
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
