
import AppSidebar from '@/components/layout/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { PanelLeft } from 'lucide-react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          {/* Mobile-only trigger area */}
          <div className="p-4 pb-2 md:hidden"> {/* Standard padding, reduce bottom padding slightly */}
            <SidebarTrigger> {/* Shadcn Button, default size "icon" is h-10 w-10 */}
              <PanelLeft className="h-6 w-6" /> {/* Icon size */}
              <span className="sr-only">Open menu</span>
            </SidebarTrigger>
          </div>
          
          {/* Main content area */}
          {/* For mobile, pt-0 because the trigger is within a p-4 div. For md+, pt-6/pt-8 as before. */}
          <main className="flex-1 bg-background px-4 pb-4 pt-0 md:px-6 md:pb-6 md:pt-6 lg:px-8 lg:pb-8 lg:pt-8">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
