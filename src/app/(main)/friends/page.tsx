
'use client';

import { Users, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FriendsPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:py-12">
      <div className="pb-4 sticky top-0 z-10 bg-background/80 dark:bg-background/70 backdrop-blur-md pt-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4 shadow-sm">
        <h1 className="text-2xl font-headline text-primary">Find Friends</h1>
        <p className="text-sm text-muted-foreground">Connect with fellow travelers and explorers.</p>
      </div>

      <Card className="glassmorphic-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-accent" />
            AI-Powered Friend Suggestions
          </CardTitle>
          <CardDescription>
            Discover people with similar interests, hobbies, and who might be exploring near you.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Users size={64} className="mx-auto text-muted-foreground/50 mb-6" />
          <h2 className="text-xl font-semibold text-foreground mb-3">Friend Suggestions Coming Soon!</h2>
          <p className="text-muted-foreground mb-4">
            We're working on an intelligent system to help you find like-minded adventurers on WanderLink.
          </p>
          <p className="text-muted-foreground mb-6">
            Make sure your <Button variant="link" asChild className="p-0 h-auto text-primary"><Link href="/profile">profile interests</Link></Button> are up to date to get the best suggestions when this feature launches.
          </p>
          
          {/* Placeholder for future friend suggestions list */}
          {/* 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1,2,3].map(i => (
              <Card key={i} className="bg-card/80 dark:bg-card/70 p-4 shadow-soft-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=U${i}`} alt="User" />
                    <AvatarFallback>U{i}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">User Name {i}</p>
                    <p className="text-xs text-muted-foreground">Nearby You</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Common Interests:</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="secondary" className="text-xs">Hiking</Badge>
                  <Badge variant="secondary" className="text-xs">Photography</Badge>
                </div>
                <Button className="w-full" size="sm">View Profile</Button>
              </Card>
            ))}
          </div>
          */}
        </CardContent>
      </Card>
    </div>
  );
}
