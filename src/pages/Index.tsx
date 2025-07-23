
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import MainContent from '@/components/MainContent';
import UserGuard from '@/components/ui/user-guard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useUserManagement } from '@/hooks/useUserManagement';

const Index = () => {
  const {
    user,
    currentUser,
    loading
  } = useUserManagement();

  return (
    <UserGuard user={user || currentUser} loading={loading}>
      <SidebarProvider>
        <div className="min-h-screen w-full bg-ppgvet-gray-50 flex">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background">
              <SidebarTrigger className="-ml-1" />
              <ThemeToggle />
            </header>

            <main className="flex-1 p-6">
              <MainContent />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </UserGuard>
  );
};

export default Index;
