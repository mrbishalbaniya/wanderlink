
'use client';

import type { UserProfile } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Sparkles, UserCircle } from 'lucide-react';

interface SwipeCardProps {
  user: UserProfile;
}

export default function SwipeCard({ user }: SwipeCardProps) {
  return (
    <Card className="w-[300px] h-[450px] md:w-[350px] md:h-[520px] overflow-hidden shadow-xl rounded-2xl flex flex-col glassmorphic-card absolute">
      <div className="relative w-full h-3/5">
        <Image
          src={user.avatar || `https://placehold.co/400x400.png?text=${user.name.charAt(0)}`}
          alt={user.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          data-ai-hint="person portrait"
        />
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <h2 className="text-2xl font-bold text-white shadow-lg">{user.name}</h2>
          {/* Add age/location later if available */}
          {/* <p className="text-sm text-gray-200">25, New York</p> */}
        </div>
      </div>
      <CardContent className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <CardTitle className="text-lg font-semibold mb-1 text-primary flex items-center">
             <UserCircle className="mr-2 h-5 w-5" /> About Me
          </CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {user.bio || 'No bio yet. Adventure awaits!'}
          </p>

          {user.interests && user.interests.length > 0 && (
            <>
              <CardDescription className="text-xs uppercase text-muted-foreground mb-1 flex items-center">
                <Sparkles className="mr-1.5 h-4 w-4 text-accent" /> Interests
              </CardDescription>
              <div className="flex flex-wrap gap-1.5">
                {user.interests.slice(0, 5).map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-xs bg-accent/20 text-accent-foreground/80 border-accent/30">
                    {interest}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
      {/* Footer can be used for location or other quick info if needed */}
      {/* <CardFooter className="p-3 border-t border-border/20">
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mr-1" />
          Location (if available)
        </div>
      </CardFooter> */}
    </Card>
  );
}
