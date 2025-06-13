import Header from '@/components/layout/Header';
import AppSidebar from '@/components/layout/AppSidebar'; // This will be styled as SidebarNav
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

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
          <Header />
          {/* Ensure main content area has bg-background and padding */}
          <main className="flex-1 bg-background p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
