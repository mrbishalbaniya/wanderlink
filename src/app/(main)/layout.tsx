import Header from '@/components/layout/Header';
import AppSidebar from '@/components/layout/AppSidebar'; // Import the new Sidebar
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'; // Import SidebarProvider and SidebarInset

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}> {/* Wrap with SidebarProvider */}
      <AppSidebar /> {/* Render the AppSidebar */}
      <SidebarInset> {/* Main content area that adjusts to the sidebar */}
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 bg-background"> {/* Ensure main has a background */}
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
