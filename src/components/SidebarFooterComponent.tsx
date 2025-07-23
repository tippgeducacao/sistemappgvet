
import React from 'react';
import { User, LogOut, Building2 } from 'lucide-react';
import { SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/AuthStore';
import type { UserType } from '@/types/user';

interface SidebarFooterComponentProps {
  userType: UserType;
  userName: string;
}

const SidebarFooterComponent: React.FC<SidebarFooterComponentProps> = ({
  userType,
  userName
}) => {
  const { signOut } = useAuth();
  const { profile, currentUser } = useAuthStore();
  
  const userEmail = profile?.email || currentUser?.email;
  const isComercialUser = userEmail === 'comercial@ppgvet.com';

  const getUserTypeLabel = () => {
    if (isComercialUser) {
      return 'Área Comercial';
    }
    
    switch (userType) {
      case 'diretor':
        return 'Diretor';
      case 'admin':
        return 'Administrador';
      case 'secretaria':
        return 'Secretária';
      case 'vendedor':
        return 'Vendedor';
      case 'sdr_inbound':
        return 'SDR Inbound';
      case 'sdr_outbound':
        return 'SDR Outbound';
      default:
        return 'Usuário';
    }
  };

  const getUserIcon = () => {
    if (isComercialUser) {
      return <Building2 className="h-4 w-4 stroke-[1.5] text-slate-600" />;
    }
    return <User className="h-4 w-4 stroke-[1.5] text-slate-600" />;
  };

  const getUserBadgeColor = () => {
    if (isComercialUser) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    
    switch (userType) {
      case 'diretor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'secretaria':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'vendedor':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sdr_inbound':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'sdr_outbound':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <SidebarFooter className="border-t border-slate-200 p-4 bg-slate-50">
      <div className="space-y-3">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-slate-200">
          <div className="flex-shrink-0">
            {getUserIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {userName}
            </p>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUserBadgeColor()}`}>
              {getUserTypeLabel()}
            </div>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={signOut}
          className="w-full justify-start gap-2 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4 stroke-[1.5]" />
          Sair
        </Button>
      </div>
    </SidebarFooter>
  );
};

export default SidebarFooterComponent;
