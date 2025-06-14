
'use client';

import type { Post, TripStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CalendarDays, Clock, Users, MapPinIcon, ListChecks, Hourglass, CheckCircle2, XCircle, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import InteractiveMap from '@/components/map/InteractiveMap';
import { format, formatDistanceToNowStrict, differenceInSeconds } from 'date-fns';
import { useState, useEffect } from 'react';

interface UpcomingTripCardProps {
  post: Post & { liveStatus?: TripStatus }; // liveStatus can be pre-calculated
}

const getTripStatusDetails = (status: TripStatus): { text: string; icon: React.ElementType; colorClass: string; bgColorClass: string } => {
  switch (status) {
    case 'upcoming':
      return { text: 'Upcoming', icon: Hourglass, colorClass: 'text-blue-600 dark:text-blue-400', bgColorClass: 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700' };
    case 'in-progress':
      return { text: 'In Progress', icon: PlayCircle, colorClass: 'text-green-600 dark:text-green-400', bgColorClass: 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700' };
    case 'completed':
      return { text: 'Completed', icon: CheckCircle2, colorClass: 'text-gray-600 dark:text-gray-400', bgColorClass: 'bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600' };
    case 'cancelled':
      return { text: 'Cancelled', icon: XCircle, colorClass: 'text-red-600 dark:text-red-400', bgColorClass: 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700' };
    default:
      return { text: 'Planning', icon: Hourglass, colorClass: 'text-purple-600 dark:text-purple-400', bgColorClass: 'bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700' };
  }
};

const calculateCountdown = (targetDate?: Date | null): string => {
  if (!targetDate) return 'Date not set';
  const now = new Date();
  if (targetDate <= now) return 'Started!';

  const diffSeconds = differenceInSeconds(targetDate, now);
  if (diffSeconds < 0) return 'Started!';

  const days = Math.floor(diffSeconds / (3600 * 24));
  const hours = Math.floor((diffSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
};

export default function UpcomingTripCard({ post }: UpcomingTripCardProps) {
  const { title, user, images, coordinates, locationLabel, tripStartDateDate, tripEndDateDate, participants, packingList } = post;
  
  const liveStatus = post.liveStatus || getTripStatusDetails(post.tripStatus || 'planning').text.toLowerCase() as TripStatus;
  const statusDetails = getTripStatusDetails(liveStatus);
  const StatusIcon = statusDetails.icon;

  const [countdown, setCountdown] = useState<string>(calculateCountdown(tripStartDateDate));

  useEffect(() => {
    if (liveStatus === 'upcoming' && tripStartDateDate) {
      const interval = setInterval(() => {
        setCountdown(calculateCountdown(tripStartDateDate));
      }, 1000);
      return () => clearInterval(interval);
    } else if (liveStatus !== 'upcoming') {
        setCountdown(statusDetails.text); // Show status text if not upcoming
    }
  }, [tripStartDateDate, liveStatus, statusDetails.text]);

  const formattedStartDate = tripStartDateDate ? format(tripStartDateDate, 'MMM d, yyyy') : 'N/A';
  const formattedEndDate = tripEndDateDate ? format(tripEndDateDate, 'MMM d, yyyy') : 'N/A';
  const participantCount = participants?.length || 0;

  return (
    <Card className="flex flex-col overflow-hidden glassmorphic-card shadow-soft-lg h-full">
      {images && images.length > 0 && (
        <div className="relative w-full aspect-[16/9]">
          <Image src={images[0]} alt={title} fill className="object-cover" data-ai-hint="travel landscape"/>
           <Badge className={`absolute top-2 right-2 text-xs ${statusDetails.bgColorClass} ${statusDetails.colorClass} border`}>
            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
            {statusDetails.text}
          </Badge>
        </div>
      )}
      {!images?.length && (
         <div className={`p-2 text-right ${statusDetails.bgColorClass} border-b`}>
            <Badge className={`text-xs ${statusDetails.bgColorClass} ${statusDetails.colorClass} border-none`}>
                <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                {statusDetails.text}
            </Badge>
         </div>
      )}

      <CardHeader className="p-4">
        <CardTitle className="text-xl font-headline truncate" title={title}>{title}</CardTitle>
        {user && (
          <div className="flex items-center space-x-2 mt-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person avatar"/>
              <AvatarFallback className="text-xs">{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">Planned by {user.name}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3 flex-grow">
        {liveStatus === 'upcoming' && tripStartDateDate && (
          <div className="flex items-center text-sm text-primary font-medium p-2 rounded-md bg-primary/10">
            <Clock className="h-5 w-5 mr-2" />
            <span>Starts in: {countdown}</span>
          </div>
        )}
         {(liveStatus === 'in-progress' || liveStatus === 'completed') && tripStartDateDate && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <span>{liveStatus === 'in-progress' ? 'Started' : 'Started on'}: {format(tripStartDateDate, 'PP')}</span>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-1.5">
          <div className="flex items-center">
            <CalendarDays className="h-4 w-4 mr-2 text-accent" />
            <span>{formattedStartDate} - {formattedEndDate}</span>
          </div>
          {locationLabel && (
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-2 text-accent" />
              <span>{locationLabel}</span>
            </div>
          )}
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-accent" />
            <span>{participantCount} {participantCount === 1 ? 'person going' : 'people going'}</span>
          </div>
        </div>
        
        {coordinates && (
            <div className="h-40 w-full rounded-md overflow-hidden shadow-sm border border-border/30 mt-2">
                 <InteractiveMap
                    posts={[{ ...post, id: post.id || 'temp-id' }]} // Pass as array for map to work
                    center={[coordinates.latitude, coordinates.longitude]}
                    zoom={10}
                    className="h-full w-full"
                    // Disable interactions for preview
                    onMapClick={() => {}} 
                 />
            </div>
        )}

        {packingList && (
          <Accordion type="single" collapsible className="w-full pt-2">
            <AccordionItem value="packing-list" className="border-border/50">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                <div className="flex items-center">
                    <ListChecks className="h-4 w-4 mr-2 text-accent" /> Packing List
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2">
                <p className="text-xs text-muted-foreground whitespace-pre-line bg-muted/50 p-3 rounded-md">
                  {packingList}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>

      <CardFooter className="p-3 border-t border-border/30">
        <Button asChild variant="outline" size="sm" className="w-full">
          {/* TODO: Link to a detailed trip page or open post sheet */}
          <Link href={`/?postId=${post.id}`}>View Details & Discuss</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

