
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
    if (profile?.user_type === 'sdr') return 'sdr';
    if (isVendedor) return 'vendedor';
    return 'vendedor'; // fallback
  };
  
  const userName = profile?.name || currentUser?.name || 'Usuário';
  const userType = getUserType();
  
  return (
    <Sidebar className="touch-none overscroll-none h-full w-56 overflow-hidden border-r border-border/40 bg-gradient-to-b from-ppgvet-gray-50 to-card dark:from-ppgvet-gray-100 dark:to-card shadow-lg flex flex-col">
      <SidebarHeaderComponent userType={userType} />
      <div className="flex-1">
        <SidebarMenuComponent />
      </div>
      <SidebarFooterComponent userType={userType} userName={userName} />
    </Sidebar>
  );
};

export default AppSidebar;
