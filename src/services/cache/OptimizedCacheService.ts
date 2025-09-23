/**
 * Serviço para configurações de cache otimizadas para reduzir egress
 */
export class OptimizedCacheService {
  /**
   * Configurações de cache por contexto para otimizar egress
   */
  static readonly CACHE_CONFIGS = {
    // TV Ranking público - cache muito agressivo
    TV_RANKING_PUBLIC: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    
    // Vendas administrativas - cache moderado
    ADMIN_VENDAS: {
      staleTime: 8 * 60 * 1000, // 8 minutos
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    
    // Vendas gerais - cache agressivo
    ALL_VENDAS: {
      staleTime: 10 * 60 * 1000, // 10 minutos
      gcTime: 20 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    
    // Dados de vendedores - cache moderado
    VENDEDORES: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    
    // Agendamentos - cache baixo (mais dinâmico)
    AGENDAMENTOS: {
      staleTime: 2 * 60 * 1000, // 2 minutos
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    
    // Metas e níveis - cache alto (dados estáticos)
    METAS_NIVEIS: {
      staleTime: 15 * 60 * 1000, // 15 minutos
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    
    // Comissionamento - cache muito agressivo (dados raramente mudam)
    COMISSIONAMENTO_REGRAS: {
      staleTime: 15 * 60 * 1000, // 15 minutos
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    
    // Cálculos de comissão - cache moderado
    COMISSIONAMENTO_CALCULOS: {
      staleTime: 10 * 60 * 1000, // 10 minutos
      gcTime: 20 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  };

  /**
   * Obtém configuração de cache otimizada por contexto
   */
  static getCacheConfig(context: keyof typeof OptimizedCacheService.CACHE_CONFIGS) {
    return OptimizedCacheService.CACHE_CONFIGS[context];
  }

  /**
   * Configurações de polling/intervalos otimizadas
   */
  static readonly POLLING_CONFIGS = {
    OVERDUE_APPOINTMENTS: 30 * 60 * 1000, // 30 minutos (era 15min)
    LATE_MEETINGS: 60 * 60 * 1000, // 1 hora (era 30min)
    REALTIME_DEBOUNCE: 3 * 1000, // 3 segundos (mantido)
  };

  /**
   * Lista de queries que devem ser invalidadas em conjunto
   * para evitar invalidações duplicadas
   */
  static readonly SHARED_INVALIDATION_GROUPS = {
    VENDAS_RELATED: ['all-vendas', 'simple-admin-vendas', 'vendas'],
    AGENDAMENTOS_RELATED: ['agendamentos', 'agendamentos-stats', 'all-agendamentos'],
    VENDEDORES_RELATED: ['vendedores', 'vendedores-only'],
    METAS_RELATED: ['metas-semanais', 'metas-vendedores'],
    COMISSIONAMENTO_RELATED: ['comissionamento-regras', 'comissionamento-calculos', 'weekly-commissions'],
  };

  /**
   * Invalida grupo de queries relacionadas
   */
  static invalidateGroup(queryClient: any, group: keyof typeof OptimizedCacheService.SHARED_INVALIDATION_GROUPS) {
    const queries = OptimizedCacheService.SHARED_INVALIDATION_GROUPS[group];
    
    return Promise.all(
      queries.map(queryKey => 
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      )
    );
  }
}