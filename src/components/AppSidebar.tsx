
import React from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import SidebarHeaderComponent from '@/components/SidebarHeader';
import SidebarMenuComponent from '@/components/SidebarMenuComponent';
import SidebarFooterComponent from '@/components/SidebarFooterComponent';
import { useAuthStore } from '@/stores/AuthStore';
import { useUserRoles } from '@/hooks/useUserRoles';

const AppSidebar: React.FC = () => {
  const { profile, currentUser } = useAuthStore();
  const { isDiretor, isAdmin, isSecretaria, isVendedor, isSDR, isCoordenador, isSupervisor } = useUserRoles();
  
  // Determinar o tipo de usuário baseado nas roles (ordem de prioridade)
  const getUserType = () => {
    if (isDiretor) return 'diretor';
    if (isAdmin) return 'admin';
    if (isCoordenador) return 'coordenador';
    if (isSupervisor) return 'supervisor';
    if (isSecretaria) return 'secretaria';
    if (profile?.user_type === 'sdr') return 'sdr';
    if (isVendedor) return 'vendedor';
    return 'vendedor'; // fallback
  };
  
  const userName = profile?.name || currentUser?.name || 'Usuário';
  const userType = getUserType();
  
  return (
    <Sidebar className="h-full w-56 border-r bg-card shadow-lg flex flex-col">
      <SidebarHeaderComponent userType={userType} />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <SidebarMenuComponent />
      </div>
      <div className="flex-shrink-0">
        <SidebarFooterComponent userType={userType} userName={userName} />
      </div>
    </Sidebar>
  );
};

export default AppSidebar;
