
'use client';

import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/card'; // CardContent, CardDescription, CardFooter removed
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Bookmark, Pin, MoreHorizontal } from 'lucide-react'; 
import type { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useAuth } from '@/contexts/AuthContext';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import Link from 'next/link'; // For username link

interface PostCardProps {
  post: Post;
  onLikeUpdate?: (postId: string, newLikes: string[]) => void;
  onSaveUpdate?: (postId: string, newSavedBy: string[]) => void;
  onPostClickForSheet?: (post: Post) => void; // Optional handler to open sheet
}

export default function PostCard({ post, onLikeUpdate, onSaveUpdate, onPostClickForSheet }: PostCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);

  useEffect(() => {
    setIsLiked(currentUser && post.likes ? post.likes.includes(currentUser.uid) : false);
    setLikeCount(post.likes ? post.likes.length : 0);
    setIsSaved(currentUser && post.savedBy ? post.savedBy.includes(currentUser.uid) : false);
  }, [post.likes, post.savedBy, currentUser]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click if like button is inside clickable area
    if (!currentUser) {
      toast({ title: "Authentication Required", description: "Please login to like posts.", variant: "destructive" });
      return;
    }
    const postRef = doc(db, 'posts', post.id);
    const newLikedStatus = !isLiked;
    
    setIsLiked(newLikedStatus);
    setLikeCount(prevCount => newLikedStatus ? prevCount + 1 : prevCount - 1);
    
    const updatedLikesArray = newLikedStatus
      ? arrayUnion(currentUser.uid)
      : arrayRemove(currentUser.uid);

    try {
      await updateDoc(postRef, { likes: updatedLikesArray });
      if (onLikeUpdate) {
        const currentLikes = post.likes || [];
        const finalLikes = newLikedStatus 
            ? [...currentLikes, currentUser.uid] 
            : currentLikes.filter(uid => uid !== currentUser.uid);
        onLikeUpdate(post.id, finalLikes);
      }
    } catch (error) {
      console.error("Error updating like:", error);
      toast({ title: "Error", description: "Could not update like status.", variant: "destructive" });
      setIsLiked(!newLikedStatus); 
      setLikeCount(prevCount => newLikedStatus ? prevCount -1 : prevCount + 1);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      toast({ title: "Authentication Required", description: "Please login to save posts.", variant: "destructive" });
      return;
    }
    const postRef = doc(db, 'posts', post.id);
    const newSavedStatus = !isSaved;

    setIsSaved(newSavedStatus);

    const updatedSavedByArray = newSavedStatus
        ? arrayUnion(currentUser.uid)
        : arrayRemove(currentUser.uid);
    
    try {
        await updateDoc(postRef, { savedBy: updatedSavedByArray, lastUpdated: new Date() }); // Add lastUpdated
        if (onSaveUpdate) {
            const currentSavedBy = post.savedBy || [];
            const finalSavedBy = newSavedStatus
                ? [...currentSavedBy, currentUser.uid]
                : currentSavedBy.filter(uid => uid !== currentUser.uid);
            onSaveUpdate(post.id, finalSavedBy);
        }
    } catch (error) {
        console.error("Error updating save status:", error);
        toast({ title: "Error", description: "Could not update save status.", variant: "destructive" });
        setIsSaved(!newSavedStatus); 
    }
  };
  
  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPostClickForSheet) {
      onPostClickForSheet(post); // Open sheet to view details/comments
    } else {
      toast({ title: "Feature Coming Soon", description: "Detailed view for comments is under development."});
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Basic share functionality (copy link)
    navigator.clipboard.writeText(`${window.location.origin}/?postId=${post.id}`)
      .then(() => {
        toast({ title: "Link Copied!", description: "Post link copied to clipboard." });
      })
      .catch(err => {
        toast({ title: "Error", description: "Could not copy link.", variant: "destructive"});
      });
  };


  const postDate = post.createdAtDate || (post.createdAt instanceof Date ? post.createdAt : post.createdAt?.toDate());
  const timeAgo = postDate ? formatDistanceToNow(postDate, { addSuffix: true }) : 'Unknown date';
  const userName = post.user?.name || 'Anonymous';
  const userUsername = post.user?.username || userName.toLowerCase().replace(/\s+/g, '_');
  const userAvatar = post.user?.avatar || `https://placehold.co/40x40.png?text=${userName.charAt(0)}`;
  const commentCount = post.commentCount ?? 0;

  const captionNeedsTruncation = post.caption.length > 100;

  const handleCardClick = () => {
    if (onPostClickForSheet) {
      onPostClickForSheet(post);
    }
  };

  return (
    <Card className="w-full overflow-hidden glassmorphic-card shadow-lg rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-x-3 p-3 md:p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
            <AvatarImage src={userAvatar} alt={userName} data-ai-hint="person portrait" />
            <AvatarFallback className="text-base md:text-lg bg-muted text-muted-foreground">{userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {/* TODO: Link to user profile page if available */}
            <span className="text-sm font-semibold text-foreground truncate hover:underline cursor-pointer">{userUsername}</span>
            {post.locationLabel && (
              <p className="text-xs text-muted-foreground flex items-center mt-0.5 truncate" title={post.locationLabel}>
                <Pin size={11} className="mr-1 flex-shrink-0 text-accent" /> {post.locationLabel}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <MoreHorizontal size={20}/>
            <span className="sr-only">More options</span>
        </Button>
      </CardHeader>
      
      {post.images && post.images.length > 0 && (
         <Carousel className="w-full" opts={{ loop: post.images.length > 1 }}>
          <CarouselContent>
            {post.images.map((imgUrl, index) => (
              <CarouselItem key={index} onClick={handleCardClick} className="cursor-pointer">
                <div className="relative aspect-square w-full"> {/* Instagram often uses square or near-square */}
                  <Image 
                    src={imgUrl} 
                    alt={`${post.title} image ${index + 1}`} 
                    fill
                    sizes="(max-width: 640px) 100vw, 640px" // Adjusted for single column feed
                    className="object-cover"
                    data-ai-hint="travel landscape"
                    priority={index === 0}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {post.images.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white h-7 w-7 md:h-8 md:w-8" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white h-7 w-7 md:h-8 md:w-8" />
            </>
          )}
        </Carousel>
      )}

      <div className="p-3 md:p-4 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 md:space-x-3">
            <Button variant="ghost" size="icon" onClick={handleLike} className="text-foreground/80 hover:text-foreground">
              <Heart className={`h-6 w-6 md:h-7 md:w-7 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
              <span className="sr-only">Like</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCommentClick} className="text-foreground/80 hover:text-foreground">
              <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
              <span className="sr-only">Comment</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShareClick} className="text-foreground/80 hover:text-foreground">
              <Share2 className="h-6 w-6 md:h-7 md:w-7" />
              <span className="sr-only">Share</span>
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSave} className="text-foreground/80 hover:text-foreground">
            <Bookmark className={`h-6 w-6 md:h-7 md:w-7 ${isSaved ? 'fill-foreground text-foreground' : ''}`} /> 
            <span className="sr-only">Save</span>
          </Button>
        </div>

        {likeCount > 0 && (
          <p className="font-semibold text-sm text-foreground">{likeCount} {likeCount === 1 ? 'like' : 'likes'}</p>
        )}
        
        {/* Post Title - kept for context, Instagram usually omits */}
        <CardTitle className="text-base font-semibold text-foreground">{post.title}</CardTitle>
        
        <div className="text-sm text-foreground/90">
          <Link href={`/user/${userUsername}`} passHref> {/* Placeholder link */}
            <span className="font-semibold cursor-pointer hover:underline">{userUsername}</span>
          </Link>
          <span className={`ml-1 ${showFullCaption ? '' : 'line-clamp-2'}`}>
            {post.caption}
          </span>
          {captionNeedsTruncation && !showFullCaption && (
            <button onClick={(e) => { e.stopPropagation(); setShowFullCaption(true); }} className="text-muted-foreground hover:text-foreground text-xs ml-1">
              more
            </button>
          )}
        </div>

        {commentCount > 0 && (
          <p onClick={handleCommentClick} className="text-sm text-muted-foreground cursor-pointer hover:underline">
            View all {commentCount} comments
          </p>
        )}
         {commentCount === 0 && (
             <p onClick={handleCommentClick} className="text-sm text-muted-foreground cursor-pointer hover:underline">
                Add a comment...
             </p>
         )}

        <p className="text-xs text-muted-foreground pt-1">{timeAgo}</p>
      </div>
    </Card>
  );
}
