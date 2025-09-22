import { useQueryClient } from '@tanstack/react-query';

/**
 * OTIMIZADA: Hook para gerenciar cache de forma inteligente
 */
export const useOptimizedCache = () => {
  const queryClient = useQueryClient();

  const clearOldCache = () => {
    console.log('🗑️ OTIMIZADA: Limpando cache antigo');
    
    // Remover apenas dados mais antigos que 1 hora
    queryClient.getQueryCache().getAll().forEach(query => {
      const dataUpdatedAt = query.state.dataUpdatedAt;
      const isOld = Date.now() - dataUpdatedAt > 60 * 60 * 1000; // 1 hora
      
      if (isOld) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  };

  const optimizeCache = () => {
    console.log('⚡ OTIMIZADA: Otimizando cache');
    
    // Configurar GC mais agressivo
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 300000, // 5 minutos
        gcTime: 600000, // 10 minutos (reduzido de padrão 24h)
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1 // Reduzir tentativas de retry
      }
    });
  };

  const getMemoryUsage = () => {
    const queries = queryClient.getQueryCache().getAll();
    const dataSize = queries.reduce((total, query) => {
      return total + (JSON.stringify(query.state.data || {}).length);
    }, 0);
    
    return {
      queryCount: queries.length,
      estimatedMemoryKB: Math.round(dataSize / 1024),
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length
    };
  };

  return {
    clearOldCache,
    optimizeCache,
    getMemoryUsage,
    clearAll: () => queryClient.clear()
  };
};