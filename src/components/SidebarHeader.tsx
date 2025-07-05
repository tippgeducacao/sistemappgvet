
import React from 'react';
import { SidebarHeader } from '@/components/ui/sidebar';
import { GraduationCap, Building2 } from 'lucide-react';
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

  const getHeaderIcon = () => {
    if (isComercialUser) {
      return <Building2 className="h-6 w-6 text-blue-600" />;
    }
    return <GraduationCap className="h-6 w-6 text-ppgvet-teal" />;
  };

  return (
    <SidebarHeader className="border-b p-4">
      <div className="flex items-center space-x-3">
        {getHeaderIcon()}
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {getHeaderTitle()}
          </h2>
          <p className="text-sm text-gray-600">
            {getHeaderSubtitle()}
          </p>
        </div>
      </div>
    </SidebarHeader>
  );
};

export default SidebarHeaderComponent;
