
'use client';

import InteractiveMap from '@/components/map/InteractiveMap';
import PostCard from '@/components/posts/PostCard';
import { db } from '@/lib/firebase';
import type { Post, UserProfile, Comment as CommentType, UserProfileLite } from '@/types';
import { collection, getDocs, orderBy, query, doc, getDoc, Timestamp, limit, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, Globe, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Map as LeafletMap } from 'leaflet';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; 
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';


export default function MapPage() {
  const { currentUser, userProfile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostForDialog, setSelectedPostForDialog] = useState<Post | null>(null);
  const [selectedPostComments, setSelectedPostComments] = useState<CommentType[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const mapRefForPopupClose = useRef<LeafletMap | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const postIdFromQuery = searchParams.get('postId');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const postsCollection = collection(db, 'posts');
      const q = query(postsCollection, orderBy('createdAt', 'desc'));
      const postsSnapshot = await getDocs(q);
      
      const postsDataPromises = postsSnapshot.docs.map(async (docSnapshot) => {
        try {
          const postData = docSnapshot.data();
          const post: Post = { 
            id: docSnapshot.id,
            userId: postData.userId || '',
            title: postData.title || 'Untitled Post',
            caption: postData.caption || '',
            coordinates: postData.coordinates || { latitude: 0, longitude: 0 },
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
            } else {
              post.user = undefined;
              console.warn(`User profile not found for userId: ${postData.userId} on post ${post.id}`);
            }
          }
          return post;
        } catch (postError) {
          console.error(`Error processing post ${docSnapshot.id} for map:`, postError);
          return null; 
        }
      });
      
      const resolvedPostsData = await Promise.all(postsDataPromises);
      const validPostsData = resolvedPostsData.filter(p => p !== null) as Post[];
      setPosts(validPostsData);

    } catch (error) {
      console.error("Error fetching posts for map:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);


  const fetchCommentsForSelectedPost = useCallback(async (postId: string) => {
    if (!postId) return;
    setIsLoadingComments(true);
    setSelectedPostComments([]);
    try {
      const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
      const q = query(commentsCollectionRef, orderBy('createdAt', 'desc'), limit(20));
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
           try {
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
            } else {
              console.warn(`User profile for commenter ${data.userId} not found on comment ${comment.id} (map view).`);
              comment.user = { uid: data.userId, name: 'Unknown User', avatar: `https://placehold.co/40x40.png?text=?` };
            }
          } catch (userFetchError) {
            console.error(`Error fetching profile for commenter ${data.userId} on comment ${comment.id} (map view):`, userFetchError);
            comment.user = { uid: data.userId, name: 'Error Loading User', avatar: `https://placehold.co/40x40.png?text=E` };
          }
        }
        return comment;
      });
      const resolvedComments = (await Promise.all(commentsDataPromises)).filter(c => c !== null) as CommentType[];
      setSelectedPostComments(resolvedComments);
    } catch (error) {
      console.error("Error fetching comments for map post:", error);
      toast({ title: "Error", description: "Could not fetch comments.", variant: "destructive" });
    } finally {
      setIsLoadingComments(false);
    }
  }, [toast]);

  const handlePostMarkerClickOnMap = useCallback((postId: string) => {
    mapRefForPopupClose.current?.closePopup(); 
    const postToView = posts.find(p => p.id === postId);
    if (postToView) {
        setSelectedPostForDialog(postToView);
        fetchCommentsForSelectedPost(postToView.id); 
    } else {
        console.warn("Post ID from marker click not found in local posts array:", postId);
    }
  }, [posts, fetchCommentsForSelectedPost]);
  
  const handleLikeUpdateInDialog = useCallback((postId: string, newLikes: string[]) => {
    setPosts(currentPosts => 
      currentPosts.map(p => 
        p.id === postId ? { ...p, likes: newLikes } : p
      )
    );
     if (selectedPostForDialog && selectedPostForDialog.id === postId) {
      setSelectedPostForDialog(prev => prev ? { ...prev, likes: newLikes } : null);
    }
  }, [selectedPostForDialog]);

  const handleSaveUpdateInDialog = useCallback((postId: string, newSavedBy: string[]) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.id === postId ? { ...p, savedBy: newSavedBy } : p
      )
    );
    if (selectedPostForDialog && selectedPostForDialog.id === postId) {
      setSelectedPostForDialog(prev => prev ? { ...prev, savedBy: newSavedBy } : null);
    }
  }, [selectedPostForDialog]);

  const handleDialogOnOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
        setSelectedPostForDialog(null);
        setSelectedPostComments([]);
        setNewCommentText('');
         if (postIdFromQuery) { 
            router.replace(pathname, { scroll: false }); 
        }
    }
  }, [postIdFromQuery, router, pathname]);

  const setMapInstanceCb = useCallback((mapInstance: LeafletMap | null) => {
    mapRefForPopupClose.current = mapInstance;
  }, []);

  const handlePostCommentOnMap = async () => {
    if (!currentUser || !currentUserProfile) {
      toast({ title: "Login Required", description: "Please login to comment.", variant: "destructive" });
      return;
    }
    if (!selectedPostForDialog || !newCommentText.trim()) {
      toast({ title: "Cannot Post", description: "Comment text cannot be empty.", variant: "destructive" });
      return;
    }
    
    setIsSubmittingComment(true);
    const commentText = newCommentText.trim();
    
    try {
      const postDocRef = doc(db, 'posts', selectedPostForDialog.id);
      const commentsCollectionRef = collection(postDocRef, 'comments');

      const newCommentData = {
        userId: currentUser.uid,
        postId: selectedPostForDialog.id,
        text: commentText,
        createdAt: serverTimestamp(),
      };
      
      const newCommentDocRef = await addDoc(commentsCollectionRef, newCommentData);
      await updateDoc(postDocRef, { commentCount: increment(1) });

      const optimisticComment: CommentType = {
        id: newCommentDocRef.id,
        ...newCommentData,
        createdAtDate: new Date(),
        user: {
          uid: currentUser.uid,
          name: currentUserProfile.name || 'User',
          username: currentUserProfile.username,
          avatar: currentUserProfile.avatar,
        },
      };

      setSelectedPostComments(prevComments => [optimisticComment, ...prevComments]);
      setSelectedPostForDialog(prevSelectedPost => prevSelectedPost ? { ...prevSelectedPost, commentCount: (prevSelectedPost.commentCount || 0) + 1 } : null);
      setPosts(prevPosts => prevPosts.map(p => p.id === selectedPostForDialog.id ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
      
      setNewCommentText('');
      toast({ 
        title: "Comment Posted!", 
        description: "Your comment has been added.",
        className: "bg-accent text-accent-foreground"
      });

    } catch (error: any) {
      console.error("Error posting comment on map page:", error);
      toast({ title: "Error", description: `Could not post comment: ${error.message}`, variant: "destructive"});
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUserProfileClick = (e: React.MouseEvent, userId?: string, username?: string) => {
    e.stopPropagation();
    if (!userId) return;
    console.log(`Navigate to profile of user ID: ${userId}, Username: ${username || 'N/A'}`);
    toast({
      title: "Profile Navigation (Placeholder)", 
      description: `Would navigate to ${username || userId}'s profile. This feature is not yet implemented.`,
      className: "bg-primary text-primary-foreground"
    });
  };


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

      <div className="flex-1 overflow-hidden relative rounded-xl shadow-soft-lg z-10">
        {posts.length === 0 && !loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-muted rounded-xl">
                <Globe size={80} className="text-muted-foreground/30 mb-6" />
                <h2 className="text-2xl font-semibold text-foreground mb-3">The Map is Quiet... For Now</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                No adventures have been plotted on the map yet. Why not be the first to share yours?
                </p>
                 <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href="/create">Share Your Adventure</Link>
                </Button>
            </div>
        ) : (
            <InteractiveMap 
                posts={posts} 
                className="absolute inset-0" 
                onPostClick={handlePostMarkerClickOnMap} 
                setMapInstance={setMapInstanceCb}
            />
        )}
      </div>
      
      <Dialog 
        open={!!selectedPostForDialog} 
        onOpenChange={handleDialogOnOpenChange}
      >
        <DialogContent className="max-w-xl w-full p-0 glassmorphic-card border-none flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
          {selectedPostForDialog && (
            <>
              <DialogHeader className="p-4 pb-2 border-b border-border/30">
                <DialogTitle className="text-lg font-semibold text-center">{selectedPostForDialog.title}</DialogTitle>
                {selectedPostForDialog.user && (
                     <DialogDescription className="text-xs text-muted-foreground text-center">
                        Posted by <span className="font-medium text-primary cursor-pointer hover:underline" onClick={(e) => handleUserProfileClick(e, selectedPostForDialog.user?.uid, selectedPostForDialog.user?.username)}>{selectedPostForDialog.user.username || selectedPostForDialog.user.name}</span>
                     </DialogDescription>
                )}
              </DialogHeader>
              <ScrollArea className="flex-1 min-h-0"> 
                <div className="p-1">
                  <PostCard 
                    post={selectedPostForDialog} 
                    onLikeUpdate={handleLikeUpdateInDialog} 
                    onSaveUpdate={handleSaveUpdateInDialog}
                    isDetailedView={true}
                  />
                </div>
                <div className="px-4 py-3 border-t border-border/30">
                  <h3 className="text-md font-semibold mb-3 text-foreground flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                    Comments ({selectedPostForDialog.commentCount || selectedPostComments?.length || 0})
                  </h3>
                  {isLoadingComments ? (
                    <div className="flex justify-center items-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : selectedPostComments.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {selectedPostComments.map(comment => (
                        <div key={comment.id} className="flex items-start space-x-2.5 text-sm">
                           <Avatar className="h-7 w-7 cursor-pointer" onClick={(e) => handleUserProfileClick(e, comment.user?.uid, comment.user?.username)}>
                            <AvatarImage src={comment.user?.avatar} alt={comment.user?.name} data-ai-hint="person avatar"/>
                            <AvatarFallback className="text-xs bg-muted text-muted-foreground">{comment.user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p>
                              <span className="font-semibold text-foreground cursor-pointer hover:underline" onClick={(e) => handleUserProfileClick(e, comment.user?.uid, comment.user?.username)}>
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
                      <AvatarImage src={currentUserProfile?.avatar || undefined} alt={currentUserProfile?.name || "User"} data-ai-hint="person avatar"/>
                      <AvatarFallback className="text-sm bg-muted text-muted-foreground">
                        {(currentUserProfile?.name || currentUser.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <Textarea
                    id={`comment-input-map-${selectedPostForDialog.id}`}
                    placeholder="Add a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    rows={1}
                    className="flex-1 min-h-[40px] max-h-[100px] resize-none text-sm bg-input/70 dark:bg-muted/50"
                    disabled={!currentUser || isSubmittingComment}
                  />
                  <Button onClick={handlePostCommentOnMap} size="sm" className="h-10" disabled={!currentUser || !newCommentText.trim() || isSubmittingComment}>
                     {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
                  </Button>
                </div>
                 {!currentUser && <p className="text-xs text-muted-foreground text-center w-full pt-1">Please <Link href="/login" className="text-primary hover:underline">login</Link> to comment.</p>}
              </DialogFooter>
            </>
          )}
          {!selectedPostForDialog && (
             <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No post selected for map view.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
