/**
 * Serviço avançado para gerenciar cache e resolver problemas de invalidação
 */
export class CacheManagerService {
  private static cacheTimestamp = Date.now();
  
  /**
   * Força limpeza completa de todos os caches
   */
  static async forceFullCacheInvalidation(): Promise<void> {
    console.log('🧹 Iniciando limpeza completa do cache...');
    
    // 1. Atualizar timestamp global para invalidar query keys
    this.cacheTimestamp = Date.now();
    
    // 2. Limpar cache do React Query se disponível
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      console.log('🗑️ Limpando cache do React Query...');
      await (window as any).queryClient.clear();
      await (window as any).queryClient.invalidateQueries();
      await (window as any).queryClient.refetchQueries();
    }
    
    // 3. Limpar cache do Supabase
    this.clearSupabaseCache();
    
    // 4. Limpar localStorage relacionado ao app
    this.clearAppLocalStorage();
    
    // 5. Limpar sessionStorage
    this.clearAppSessionStorage();
    
    console.log('✅ Limpeza completa do cache concluída');
  }
  
  /**
   * Invalida cache específico do supervisor
   */
  static async invalidateSupervisorCache(supervisorId: string): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      const queryClient = (window as any).queryClient;
      
      // Invalidar queries específicas do supervisor
      await queryClient.invalidateQueries({
        predicate: (query: any) => {
          const queryKey = query.queryKey;
          return queryKey && Array.isArray(queryKey) && (
            queryKey.includes('supervisor-comissionamento-batch') ||
            queryKey.includes('supervisor-comissionamento') ||
            queryKey.includes('admin-vendas') ||
            queryKey.includes('vendas-supervisor') ||
            (queryKey[0]?.includes && queryKey[0].includes('supervisor')) ||
            (queryKey[1] === supervisorId)
          );
        }
      });
      
      // Forçar refetch das queries ativas
      await queryClient.refetchQueries({
        predicate: (query: any) => {
          const queryKey = query.queryKey;
          return queryKey && Array.isArray(queryKey) && (
            queryKey.includes('supervisor-comissionamento-batch') ||
            queryKey.includes('admin-vendas')
          );
        }
      });
    }
  }
  
  /**
   * Limpa cache específico do Supabase
   */
  static clearSupabaseCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('🗑️ Cache do Supabase limpo');
  }
  
  /**
   * Limpa localStorage específico do app
   */
  static clearAppLocalStorage(): void {
    const keysToKeep = ['theme', 'auth-token']; // Manter configurações importantes
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (!keysToKeep.includes(key) && !key.startsWith('supabase.')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('🗑️ LocalStorage do app limpo');
  }
  
  /**
   * Limpa sessionStorage específico do app
   */
  static clearAppSessionStorage(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (!key.startsWith('supabase.')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('🗑️ SessionStorage do app limpo');
  }
  
  /**
   * Obtém timestamp atual para versionamento de cache
   */
  static getCacheVersion(): number {
    return this.cacheTimestamp;
  }
  
  /**
   * Cria query key com versioning para forçar invalidação
   */
  static createVersionedQueryKey(baseKey: string[], includeTimestamp = false): string[] {
    const version = this.getCacheVersion();
    const timestamped = includeTimestamp ? Date.now() : version;
    return [...baseKey, `v${timestamped}`];
  }
  
  /**
   * Diagnóstico do estado do cache
   */
  static getDiagnosticInfo(): {
    timestamp: string;
    cacheVersion: number;
    reactQueryCacheSize: number;
    localStorageKeys: number;
    sessionStorageKeys: number;
    supabaseKeys: number;
  } {
    const queryClient = (window as any).queryClient;
    const queryCache = queryClient?.getQueryCache();
    
    return {
      timestamp: new Date().toISOString(),
      cacheVersion: this.cacheTimestamp,
      reactQueryCacheSize: queryCache?.getAll()?.length || 0,
      localStorageKeys: Object.keys(localStorage).length,
      sessionStorageKeys: Object.keys(sessionStorage).length,
      supabaseKeys: Object.keys(localStorage).filter(k => k.startsWith('supabase.')).length,
    };
  }
  
  /**
   * Configura interceptação para invalidar cache após mutations
   */
  static setupMutationInterceptor(): void {
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      const queryClient = (window as any).queryClient;
      
      // Interceptar mutations bem-sucedidas
      queryClient.setMutationDefaults(['update-venda', 'create-venda'], {
        onSuccess: () => {
          console.log('🔄 Mutation bem-sucedida, invalidando cache relacionado...');
          queryClient.invalidateQueries({
            predicate: (query: any) => {
              const key = query.queryKey;
              return key && (
                key.includes('vendas') ||
                key.includes('supervisor-comissionamento') ||
                key.includes('admin-vendas')
              );
            }
          });
        }
      });
    }
  }
}