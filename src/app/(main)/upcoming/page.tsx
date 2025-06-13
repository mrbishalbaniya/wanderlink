
'use client';

import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UpcomingFeedPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="pb-4 sticky top-0 z-10 bg-background/80 dark:bg-background/70 backdrop-blur-md pt-0 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4 shadow-sm">
        <h1 className="text-2xl font-headline text-primary">Upcoming Adventures</h1>
        <p className="text-sm text-muted-foreground">Discover exciting trips and events planned for the future.</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-lg text-center glassmorphic-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <CalendarClock size={28} className="mr-3 text-primary" />
              Future Journeys Ahead!
            </CardTitle>
            <CardDescription>
              This section will soon feature adventures scheduled for upcoming dates.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-10">
            <CalendarClock size={64} className="mx-auto text-muted-foreground/40 mb-6" />
            <h2 className="text-xl font-semibold text-foreground mb-3">Upcoming Feed Coming Soon</h2>
            <p className="text-muted-foreground mb-6">
              We're working on filtering adventures by their future dates. 
              For now, you can find all shared experiences in the main feed or on the global map.
            </p>
            <div className="flex justify-center space-x-4">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/">Explore Main Feed</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/map">View Global Map</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
