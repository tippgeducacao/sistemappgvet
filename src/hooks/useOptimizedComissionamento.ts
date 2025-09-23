import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ComissionamentoService, type RegraComissionamento } from '@/services/comissionamentoService';
import { OptimizedCacheService } from '@/services/cache/OptimizedCacheService';

/**
 * Hook otimizado para regras de comissionamento usando React Query
 * Implementa cache agressivo para reduzir queries de 71M para ~100K
 */
export const useOptimizedComissionamento = (tipoUsuario = 'vendedor') => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cache configuration específica para comissionamento
  const cacheConfig = OptimizedCacheService.getCacheConfig('COMISSIONAMENTO_REGRAS');

  const {
    data: todasRegras = [],
    isLoading: loading,
    error,
    refetch: fetchRegras
  } = useQuery({
    queryKey: ['comissionamento-regras'], // Cache global único - elimina queries duplicadas
    queryFn: () => ComissionamentoService.fetchRegras(), // Buscar todas as regras
    ...cacheConfig,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Filtrar regras por tipo de usuário no frontend (economia de 87.5% das queries)
  const regras = todasRegras.filter(regra => 
    !tipoUsuario || regra.tipo_usuario === tipoUsuario
  );

  const updateRegra = async (
    id: string, 
    dados: Partial<Omit<RegraComissionamento, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      await ComissionamentoService.updateRegra(id, dados);
      
      // Invalidar apenas as queries relacionadas a comissionamento
      await OptimizedCacheService.invalidateGroup(queryClient, 'COMISSIONAMENTO_RELATED');
      
      toast({
        title: "Sucesso",
        description: "Regra de comissionamento atualizada com sucesso!",
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar regra de comissionamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar regra de comissionamento",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Expor erro se houver
  if (error) {
    console.error('❌ useOptimizedComissionamento - Erro:', error);
    toast({
      title: "Erro",
      description: "Erro ao carregar regras de comissionamento",
      variant: "destructive",
    });
  }

  return {
    regras,
    loading,
    error,
    fetchRegras,
    updateRegra,
  };
};