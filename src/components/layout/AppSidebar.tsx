
// src/components/layout/AppSidebar.tsx (acting as SidebarNav)
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Added useRouter
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Compass, MessageSquare, Users, User, Settings, LogOut, MapPin, Edit, HeartHandshake, Globe, CalendarClock } from 'lucide-react'; // Removed LayoutDashboard
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils'; 

const navItems = [
  // { href: '/', label: 'Feed', icon: LayoutDashboard }, // Removed Feed
  { href: '/upcoming', label: 'Upcoming Trips', icon: CalendarClock },
  { href: '/explore', label: 'Explore Trips', icon: Compass }, 
  { href: '/map', label: 'Global Map', icon: Globe },
  { href: '/match', label: 'Match', icon: HeartHandshake },
  { href: '/chat', label: 'Messages', icon: MessageSquare },
  { href: '/friends', label: 'Friends', icon: Users }, 
  { href: '/profile', label: 'Profile', icon: User },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, userProfile, logout } = useAuth();
  const { setOpenMobile, state: sidebarState } = useSidebar(); 

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login'); 
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Sidebar collapsible="icon" className="glassmorphic-sidebar border-r border-sidebar-border shadow-md">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/explore" className="flex items-center gap-2" onClick={() => setOpenMobile(false)}> {/* Default to /explore if / is removed */}
          <MapPin className="h-7 w-7 text-primary" />
          <span className={cn(
            "font-headline text-xl font-bold text-primary",
            sidebarState === 'collapsed' && 'group-data-[collapsible=icon]:hidden' 
          )}>
            WanderLink
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className={cn(
                  pathname === item.href ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "focus-visible:ring-sidebar-ring"
                )}
                tooltip={{ children: item.label, side: 'right', align: 'center' }}
                onClick={() => setOpenMobile(false)}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {currentUser && userProfile ? (
           <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full text-left p-1 rounded-md hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={userProfile.avatar} alt={userProfile.name} data-ai-hint="person portrait"/>
                        <AvatarFallback>{userProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 group-data-[collapsible=icon]:hidden">
                        <p className="text-sm font-semibold truncate text-sidebar-foreground">{userProfile.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
                    </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 mb-2 ml-1">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { router.push('/profile'); setOpenMobile(false); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="group-data-[collapsible=icon]:hidden">
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
