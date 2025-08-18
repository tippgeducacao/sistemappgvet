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
      <SidebarFooter className="border-t border-ppgvet-teal/20 p-3 bg-gradient-to-r from-ppgvet-teal/5 to-ppgvet-magenta/5 dark:from-ppgvet-teal/10 dark:to-ppgvet-magenta/10">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-card/60 backdrop-blur-sm border border-ppgvet-teal/20 shadow-sm">
            <div className="flex-shrink-0">
              <Avatar className="h-7 w-7 ring-2 ring-ppgvet-teal/20">
                <AvatarImage src={getProfileImage() || undefined} alt={userName} />
                <AvatarFallback className="bg-ppgvet-teal/10 text-ppgvet-teal text-xs font-bold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userName}
              </p>
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-ppgvet-teal/10 text-ppgvet-teal border-ppgvet-teal/30 dark:bg-ppgvet-teal/20 dark:text-ppgvet-teal`}>
                {getUserTypeLabel()}
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsProfileOpen(true)}
            className="w-full justify-start gap-2 rounded-lg border-ppgvet-teal/30 hover:bg-ppgvet-teal/10 hover:text-ppgvet-teal hover:border-ppgvet-teal/50 transition-all duration-200"
          >
            <User className="h-4 w-4 stroke-[1.5]" />
            Ver Perfil
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="w-full justify-start gap-2 rounded-lg border-ppgvet-teal/30 hover:bg-ppgvet-teal/10 hover:text-ppgvet-teal hover:border-ppgvet-teal/50 transition-all duration-200"
          >
            <LogOut className="h-4 w-4 stroke-[1.5]" />
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