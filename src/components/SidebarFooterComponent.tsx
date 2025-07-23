
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
      return <Building2 className="h-4 w-4 stroke-[1.5] text-muted-foreground" />;
    }
    return <User className="h-4 w-4 stroke-[1.5] text-muted-foreground" />;
  };

  const getUserBadgeColor = () => {
    if (isComercialUser) {
      return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800';
    }
    
    switch (userType) {
      case 'diretor':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800';
      case 'admin':
        return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800';
      case 'secretaria':
        return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800';
      case 'vendedor':
        return 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800';
      case 'sdr_inbound':
        return 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800';
      case 'sdr_outbound':
        return 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <SidebarFooter className="border-t border-border p-4 bg-muted/30">
      <div className="space-y-3">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-border">
          <div className="flex-shrink-0">
            {getUserIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">
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
          className="w-full justify-start gap-2 rounded-lg"
        >
          <LogOut className="h-4 w-4 stroke-[1.5]" />
          Sair
        </Button>
      </div>
    </SidebarFooter>
  );
};

export default SidebarFooterComponent;
