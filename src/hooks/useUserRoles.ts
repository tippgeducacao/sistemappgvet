
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
  
  // Diretor: acesso total ao sistema (exceto criar vendas)
  const isDiretor = hasRole('diretor');
  
  // Admin: quem tem role admin, é secretaria por perfil, OU é diretor
  const isAdmin = hasRole('admin') || isSecretariaByProfile || isDiretor;
  
  // Secretaria: quem tem role secretaria OU é secretaria por perfil (mas não é admin nem diretor)
  const isSecretaria = (hasRole('secretaria') || isSecretariaByProfile) && !hasRole('admin') && !isDiretor;
  
  // Vendedor: quem tem role vendedor OU tem user_type vendedor (mas não é secretaria, admin, diretor nem sdr)
  const isVendedor = (hasRole('vendedor') || 
                     (profile?.user_type === 'vendedor' || currentUser?.user_type === 'vendedor')) && 
                     !isSecretariaByProfile && !hasRole('admin') && !isDiretor && !hasRole('sdr_inbound') && !hasRole('sdr_outbound');
  
  // SDR: quem tem role sdr_inbound/sdr_outbound OU tem user_type sdr_inbound/sdr_outbound (mas não é vendedor, secretaria, admin nem diretor)
  const isSDR = (hasRole('sdr_inbound') || hasRole('sdr_outbound') || 
                (profile?.user_type === 'sdr_inbound' || currentUser?.user_type === 'sdr_inbound' || 
                 profile?.user_type === 'sdr_outbound' || currentUser?.user_type === 'sdr_outbound')) && 
                !hasRole('vendedor') && !isSecretariaByProfile && !hasRole('admin') && !isDiretor;

  // Funções auxiliares para SDR
  const isSDRInbound = hasRole('sdr_inbound') || profile?.user_type === 'sdr_inbound' || currentUser?.user_type === 'sdr_inbound';
  const isSDROutbound = hasRole('sdr_outbound') || profile?.user_type === 'sdr_outbound' || currentUser?.user_type === 'sdr_outbound';
  
  console.log('🔐 useUserRoles: Verificando roles do usuário:', {
    userEmail: profile?.email || currentUser?.email,
    userType: profile?.user_type || currentUser?.user_type,
    roles: roles?.map(r => r.role),
    hasVendedorRole: hasRole('vendedor'),
    hasSDRInboundRole: hasRole('sdr_inbound'),
    hasSDROutboundRole: hasRole('sdr_outbound'),
    isSecretariaByProfile,
    isDiretor,
    isAdmin,
    isSecretaria,
    isVendedor,
    isSDR,
    isSDRInbound,
    isSDROutbound
  });
  
  return {
    roles: roles || [],
    isLoading,
    hasRole,
    isDiretor,
    isAdmin,
    isSecretaria,
    isVendedor,
    isSDR,
    isSDRInbound,
    isSDROutbound
  };
};
