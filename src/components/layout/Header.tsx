import Link from 'next/link';
import { MapPin } from 'lucide-react';
import UserNav from './UserNav';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar'; // Import SidebarTrigger

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md shadow-lg">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        {/* Sidebar Trigger for mobile and collapsible sidebar scenarios */}
        <SidebarTrigger className="mr-2 md:hidden" /> 
        
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <MapPin className="h-7 w-7 text-primary" />
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
