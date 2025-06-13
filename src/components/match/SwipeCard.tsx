
'use client';

import type { UserProfile } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Sparkles, UserCircle, Cake, Users, Route } from 'lucide-react';
import { differenceInYears, format } from 'date-fns';

interface SwipeCardProps {
  user: UserProfile;
}

export default function SwipeCard({ user }: SwipeCardProps) {
  const age = user.dateOfBirthDate ? differenceInYears(new Date(), user.dateOfBirthDate) : null;
  const locationDisplay = user.currentLocation?.address || "Location not specified";

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
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <h2 className="text-2xl font-bold text-white shadow-lg">{user.name}{age && `, ${age}`}</h2>
           <p className="text-sm text-gray-200 flex items-center">
            <MapPin size={14} className="mr-1" /> {locationDisplay}
          </p>
        </div>
      </div>
      <CardContent className="p-3 md:p-4 flex-grow flex flex-col justify-between overflow-y-auto">
        <div>
          {user.bio && (
            <>
              <CardDescription className="text-xs uppercase text-muted-foreground mb-1 flex items-center">
                <UserCircle className="mr-1.5 h-4 w-4 text-accent" /> About Me
              </CardDescription>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {user.bio}
              </p>
            </>
          )}

          {user.interests && user.interests.length > 0 && (
            <>
              <CardDescription className="text-xs uppercase text-muted-foreground mb-1 flex items-center">
                <Sparkles className="mr-1.5 h-4 w-4 text-accent" /> Interests
              </CardDescription>
              <div className="flex flex-wrap gap-1 mb-3">
                {user.interests.slice(0, 5).map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-xs bg-accent/20 text-accent-foreground/80 border-accent/30">
                    {interest}
                  </Badge>
                ))}
              </div>
            </>
          )}

          {user.matchPreferences?.lookingFor && user.matchPreferences.lookingFor.length > 0 && (
            <>
              <CardDescription className="text-xs uppercase text-muted-foreground mb-1 flex items-center">
                <Users className="mr-1.5 h-4 w-4 text-accent" /> Looking For
              </CardDescription>
              <div className="flex flex-wrap gap-1">
                {user.matchPreferences.lookingFor.map((lf) => (
                  <Badge key={lf} variant="outline" className="text-xs">
                    {lf.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
