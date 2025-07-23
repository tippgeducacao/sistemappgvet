
import React from 'react';
import { SidebarHeader } from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/AuthStore';
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
    return 'PPGVET Sistema';
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
    <SidebarHeader className="border-b border-border/40 p-6 bg-gradient-to-r from-background to-background/95">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <img 
            src="/lovable-uploads/e2b888ac-54b9-453e-abda-ee6ef6e7fbb5.png" 
            alt="PPGVET Logo" 
            className="h-10 w-10 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {getHeaderTitle()}
          </h2>
          <p className="text-sm text-muted-foreground truncate">
            {getHeaderSubtitle()}
          </p>
        </div>
      </div>
    </SidebarHeader>
  );
};

export default SidebarHeaderComponent;
