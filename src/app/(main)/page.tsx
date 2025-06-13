
'use client';

import InteractiveMap from '@/components/map/InteractiveMap';
import PostCard from '@/components/posts/PostCard';
import { db } from '@/lib/firebase';
import type { Post, UserProfile } from '@/types';
import { collection, getDocs, orderBy, query, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { List, Map, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsCollection = collection(db, 'posts');
        const q = query(postsCollection, orderBy('createdAt', 'desc'));
        const postsSnapshot = await getDocs(q);
        
        // Simpler mapping, initially without fetching individual user profiles
        const postsData = postsSnapshot.docs.map((docSnapshot) => {
          const post = { id: docSnapshot.id, ...docSnapshot.data() } as Post;
          
          if (post.createdAt && typeof (post.createdAt as Timestamp).toDate === 'function') {
            post.createdAtDate = (post.createdAt as Timestamp).toDate();
          } else if (post.createdAt instanceof Date) {
             post.createdAtDate = post.createdAt;
          }
          // User data can be fetched later if needed, or denormalized onto post documents
          // For now, PostCard will handle missing user data
          return post;
        });
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
        // Handle error (e.g., show toast)
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handlePostMarkerClick = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      // If we need user data for the selected post specifically, we could fetch it here
      // For now, the selectedPost will be what was fetched in the list (without user initially)
      setSelectedPost(post);
    }
  };
  
  const handleLikeUpdateInList = (postId: string, newLikes: string[]) => {
    setPosts(currentPosts => 
      currentPosts.map(p => 
        p.id === postId ? { ...p, likes: newLikes } : p
      )
    );
     if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, likes: newLikes } : null);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 flex justify-end space-x-2 bg-background/80 backdrop-blur">
         <Button variant={viewMode === 'map' ? 'default' : 'outline'} onClick={() => setViewMode('map')} size="sm">
            <Map className="mr-2 h-4 w-4" /> Map View
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')} size="sm">
            <List className="mr-2 h-4 w-4" /> List View
          </Button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'map' && (
          <InteractiveMap posts={posts} className="absolute inset-0" onPostClick={handlePostMarkerClick} />
        )}
        {viewMode === 'list' && (
          <ScrollArea className="h-full p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <PostCard key={post.id} post={post} onLikeUpdate={handleLikeUpdateInList} />
              ))}
            </div>
            {posts.length === 0 && <p className="text-center text-muted-foreground py-10">No posts yet. Be the first to share an adventure!</p>}
          </ScrollArea>
        )}
      </div>
      
      <Sheet open={!!selectedPost} onOpenChange={(isOpen) => !isOpen && setSelectedPost(null)}>
        <SheetContent className="w-full sm:max-w-lg p-0" side="right">
          {selectedPost && (
            <ScrollArea className="h-full">
              <SheetHeader className="p-6 pb-0">
                <SheetTitle className="sr-only">Post Details</SheetTitle>
                <SheetDescription className="sr-only">Detailed view of the selected travel post.</SheetDescription>
              </SheetHeader>
              <PostCard post={selectedPost} onLikeUpdate={handleLikeUpdateInList}/>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
