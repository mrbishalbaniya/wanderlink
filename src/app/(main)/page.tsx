
'use client';

import PostCard from '@/components/posts/PostCard';
import { db } from '@/lib/firebase';
import type { Post, UserProfile, Comment as CommentType } from '@/types';
import { collection, onSnapshot, orderBy, query, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { Loader2, Compass, PlusCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() { 
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
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
              userId: postData.userId || '',
              title: postData.title || 'Untitled Post',
              caption: postData.caption || '',
              coordinates: postData.coordinates || { latitude: 0, longitude: 0 },
              locationLabel: postData.locationLabel || undefined,
              category: postData.category || 'other',
              images: postData.images || [],
              likes: postData.likes || [],
              savedBy: postData.savedBy || [],
              commentCount: postData.commentCount ?? 0,
              createdAt: postData.createdAt, 
              ...postData 
            };
            
            if (postData.createdAt) {
              if (postData.createdAt instanceof Timestamp) {
                post.createdAtDate = postData.createdAt.toDate();
              } else if (postData.createdAt instanceof Date) {
                post.createdAtDate = postData.createdAt;
              } else if (typeof postData.createdAt === 'object' && (postData.createdAt as any).seconds) {
                post.createdAtDate = new Timestamp((postData.createdAt as any).seconds, (postData.createdAt as any).nanoseconds).toDate();
              }
            }

            if (postData.userId) {
              const userRef = doc(db, 'users', postData.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data() as Omit<UserProfile, 'uid'>;
                post.user = { uid: userSnap.id, ...userData } as UserProfile;

                if (userData.joinedAt) {
                  if (userData.joinedAt instanceof Timestamp) {
                    post.user.joinedAtDate = userData.joinedAt.toDate();
                  } else if (userData.joinedAt instanceof Date) {
                    post.user.joinedAtDate = userData.joinedAt;
                  } else if (typeof userData.joinedAt === 'object' && (userData.joinedAt as any).seconds) {
                     post.user.joinedAtDate = new Timestamp((userData.joinedAt as any).seconds, (userData.joinedAt as any).nanoseconds).toDate();
                  }
                }
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
            return null; 
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


  const handleLikeUpdateInHome = useCallback((postId: string, newLikes: string[]) => {
    setPosts(currentPosts => 
      currentPosts.map(p => 
        p.id === postId ? { ...p, likes: newLikes } : p
      )
    );
  }, []);

  const handleSaveUpdateInHome = useCallback((postId: string, newSavedBy: string[]) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.id === postId ? { ...p, savedBy: newSavedBy } : p
      )
    );
  }, []);


  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center pb-4 sticky top-0 z-10 bg-background/80 dark:bg-background/70 backdrop-blur-md pt-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-headline text-primary text-center md:text-left">Explore Adventures</h1>
          <p className="text-sm text-muted-foreground text-center md:text-left">Discover new destinations and experiences shared by the community.</p>
        </div>
        {currentUser && (
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Post
            </Link>
            </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {posts.length === 0 && !loading ? (
          <div className="text-center py-20 glassmorphic-card max-w-lg mx-auto">
            <Compass size={64} className="mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Nothing to explore yet!</h2>
            <p className="text-muted-foreground mb-6">Be the first to share an adventure, or check back soon.</p>
            {currentUser && (
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/create">Share Your Adventure</Link>
                </Button>
            )}
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-8 pb-8">
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLikeUpdate={handleLikeUpdateInHome} 
                onSaveUpdate={handleSaveUpdateInHome}
                // No onPostClickForDialog passed from Home page
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
