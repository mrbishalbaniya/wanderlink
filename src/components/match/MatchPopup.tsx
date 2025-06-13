
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserProfile } from '@/types';
import Image from 'next/image';
import { PartyPopper, MessageSquare } from 'lucide-react';

interface MatchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  matchedUser: UserProfile | null;
  currentUserAvatar?: string | null;
}

export default function MatchPopup({ isOpen, onClose, matchedUser, currentUserAvatar }: MatchPopupProps) {
  if (!matchedUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden glassmorphic-card !rounded-2xl border-none">
        <div className="relative aspect-[9/10] w-full">
            <Image src="/images/confetti-background.png" alt="Confetti" layout="fill" objectFit="cover" className="opacity-30" data-ai-hint="party celebration"/>
             <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4 bg-gradient-to-br from-primary/30 via-transparent to-accent/30">
                <div className="flex -space-x-8">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-2 ring-primary">
                        <AvatarImage src={currentUserAvatar || `https://placehold.co/100x100.png?text=You`} alt="Current User" data-ai-hint="person portrait"/>
                        <AvatarFallback>YOU</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-2 ring-accent">
                        <AvatarImage src={matchedUser.avatar} alt={matchedUser.name} data-ai-hint="person portrait"/>
                        <AvatarFallback>{matchedUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
                
                <DialogHeader className="text-center">
                    <DialogTitle className="text-4xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent py-2">
                        It's a Match!
                    </DialogTitle>
                    <DialogDescription className="text-lg text-foreground/90">
                        You and {matchedUser.name} have liked each other.
                    </DialogDescription>
                </DialogHeader>

                <div className="w-full space-y-3 pt-2">
                    <Button className="w-full text-lg py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg shadow-md" onClick={() => {/* TODO: Navigate to chat */ onClose(); }}>
                        <MessageSquare className="mr-2 h-5 w-5"/>
                        Send a Message
                    </Button>
                    <Button variant="ghost" className="w-full text-lg py-3 text-muted-foreground hover:bg-muted/50 rounded-lg" onClick={onClose}>
                        Keep Swiping
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
