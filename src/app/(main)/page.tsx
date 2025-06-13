
'use client';

import PostCard from '@/components/posts/PostCard';
import { db } from '@/lib/firebase';
import type { Post, UserProfile } from '@/types';
import { collection, getDocs, orderBy, query, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { List, Loader2, PlusCircle, Compass } from 'lucide-react'; // Removed MapIcon, Map as MapIcon
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Added useRouter

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostForSheet, setSelectedPostForSheet] = useState<Post | null>(null);
  const router = useRouter(); 

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
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  
  const handlePostCardClickInList = useCallback((post: Post) => {
    setSelectedPostForSheet(post);
  }, []);

  const handleLikeUpdateInList = useCallback((postId: string, newLikes: string[]) => {
    setPosts(currentPosts => 
      currentPosts.map(p => 
        p.id === postId ? { ...p, likes: newLikes } : p
      )
    );
     if (selectedPostForSheet && selectedPostForSheet.id === postId) {
      setSelectedPostForSheet(prev => prev ? { ...prev, likes: newLikes } : null);
    }
  }, [selectedPostForSheet]);
  
  const handlePostMarkerClick = useCallback((postId: string) => {
     router.push(`/explore?postId=${postId}`);
  }, [router]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="pb-4 flex justify-between items-center space-x-2 sticky top-0 z-10 bg-background/80 dark:bg-background/70 backdrop-blur-md pt-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-headline text-primary">Feed</h1>
          <p className="text-sm text-muted-foreground">Recent travel experiences from the community.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild size="sm" className="rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/create">
              <PlusCircle className="mr-2 h-4 w-4" /> New Post
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full pr-3">
            {posts.length === 0 && !loading ? (
              <div className="text-center py-20 glassmorphic-card">
                <Compass size={64} className="mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No adventures posted yet!</h2>
                <p className="text-muted-foreground mb-6">Be the first to share your travel story or explore what others have shared.</p>
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/create">Create Your First Post</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map(post => (
                  <div key={post.id} onClick={() => handlePostCardClickInList(post)} className="cursor-pointer">
                    <PostCard post={post} onLikeUpdate={handleLikeUpdateInList} />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
      </div>
      
      <Sheet open={!!selectedPostForSheet} onOpenChange={(isOpen) => { if (!isOpen) setSelectedPostForSheet(null); }}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 glassmorphic-card border-none z-[1000]" side="right">
          {selectedPostForSheet && (
            <ScrollArea className="h-full">
              <SheetHeader className="p-6 pb-2 sr-only">
                <SheetTitle className="sr-only">{selectedPostForSheet.title}</SheetTitle>
                <SheetDescription className="sr-only">Detailed view of: {selectedPostForSheet.description.substring(0,100)}</SheetDescription>
              </SheetHeader>
              <div className="p-1">
                <PostCard post={selectedPostForSheet} onLikeUpdate={handleLikeUpdateInList}/>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
