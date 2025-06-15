
'use client';

import PostCard from '@/components/posts/PostCard';
import { db } from '@/lib/firebase';
import type { Post, UserProfile, Comment as CommentType, UserProfileLite } from '@/types';
import { collection, onSnapshot, orderBy, query, doc, getDoc, Timestamp, getDocs, limit } from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { Loader2, Compass, PlusCircle, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() { 
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedPostComments, setSelectedPostComments] = useState<CommentType[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  
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

  const fetchCommentsForPost = useCallback(async (postId: string) => {
    if (!postId) return;
    setIsLoadingComments(true);
    setSelectedPostComments([]); // Clear previous comments
    try {
      const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
      const q = query(commentsCollectionRef, orderBy('createdAt', 'desc'), limit(20)); // Fetch latest 20 comments
      const commentsSnapshot = await getDocs(q);
      
      const commentsDataPromises = commentsSnapshot.docs.map(async (commentDoc) => {
        const data = commentDoc.data();
        const comment: CommentType = {
          id: commentDoc.id,
          postId: postId,
          userId: data.userId,
          text: data.text,
          createdAt: data.createdAt,
        };
        if (data.createdAt && data.createdAt instanceof Timestamp) {
          comment.createdAtDate = data.createdAt.toDate();
        }

        if (data.userId) {
          const userRef = doc(db, 'users', data.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            comment.user = {
              uid: userSnap.id,
              name: userData.name || 'User',
              username: userData.username,
              avatar: userData.avatar || `https://placehold.co/40x40.png?text=${(userData.name || 'U').charAt(0)}`,
            };
          }
        }
        return comment;
      });
      const resolvedComments = await Promise.all(commentsDataPromises);
      setSelectedPostComments(resolvedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({ title: "Error", description: "Could not fetch comments.", variant: "destructive" });
    } finally {
      setIsLoadingComments(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!loading && posts.length > 0 && postIdFromQuery && !selectedPost) {
      const postToSelect = posts.find(p => p.id === postIdFromQuery);
      if (postToSelect) {
        setSelectedPost(postToSelect);
        fetchCommentsForPost(postToSelect.id);
      } else {
         router.replace(pathname, { scroll: false }); // Remove invalid postId
      }
    }
  }, [posts, loading, postIdFromQuery, router, pathname, selectedPost, fetchCommentsForPost]); 

  const handlePostCardClickForDialog = useCallback((post: Post) => {
    setSelectedPost(post);
    fetchCommentsForPost(post.id);
  }, [fetchCommentsForPost]);

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

  const handleDialogOnOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setSelectedPost(null);
      setSelectedPostComments([]);
      setNewCommentText('');
      if (postIdFromQuery) {
          router.replace(pathname, { scroll: false }); 
      }
    }
  }, [postIdFromQuery, router, pathname]);

  const handlePostComment = async () => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please login to comment.", variant: "destructive" });
      return;
    }
    if (!selectedPost || !newCommentText.trim()) {
      toast({ title: "Cannot Post", description: "Comment text cannot be empty.", variant: "destructive" });
      return;
    }
    // Placeholder for actual comment submission
    console.log(`Posting comment by ${currentUser.uid} on post ${selectedPost.id}: ${newCommentText}`);
    toast({ title: "Comment Posted (Placeholder)", description: "Actual submission to be implemented." });
    // In a real app: addDoc to posts/{selectedPost.id}/comments, update commentCount on post, then refetch comments or optimistically update UI.
    setNewCommentText(''); 
  };

  const handleUserProfileClick = (userId?: string, username?: string) => {
    if (!userId) return;
    console.log(`Navigate to profile of user ID: ${userId}, Username: ${username || 'N/A'}`);
    toast({title: "Profile Navigation", description: `Would navigate to ${username || userId}'s profile.`});
    // router.push(`/user/${username || userId}`);
  };


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
        <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Post
          </Link>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {posts.length === 0 && !loading ? (
          <div className="text-center py-20 glassmorphic-card max-w-lg mx-auto">
            <Compass size={64} className="mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Nothing to explore yet!</h2>
            <p className="text-muted-foreground mb-6">Be the first to share an adventure, or check back soon.</p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/create">Share Your Adventure</Link>
            </Button>
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-8 pb-8">
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLikeUpdate={handleLikeUpdateInHome} 
                onSaveUpdate={handleSaveUpdateInHome} 
                onPostClickForSheet={handlePostCardClickForDialog}
              />
            ))}
          </div>
        )}
      </ScrollArea>
      
      <Dialog 
        open={!!selectedPost} 
        onOpenChange={handleDialogOnOpenChange}
      >
        <DialogContent className="max-w-xl w-full p-0 glassmorphic-card border-none flex flex-col max-h-[90vh] sm:max-h-[85vh]">
          {selectedPost && (
            <>
              <DialogHeader className="p-4 pb-2 border-b border-border/30">
                <DialogTitle className="text-lg font-semibold text-center">{selectedPost.title}</DialogTitle>
                {selectedPost.user && (
                     <DialogDescription className="text-xs text-muted-foreground text-center">
                        Posted by <span className="font-medium text-primary cursor-pointer hover:underline" onClick={() => handleUserProfileClick(selectedPost.user?.uid, selectedPost.user?.username)}>{selectedPost.user.username || selectedPost.user.name}</span>
                     </DialogDescription>
                )}
              </DialogHeader>
              <ScrollArea className="flex-1">
                <div className="p-1"> {/* Padding for the card inside scroll area */}
                  <PostCard post={selectedPost} onLikeUpdate={handleLikeUpdateInHome} onSaveUpdate={handleSaveUpdateInHome} isDetailedView={true}/>
                </div>
                <div className="px-4 py-3 border-t border-border/30">
                  <h3 className="text-md font-semibold mb-3 text-foreground flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                    Comments ({selectedPost.commentCount || 0})
                  </h3>
                  {isLoadingComments ? (
                    <div className="flex justify-center items-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : selectedPostComments.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {selectedPostComments.map(comment => (
                        <div key={comment.id} className="flex items-start space-x-2.5 text-sm">
                          <Avatar className="h-7 w-7 cursor-pointer" onClick={() => handleUserProfileClick(comment.user?.uid, comment.user?.username)}>
                            <AvatarImage src={comment.user?.avatar} alt={comment.user?.name} data-ai-hint="person avatar"/>
                            <AvatarFallback className="text-xs bg-muted text-muted-foreground">{comment.user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p>
                              <span className="font-semibold text-foreground cursor-pointer hover:underline" onClick={() => handleUserProfileClick(comment.user?.uid, comment.user?.username)}>
                                {comment.user?.username || comment.user?.name}
                              </span>
                              <span className="text-foreground/90 ml-1.5">{comment.text}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {comment.createdAtDate ? formatDistanceToNow(comment.createdAtDate, { addSuffix: true }) : 'Replying...'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">No comments yet. Be the first!</p>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter className="p-4 border-t border-border/30 bg-background/80 backdrop-blur-sm">
                <div className="flex items-start space-x-2 w-full">
                  {currentUser && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} data-ai-hint="person avatar"/>
                      <AvatarFallback className="text-sm bg-muted text-muted-foreground">
                        {(currentUser.displayName || currentUser.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <Textarea
                    id={`comment-input-${selectedPost.id}`}
                    placeholder="Add a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    rows={1}
                    className="flex-1 min-h-[40px] max-h-[100px] resize-none text-sm bg-input/70 dark:bg-muted/50"
                    disabled={!currentUser}
                  />
                  <Button onClick={handlePostComment} size="sm" className="h-10" disabled={!currentUser || !newCommentText.trim()}>Post</Button>
                </div>
                {!currentUser && <p className="text-xs text-muted-foreground text-center w-full pt-1">Please <Link href="/login" className="text-primary hover:underline">login</Link> to comment.</p>}
              </DialogFooter>
            </>
          )}
           {!selectedPost && ( 
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No post selected.</p>
            </div>
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

