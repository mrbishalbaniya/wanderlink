import Link from 'next/link';
import { MapPin } from 'lucide-react';
import UserNav from './UserNav';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">WanderMap</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          {/* Add other nav links here if needed */}
        </nav>
        <div className="flex items-center space-x-2">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
