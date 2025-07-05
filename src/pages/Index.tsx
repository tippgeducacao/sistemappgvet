
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
        <div className="min-h-screen flex w-full bg-ppgvet-gray-50">
          <AppSidebar />
          
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
            </header>

            <main className="flex-1 p-6 bg-slate-300">
              <MainContent />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </UserGuard>
  );
};

export default Index;
