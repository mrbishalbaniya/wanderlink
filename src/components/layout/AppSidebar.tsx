// src/components/layout/AppSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Compass, MessageSquare, Users, User, Settings, LogOut, MapPin } from 'lucide-react';
import { ThemeToggleButton } from './ThemeToggleButton'; // Assuming you have this

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore Trips', icon: Compass },
  { href: '/chat', label: 'Messages', icon: MessageSquare },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, userProfile, logout } = useAuth();
  const { setOpenMobile } = useSidebar();


  const handleLogout = async () => {
    try {
      await logout();
      // router.push('/login'); // Handled by AuthProvider or route protection
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60 shadow-md">
      <SidebarHeader className="p-4 border-b border-border/60">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpenMobile(false)}>
          <MapPin className="h-7 w-7 text-primary" />
          <span className="font-headline text-xl font-bold text-primary group-data-[collapsible=icon]:hidden">
            WanderMap
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
      <SidebarFooter className="p-3 border-t border-border/60">
        {currentUser && userProfile ? (
           <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9">
                <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                <AvatarFallback>{userProfile.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-semibold truncate">{userProfile.name}</p>
                <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="group-data-[collapsible=icon]:hidden text-muted-foreground hover:text-destructive">
                <LogOut size={18}/>
            </Button>
          </div>
        ) : (
          <div className="group-data-[collapsible=icon]:hidden">
            <Button asChild className="w-full">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
