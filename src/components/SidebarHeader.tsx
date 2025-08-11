
import React from 'react';
import { SidebarHeader } from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/AuthStore';
import UserProfileButton from '@/components/UserProfileButton';
import type { UserType } from '@/types/user';

interface SidebarHeaderComponentProps {
  userType: UserType;
}

const SidebarHeaderComponent: React.FC<SidebarHeaderComponentProps> = ({ userType }) => {
  const { profile, currentUser } = useAuthStore();
  
  const userEmail = profile?.email || currentUser?.email;
  const isComercialUser = userEmail === 'comercial@ppgvet.com';

  const getHeaderTitle = () => {
    if (isComercialUser) {
      return 'PPGVET - Comercial';
    }
    return 'PPG Educação';
  };

  const getHeaderSubtitle = () => {
    if (isComercialUser) {
      return 'Área Comercial';
    }
    
    switch (userType) {
      case 'diretor':
        return 'Painel Diretoria';
      case 'admin':
        return 'Painel Administrativo';
      case 'secretaria':
        return 'Painel da Secretaria';
      case 'vendedor':
        return 'Painel do Vendedor';
      default:
        return 'Sistema de Vendas';
    }
  };

  return (
    <SidebarHeader className="border-b border-ppgvet-teal/20 p-3 bg-gradient-to-r from-ppgvet-teal/5 to-ppgvet-magenta/5 dark:from-ppgvet-teal/10 dark:to-ppgvet-magenta/10">
      <div className="flex flex-col space-y-3">
        {/* Logo e título */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 p-1 rounded-lg bg-ppgvet-teal/10 dark:bg-ppgvet-teal/20">
            <img 
              src="/lovable-uploads/e2b888ac-54b9-453e-abda-ee6ef6e7fbb5.png" 
              alt="PPGVET Logo" 
              className="h-6 w-6 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-ppgvet-teal dark:text-ppgvet-teal truncate">
              {getHeaderTitle()}
            </h2>
            <p className="text-xs text-muted-foreground truncate font-medium">
              {getHeaderSubtitle()}
            </p>
          </div>
        </div>

        {/* Botão do perfil do usuário */}
        {(profile || currentUser) && (
          <div className="pt-2 border-t border-ppgvet-teal/20">
            <UserProfileButton />
          </div>
        )}
      </div>
    </SidebarHeader>
  );
};

export default SidebarHeaderComponent;
