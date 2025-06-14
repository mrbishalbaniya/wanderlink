
'use client';

import type { UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FriendCardProps {
  user: UserProfile;
}

export default function FriendCard({ user }: FriendCardProps) {
  const router = useRouter();

  const handleMessage = () => {
    // TODO: Implement actual navigation to a chat with this user
    // For now, it could navigate to the main chat page, or do nothing.
    // Example: router.push(`/chat/${user.uid}`);
    router.push('/chat'); // Navigate to general chat page for now
    console.log(`Attempting to message ${user.name}`);
  };

  const handleViewProfile = () => {
    // TODO: Implement navigation to a specific user's public profile page if that exists
    // Example: router.push(`/profile/${user.uid}`);
    // For now, if no public profile view, perhaps just log or do nothing.
    // If your /profile page can show other users' profiles based on ID, use that.
    // alert(`Viewing profile of ${user.name} (UID: ${user.uid}) - Public profile page TBD`);
    // For now, let's assume /profile is only for the current user.
    // We could make this button link to the user's "Explore" posts or similar if applicable.
    // Or, if user.username exists, link to an external profile if relevant.
    // For this app, simply viewing more info might not be a direct action unless a full public profile page for others is built.
    // Let's make it a placeholder for now.
    console.log(`Viewing profile of ${user.name}`);
  };


  return (
    <Card className="flex flex-col overflow-hidden glassmorphic-card shadow-soft-lg h-full">
      <CardHeader className="flex flex-row items-center space-x-4 p-4">
        <Avatar className="h-16 w-16 border-2 border-primary/50">
          <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
          <AvatarFallback className="text-xl bg-muted text-muted-foreground">
            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-lg font-headline truncate" title={user.name}>
            {user.name || 'WanderLink User'}
          </CardTitle>
          {user.username && (
            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        {user.bio ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {user.bio}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No bio available.</p>
        )}
      </CardContent>
      <CardFooter className="p-3 border-t border-border/30 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full sm:flex-1"
          onClick={handleViewProfile}
          title={`View profile of ${user.name}`} // Placeholder action
        >
          <User className="mr-2 h-4 w-4" />
          View Profile
        </Button>
        <Button 
          size="sm" 
          className="w-full sm:flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={handleMessage}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Message
        </Button>
      </CardFooter>
    </Card>
  );
}
