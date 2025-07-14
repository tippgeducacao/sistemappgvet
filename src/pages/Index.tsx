
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import MainContent from '@/components/MainContent';
import UserGuard from '@/components/ui/user-guard';
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
        <div className="min-h-screen w-full bg-ppgvet-gray-50 touch-pan-y select-none relative">
          <AppSidebar />
          
          <div className="pl-64">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
              <SidebarTrigger className="-ml-1" />
            </header>

            <main className="flex-1 p-6 bg-slate-300 min-h-[calc(100vh-4rem)]">
              <MainContent />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </UserGuard>
  );
};

export default Index;
