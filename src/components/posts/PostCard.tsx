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
import { useState } from 'react';

interface PostCardProps {
  post: Post;
  onLikeUpdate?: (postId: string, newLikes: string[]) => void;
}

export default function PostCard({ post, onLikeUpdate }: PostCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(currentUser ? post.likes.includes(currentUser.uid) : false);
  const [likeCount, setLikeCount] = useState(post.likes.length);

  const handleLike = async () => {
    if (!currentUser) {
      toast({ title: "Authentication Required", description: "Please login to like posts.", variant: "destructive" });
      return;
    }
    const postRef = doc(db, 'posts', post.id);
    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid)
        });
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
        if(onLikeUpdate) onLikeUpdate(post.id, post.likes.filter(uid => uid !== currentUser.uid));
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid)
        });
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        if(onLikeUpdate) onLikeUpdate(post.id, [...post.likes, currentUser.uid]);
      }
    } catch (error) {
      console.error("Error updating like:", error);
      toast({ title: "Error", description: "Could not update like status.", variant: "destructive" });
    }
  };

  const postDate = post.createdAt instanceof Date ? post.createdAt : post.createdAt?.toDate();
  const timeAgo = postDate ? formatDistanceToNow(postDate, { addSuffix: true }) : 'Unknown date';
  const userName = post.user?.name || 'Anonymous';
  const userAvatar = post.user?.avatar || `https://placehold.co/40x40.png?text=${userName.charAt(0)}`;

  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center space-x-3 p-4">
        <Avatar>
          <AvatarImage src={userAvatar} alt={userName} data-ai-hint="person portrait" />
          <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-headline">{post.title}</CardTitle>
          <CardDescription className="text-xs">
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
                    layout="fill" 
                    objectFit="cover"
                    data-ai-hint="travel landscape"
                    className="rounded-t-none" 
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {post.images.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
            </>
          )}
        </Carousel>
      )}
      <CardContent className="p-4">
        <p className="text-sm text-foreground/80">{post.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 border-t">
        <div className="flex space-x-4">
          <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center space-x-1">
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
            <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-1">
            <MessageCircle className="h-4 w-4" />
            <span>Comment</span> {/* Comment functionality not implemented */}
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon">
            <Bookmark className="h-4 w-4" /> {/* Save functionality not implemented */}
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 className="h-4 w-4" /> {/* Share functionality not implemented */}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
