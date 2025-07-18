import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import VendedorReunioes from '@/components/vendedor/VendedorReunioes';
import UserGuard from '@/components/ui/user-guard';
import { useUserManagement } from '@/hooks/useUserManagement';

const Reunioes: React.FC = () => {
  const { user, currentUser, loading } = useUserManagement();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <UserGuard user={user} loading={loading}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <VendedorReunioes />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </UserGuard>
  );
};

export default Reunioes;