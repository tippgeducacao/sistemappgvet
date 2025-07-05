
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/AuthStore';
import { UserRoleService, type AppRole, type UserRole } from '@/services/user/UserRoleService';

export const useUserRoles = () => {
  const { currentUser, profile } = useAuthStore();
  
  const { data: roles, isLoading } = useQuery({
    queryKey: ['user-roles', currentUser?.id],
    queryFn: async (): Promise<UserRole[]> => {
      if (!currentUser?.id) return [];
      return UserRoleService.getUserRoles(currentUser.id);
    },
    enabled: !!currentUser?.id,
  });

  const hasRole = (role: AppRole): boolean => {
    return roles?.some(r => r.role === role) || false;
  };

  // Verificar se é secretaria pelo perfil (user_type)
  const isSecretariaByProfile = profile?.user_type === 'secretaria' || currentUser?.user_type === 'secretaria';
  
  // Admin: quem tem role admin OU é secretaria por perfil
  const isAdmin = hasRole('admin') || isSecretariaByProfile;
  
  // Secretaria: quem tem role secretaria OU é secretaria por perfil
  const isSecretaria = hasRole('secretaria') || isSecretariaByProfile;
  
  // Vendedor: quem tem role vendedor OU tem user_type vendedor (mas não é secretaria)
  const isVendedor = (hasRole('vendedor') || 
                     (profile?.user_type === 'vendedor' || currentUser?.user_type === 'vendedor')) && 
                     !isSecretariaByProfile;

  console.log('🔐 useUserRoles: Verificando roles do usuário:', {
    userEmail: profile?.email || currentUser?.email,
    userType: profile?.user_type || currentUser?.user_type,
    roles: roles?.map(r => r.role),
    hasVendedorRole: hasRole('vendedor'),
    isSecretariaByProfile,
    isAdmin,
    isSecretaria,
    isVendedor
  });

  return {
    roles: roles || [],
    isLoading,
    hasRole,
    isAdmin,
    isSecretaria,
    isVendedor
  };
};
