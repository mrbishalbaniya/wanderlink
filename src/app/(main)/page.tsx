
'use client';

import InteractiveMap from '@/components/map/InteractiveMap';
import PostCard from '@/components/posts/PostCard';
import { db } from '@/lib/firebase';
import type { Post, UserProfile } from '@/types';
import { collection, getDocs, orderBy, query, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { List, Map as MapIcon, Loader2, PlusCircle } from 'lucide-react'; // Renamed Map to MapIcon
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from 'next/link';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Default to list view
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const postsCollection = collection(db, 'posts');
      const q = query(postsCollection, orderBy('createdAt', 'desc'));
      const postsSnapshot = await getDocs(q);
      
      const postsData = await Promise.all(postsSnapshot.docs.map(async (docSnapshot) => {
        const post = { id: docSnapshot.id, ...docSnapshot.data() } as Post;
        
        // Convert Firestore Timestamp to Date for client-side use
        if (post.createdAt && typeof (post.createdAt as Timestamp).toDate === 'function') {
          post.createdAtDate = (post.createdAt as Timestamp).toDate();
        } else if (post.createdAt instanceof Date) {
           post.createdAtDate = post.createdAt;
        }

        // Fetch user profile for each post
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
      // Add user-facing error handling, e.g., toast notification
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostMarkerClick = useCallback((postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      if(window.innerWidth < 768) { // Open sheet if on mobile for map clicks
         // Sheet opening is handled by `open` prop on Sheet component
      }
    }
  }, [posts]);
  
  const handleLikeUpdateInList = useCallback((postId: string, newLikes: string[]) => {
    setPosts(currentPosts => 
      currentPosts.map(p => 
        p.id === postId ? { ...p, likes: newLikes } : p
      )
    );
     if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, likes: newLikes } : null);
    }
  }, [selectedPost]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]"> {/* Adjust height considering header */}
      <div className="p-4 flex justify-between items-center space-x-2 bg-background/80 dark:bg-background/70 backdrop-blur-md sticky top-16 z-30 shadow-sm"> {/* Header is 4rem (h-16) */}
        <div>
          <h1 className="text-2xl font-headline text-primary">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Discover and share amazing travel experiences.</p>
        </div>
        <div className="flex items-center space-x-2">
         <Button variant={viewMode === 'map' ? 'default' : 'outline'} onClick={() => setViewMode('map')} size="sm" className="rounded-lg">
            <MapIcon className="mr-2 h-4 w-4" /> Map View
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')} size="sm" className="rounded-lg">
            <List className="mr-2 h-4 w-4" /> List View
          </Button>
          <Button asChild size="sm" className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/create">
              <PlusCircle className="mr-2 h-4 w-4" /> New Post
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'map' && (
          <InteractiveMap posts={posts} className="absolute inset-0" onPostClick={handlePostMarkerClick} />
        )}
        {viewMode === 'list' && (
          <ScrollArea className="h-full p-4 md:p-6">
            {posts.length === 0 && !loading ? (
              <div className="text-center py-20">
                <MapIcon size={64} className="mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold text-muted-foreground mb-2">No adventures yet!</h2>
                <p className="text-muted-foreground mb-6">Be the first to share your travel story or explore the map.</p>
                <Button asChild size="lg">
                  <Link href="/create">Create Your First Post</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} onLikeUpdate={handleLikeUpdateInList} />
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
      
      <Sheet open={!!selectedPost} onOpenChange={(isOpen) => { if (!isOpen) setSelectedPost(null); }}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0" side="right">
          {selectedPost && (
            <ScrollArea className="h-full">
              <SheetHeader className="p-6 pb-2 sr-only"> {/* Title is in PostCard */}
                <SheetTitle className="sr-only">{selectedPost.title}</SheetTitle>
                <SheetDescription className="sr-only">Detailed view of: {selectedPost.description.substring(0,100)}</SheetDescription>
              </SheetHeader>
              <div className="p-1"> {/* Add a little padding around the card in the sheet */}
                <PostCard post={selectedPost} onLikeUpdate={handleLikeUpdateInList}/>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
