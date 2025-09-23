import React, { useState } from 'react';
import { User, LogOut, Building2 } from 'lucide-react';
import { SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/AuthStore';
import UserProfileModal from '@/components/UserProfileModal';
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Usar currentUser se disponível, senão profile
  const user = currentUser || profile;
  
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
      case 'sdr':
        return 'SDR';
      case 'supervisor':
        return 'Supervisor';
      case 'coordenador':
        return 'Coordenador';
      default:
        return 'Usuário';
    }
  };

  const getProfileImage = () => {
    // URL da foto do perfil se disponível - usando any para acessar propriedades não tipadas
    return (profile as any)?.photo_url || null;
  };

  const getUserInitials = () => {
    const name = userName || profile?.name || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
      case 'sdr':
        return 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <>
      <SidebarFooter className="border-t p-3 bg-muted/50">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-card border shadow-sm">
            <div className="flex-shrink-0">
              <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                <AvatarImage src={getProfileImage() || undefined} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {userName}
              </p>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {getUserTypeLabel()}
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsProfileOpen(true)}
            className="w-full justify-start gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
          >
            <User className="h-4 w-4" />
            Ver Perfil
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="w-full justify-start gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </SidebarFooter>
      
      {user && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          canEdit={true}
        />
      )}
    </>
  );
};

export default SidebarFooterComponent;