
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Compass, Globe } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <Card className="w-full max-w-lg glassmorphic-card">
        <CardHeader>
          <MapPin className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">Welcome to WanderLink!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Your journey starts here. Explore, connect, and share your adventures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 py-8">
          <p className="text-muted-foreground">
            The main feed has been removed. You can now find amazing content using the options below:
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/explore">
                <Compass className="mr-2 h-5 w-5" /> Explore Trips
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/map">
                <Globe className="mr-2 h-5 w-5" /> View Global Map
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            Use the sidebar to navigate to other sections like Upcoming Trips, Match, Messages, and your Profile.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
