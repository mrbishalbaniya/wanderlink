
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
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
}

export default function PostCard({ post, onLikeUpdate }: PostCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [isLiked, setIsLiked] = useState(() => currentUser ? post.likes.includes(currentUser.uid) : false);
  const [likeCount, setLikeCount] = useState(post.likes.length);

  useEffect(() => {
    setIsLiked(currentUser ? post.likes.includes(currentUser.uid) : false);
    setLikeCount(post.likes.length);
  }, [post.likes, currentUser]);


  const handleLike = async () => {
    if (!currentUser) {
      toast({ title: "Authentication Required", description: "Please login to like posts.", variant: "destructive" });
      return;
    }
    const postRef = doc(db, 'posts', post.id);
    const newLikedStatus = !isLiked;
    const newLikeCount = newLikedStatus ? likeCount + 1 : likeCount - 1;

    setIsLiked(newLikedStatus);
    setLikeCount(newLikeCount);
    
    let updatedLikesArray: string[];
    if (newLikedStatus) {
        updatedLikesArray = [...post.likes, currentUser.uid];
    } else {
        updatedLikesArray = post.likes.filter(uid => uid !== currentUser.uid);
    }
    if(onLikeUpdate) {
        onLikeUpdate(post.id, updatedLikesArray);
    }

    try {
      if (newLikedStatus) {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid)
        });
      }
    } catch (error) {
      console.error("Error updating like:", error);
      toast({ title: "Error", description: "Could not update like status.", variant: "destructive" });
      setIsLiked(!newLikedStatus);
      setLikeCount(isLiked ? likeCount -1 : likeCount + 1);
      if(onLikeUpdate) onLikeUpdate(post.id, post.likes);
    }
  };

  const postDate = post.createdAtDate || (post.createdAt instanceof Date ? post.createdAt : post.createdAt?.toDate());
  const timeAgo = postDate ? formatDistanceToNow(postDate, { addSuffix: true }) : 'Unknown date';
  const userName = post.user?.name || 'Anonymous';
  const userAvatar = post.user?.avatar || `https://placehold.co/40x40.png?text=${userName.charAt(0)}`;

  return (
    <Card className="w-full overflow-hidden glassmorphic-card"> {/* Applied glassmorphic-card */}
      <CardHeader className="flex flex-row items-center space-x-3 p-4 md:p-6">
        <Avatar className="h-11 w-11">
          <AvatarImage src={userAvatar} alt={userName} data-ai-hint="person portrait" />
          <AvatarFallback className="text-lg bg-muted text-muted-foreground">{userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-xl font-headline font-semibold">{post.title}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Posted by {userName} &bull; {timeAgo} &bull; {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
          </CardDescription>
        </div>
      </CardHeader>
      {post.images && post.images.length > 0 && (
         <Carousel className="w-full">
          <CarouselContent>
            {post.images.map((imgUrl, index) => (
              <CarouselItem key={index}>
                <div className="relative aspect-video w-full">
                  <Image 
                    src={imgUrl} 
                    alt={`${post.title} image ${index + 1}`} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover" // Removed rounded-t-none as card handles overflow
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
      <CardContent className="p-4 md:p-6">
        <p className="text-sm text-foreground/90 dark:text-foreground/80 leading-relaxed">{post.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 md:p-6 border-t"> {/* Removed border/60 to use default theme border */}
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
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Bookmark className="h-5 w-5 text-foreground/70" /> 
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
