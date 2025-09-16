
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import MainContent from '@/components/MainContent';
import UserGuard from '@/components/ui/user-guard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAutoAgendamentoVinculacao } from '@/hooks/useAutoAgendamentoVinculacao';

const Index = () => {
  const {
    user,
    currentUser,
    loading
  } = useUserManagement();

  // Executa vinculação automática (throttled) ao abrir o dashboard
  useAutoAgendamentoVinculacao();

  return (
    <UserGuard user={user || currentUser} loading={loading}>
      <SidebarProvider>
        <div className="min-h-screen w-full bg-background flex">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/60 px-6 bg-card/60 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="hover:bg-primary/10 hover:text-primary rounded-md transition-colors" />
              </div>
              <ThemeToggle />
            </header>

            <main className="flex-1 p-6 bg-muted/30">
              <MainContent />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </UserGuard>
  );
};

export default Index;
