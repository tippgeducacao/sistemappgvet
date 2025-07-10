/**
 * Serviço para gerenciar cache e schema do Supabase
 */
export class CacheService {
  /**
   * Força limpeza do cache do navegador
   */
  static clearBrowserCache(): void {
    // Limpar localStorage relacionado ao Supabase
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });

    // Limpar sessionStorage
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Força refresh da página para recarregar schema
   */
  static forceSchemaRefresh(): void {
    console.log('🔄 Forçando atualização do schema...');
    this.clearBrowserCache();
    
    // Aguardar um momento antes de recarregar
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  /**
   * Limpa cache específico do relacionamento
   */
  static clearRelationshipCache(): void {
    console.log('🗑️ Limpando cache de relacionamentos...');
    
    // Limpar cache de queries do React Query
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      (window as any).queryClient.clear();
    }
    
    this.clearBrowserCache();
  }
}