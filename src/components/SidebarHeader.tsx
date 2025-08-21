
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
    <SidebarHeader className="border-b p-4 bg-muted/50">
      <div className="flex flex-col space-y-3">
        {/* Logo e título */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
            <img 
              src="/lovable-uploads/e2b888ac-54b9-453e-abda-ee6ef6e7fbb5.png" 
              alt="PPGVET Logo" 
              className="h-6 w-6 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-primary truncate">
              {getHeaderTitle()}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {getHeaderSubtitle()}
            </p>
          </div>
        </div>

      </div>
    </SidebarHeader>
  );
};

export default SidebarHeaderComponent;
