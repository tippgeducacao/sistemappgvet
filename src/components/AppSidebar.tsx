
import React from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import SidebarHeaderComponent from '@/components/SidebarHeader';
import SidebarMenuComponent from '@/components/SidebarMenuComponent';
import SidebarFooterComponent from '@/components/SidebarFooterComponent';
import { useAuthStore } from '@/stores/AuthStore';
import { useUserRoles } from '@/hooks/useUserRoles';

const AppSidebar: React.FC = () => {
  const { profile, currentUser } = useAuthStore();
  const { isDiretor, isAdmin, isSecretaria, isVendedor, isSDRInbound, isSDROutbound } = useUserRoles();
  
  // Determinar o tipo de usuário baseado nas roles (ordem de prioridade)
  const getUserType = () => {
    if (isDiretor) return 'diretor';
    if (isAdmin) return 'admin';
    if (isSecretaria) return 'secretaria';
    if (isSDRInbound) return 'sdr_inbound';
    if (isSDROutbound) return 'sdr_outbound';
    if (isVendedor) return 'vendedor';
    return 'vendedor'; // fallback
  };
  
  const userName = profile?.name || currentUser?.name || 'Usuário';
  const userType = getUserType();
  
  return (
    <Sidebar className="touch-none overscroll-none fixed left-0 top-0 h-screen w-64 z-40 overflow-hidden border-r border-slate-200 bg-white shadow-sm">
      <SidebarHeaderComponent userType={userType} />
      <SidebarMenuComponent />
      <SidebarFooterComponent userType={userType} userName={userName} />
    </Sidebar>
  );
};

export default AppSidebar;
