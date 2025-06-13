
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Pin } from 'lucide-react'; // Added Pin
import type { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useAuth } from '@/contexts/AuthContext';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface PostCardProps {
  post: Post;
  onLikeUpdate?: (postId: string, newLikes: string[]) => void;
  onSaveUpdate?: (postId: string, newSavedBy: string[]) => void;
}

export default function PostCard({ post, onLikeUpdate, onSaveUpdate }: PostCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsLiked(currentUser && post.likes ? post.likes.includes(currentUser.uid) : false);
    setLikeCount(post.likes ? post.likes.length : 0);
    setIsSaved(currentUser && post.savedBy ? post.savedBy.includes(currentUser.uid) : false);
  }, [post.likes, post.savedBy, currentUser]);


  const handleLike = async () => {
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

  const handleSave = async () => {
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
        await updateDoc(postRef, { savedBy: updatedSavedByArray });
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


  const postDate = post.createdAtDate || (post.createdAt instanceof Date ? post.createdAt : post.createdAt?.toDate());
  const timeAgo = postDate ? formatDistanceToNow(postDate, { addSuffix: true }) : 'Unknown date';
  const userName = post.user?.name || 'Anonymous';
  const userAvatar = post.user?.avatar || `https://placehold.co/40x40.png?text=${userName.charAt(0)}`;
  const userGeneralLocation = post.user?.currentLocation?.address || null;

  return (
    <Card className="w-full overflow-hidden glassmorphic-card">
      <CardHeader className="flex flex-row items-start space-x-3 p-4 md:p-6">
        <Avatar className="h-11 w-11 flex-shrink-0">
          <AvatarImage src={userAvatar} alt={userName} data-ai-hint="person portrait" />
          <AvatarFallback className="text-lg bg-muted text-muted-foreground">{userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-foreground truncate hover:underline cursor-pointer">{userName}</span>
            <span className="text-xs text-muted-foreground">&bull;</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          {post.locationLabel && (
            <p className="text-xs text-muted-foreground flex items-center mt-0.5 truncate" title={post.locationLabel}>
              <Pin size={12} className="mr-1 flex-shrink-0 text-accent" /> {post.locationLabel}
            </p>
          )}
           {userGeneralLocation && !post.locationLabel && (
             <p className="text-xs text-muted-foreground flex items-center mt-0.5 truncate" title={userGeneralLocation}>
                <MapPin size={12} className="mr-1 flex-shrink-0" /> {userGeneralLocation}
             </p>
           )}
        </div>
      </CardHeader>
      
      {post.images && post.images.length > 0 && (
         <Carousel className="w-full">
          <CarouselContent>
            {post.images.map((imgUrl, index) => (
              <CarouselItem key={index}>
                <div className="relative aspect-[4/3] w-full"> {/* Adjusted aspect ratio */}
                  <Image 
                    src={imgUrl} 
                    alt={`${post.title} image ${index + 1}`} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
              <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/80 text-foreground" />
              <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/80 text-foreground" />
            </>
          )}
        </Carousel>
      )}

      <CardContent className="p-4 md:p-6 space-y-2">
        <CardTitle className="text-lg font-headline font-semibold">{post.title}</CardTitle>
        <p className="text-sm text-foreground/90 dark:text-foreground/80 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all duration-200 pr-1 max-h-20 hover:max-h-none overflow-y-auto">
          {post.caption}
        </p>
        <p className="text-xs text-muted-foreground">
            Category: {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
        </p>
      </CardContent>

      <CardFooter className="flex justify-between items-center p-4 md:p-6 border-t">
        <div className="flex space-x-2 md:space-x-3">
          <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center space-x-1.5 text-muted-foreground hover:text-primary">
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-destructive text-destructive' : 'text-foreground/70'}`} />
            <span className="font-medium">{likeCount}</span>
            <span className="hidden sm:inline">{likeCount === 1 ? 'Like' : 'Likes'}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-1.5 text-muted-foreground hover:text-primary">
            <MessageCircle className="h-5 w-5 text-foreground/70" />
            <span className="hidden sm:inline">Comment</span> 
          </Button>
        </div>
        <div className="flex space-x-1 md:space-x-2">
          <Button variant="ghost" size="icon" onClick={handleSave} className="text-muted-foreground hover:text-primary">
            <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-accent text-accent' : 'text-foreground/70'}`} /> 
            <span className="sr-only">Save</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Share2 className="h-5 w-5 text-foreground/70" />
             <span className="sr-only">Share</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
