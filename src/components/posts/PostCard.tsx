
'use client';

import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Bookmark, Pin, MoreHorizontal, Link2,Twitter, FacebookIcon, MessageCircle as WhatsAppIcon, LinkedinIcon } from 'lucide-react';
import type { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useAuth } from '@/contexts/AuthContext';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
// import Link from 'next/link'; // Keep Link for actual navigation later
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: Post;
  onLikeUpdate?: (postId: string, newLikes: string[]) => void;
  onSaveUpdate?: (postId: string, newSavedBy: string[]) => void;
  onPostClickForSheet?: (post: Post) => void;
  isDetailedView?: boolean; // To control some behavior if card is in a sheet/modal
}

export default function PostCard({ post, onLikeUpdate, onSaveUpdate, onPostClickForSheet, isDetailedView = false }: PostCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(isDetailedView); // Show full caption if in detailed view

  useEffect(() => {
    setIsLiked(currentUser && post.likes ? post.likes.includes(currentUser.uid) : false);
    setLikeCount(post.likes ? post.likes.length : 0);
    setIsSaved(currentUser && post.savedBy ? post.savedBy.includes(currentUser.uid) : false);
  }, [post.likes, post.savedBy, currentUser]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      await updateDoc(postRef, { likes: updatedLikesArray, lastUpdated: new Date() });
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
        await updateDoc(postRef, { savedBy: updatedSavedByArray, lastUpdated: new Date() });
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
    if (onPostClickForSheet && !isDetailedView) {
      onPostClickForSheet(post);
    } else if (isDetailedView) {
      // Focus comment input if already in detailed view
      document.getElementById(`comment-input-${post.id}`)?.focus();
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'whatsapp' | 'linkedin' | 'copy') => {
    const postUrl = `${window.location.origin}/?postId=${post.id}`; // Adjust if map page uses different query param
    const postTitle = post.title;
    const postCaptionSummary = post.caption.substring(0, 100) + (post.caption.length > 100 ? '...' : '');

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postTitle)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(postTitle + " - " + postUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(postTitle)}&summary=${encodeURIComponent(postCaptionSummary)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(postUrl)
          .then(() => toast({ title: "Link Copied!", description: "Post link copied to clipboard." }))
          .catch(() => toast({ title: "Error", description: "Could not copy link.", variant: "destructive" }));
        return; 
    }
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };


  const postDate = post.createdAtDate || (post.createdAt instanceof Date ? post.createdAt : post.createdAt?.toDate());
  const timeAgo = postDate ? formatDistanceToNow(postDate, { addSuffix: true }) : 'Unknown date';
  const userName = post.user?.name || 'Anonymous';
  const userUsername = post.user?.username || userName.toLowerCase().replace(/\s+/g, '_');
  const userAvatar = post.user?.avatar || `https://placehold.co/40x40.png?text=${userName.charAt(0)}`;
  const commentCount = post.commentCount ?? 0;

  const captionNeedsTruncation = post.caption.length > 100 && !isDetailedView;

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click if clicking on an interactive element already
    if ((e.target as HTMLElement).closest('button, a, input, textarea')) {
        return;
    }
    if (onPostClickForSheet && !isDetailedView) {
      onPostClickForSheet(post);
    }
  };

  const handleAuthorProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Navigate to profile of: ${post.user?.uid || userUsername}`);
    // router.push(`/user/${post.user?.uid || userUsername}`); // Actual navigation
    toast({title: "Profile Navigation", description: `Would navigate to ${userUsername}'s profile.`});
  };


  return (
    <Card className="w-full overflow-hidden glassmorphic-card shadow-lg rounded-xl" onClick={handleCardClick} role={!isDetailedView ? "button" : undefined} tabIndex={!isDetailedView ? 0 : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-x-3 p-3 md:p-4">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={handleAuthorProfileClick}>
          <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
            <AvatarImage src={userAvatar} alt={userName} data-ai-hint="person portrait" />
            <AvatarFallback className="text-base md:text-lg bg-muted text-muted-foreground">{userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate hover:underline">{userUsername}</span>
            {post.locationLabel && (
              <p className="text-xs text-muted-foreground flex items-center mt-0.5 truncate" title={post.locationLabel}>
                <Pin size={11} className="mr-1 flex-shrink-0 text-accent" /> {post.locationLabel}
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal size={20}/>
                    <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {e.stopPropagation(); console.log("Report post", post.id)}}>Report</DropdownMenuItem>
                {currentUser?.uid === post.userId && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {e.stopPropagation(); console.log("Edit post", post.id)}}>Edit Post</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={(e) => {e.stopPropagation(); console.log("Delete post", post.id)}}>Delete Post</DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      {post.images && post.images.length > 0 && (
         <Carousel className="w-full" opts={{ loop: post.images.length > 1 }}>
          <CarouselContent>
            {post.images.map((imgUrl, index) => (
              <CarouselItem key={index} onClick={!isDetailedView ? () => onPostClickForSheet?.(post) : undefined} className={!isDetailedView ? "cursor-pointer" : ""}>
                <div className="relative aspect-square w-full">
                  <Image 
                    src={imgUrl} 
                    alt={`${post.title} image ${index + 1}`} 
                    fill
                    sizes="(max-width: 640px) 100vw, 640px"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                  <Share2 className="h-6 w-6 md:h-7 md:w-7" />
                  <span className="sr-only">Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleShare('copy');}}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleShare('twitter');}}>
                  <Twitter className="mr-2 h-4 w-4" />
                  Share on X (Twitter)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleShare('facebook');}}>
                  <FacebookIcon className="mr-2 h-4 w-4" />
                  Share on Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleShare('whatsapp');}}>
                  <WhatsAppIcon className="mr-2 h-4 w-4" />
                  Share on WhatsApp
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleShare('linkedin');}}>
                  <LinkedinIcon className="mr-2 h-4 w-4" />
                  Share on LinkedIn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSave} className="text-foreground/80 hover:text-foreground">
            <Bookmark className={`h-6 w-6 md:h-7 md:w-7 ${isSaved ? 'fill-foreground text-foreground' : ''}`} /> 
            <span className="sr-only">Save</span>
          </Button>
        </div>

        {likeCount > 0 && (
          <p className="font-semibold text-sm text-foreground">{likeCount} {likeCount === 1 ? 'like' : 'likes'}</p>
        )}
        
        <CardTitle className="text-base font-semibold text-foreground">{post.title}</CardTitle>
        
        <div className="text-sm text-foreground/90">
          <span className="font-semibold cursor-pointer hover:underline" onClick={handleAuthorProfileClick}>
            {userUsername}
          </span>
          <span className={`ml-1 ${showFullCaption || isDetailedView ? '' : 'line-clamp-2'}`}>
            {post.caption}
          </span>
          {captionNeedsTruncation && !showFullCaption && !isDetailedView && (
            <button onClick={(e) => { e.stopPropagation(); setShowFullCaption(true); }} className="text-muted-foreground hover:text-foreground text-xs ml-1">
              more
            </button>
          )}
        </div>

        {!isDetailedView && commentCount > 0 && (
          <p onClick={(e) => { e.stopPropagation(); if (onPostClickForSheet) onPostClickForSheet(post);}} className="text-sm text-muted-foreground cursor-pointer hover:underline">
            View all {commentCount} comments
          </p>
        )}
         {!isDetailedView && commentCount === 0 && (
             <p onClick={(e) => { e.stopPropagation(); if (onPostClickForSheet) onPostClickForSheet(post);}} className="text-sm text-muted-foreground cursor-pointer hover:underline">
                Add a comment...
             </p>
         )}

        <p className="text-xs text-muted-foreground pt-1">{timeAgo}</p>
      </div>
    </Card>
  );
}
