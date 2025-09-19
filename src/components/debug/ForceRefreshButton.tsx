import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap } from 'lucide-react';
import { CacheManagerService } from '@/services/cache/CacheManagerService';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/AuthStore';

interface ForceRefreshButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg';
  showDiagnostic?: boolean;
}

export const ForceRefreshButton: React.FC<ForceRefreshButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  showDiagnostic = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthStore();

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      console.log('🔄 Iniciando force refresh...');
      
      // Invalidar cache específico do supervisor se aplicável
      if (user?.id) {
        await CacheManagerService.invalidateSupervisorCache(user.id);
      }
      
      // Force refresh completo
      await CacheManagerService.forceFullCacheInvalidation();
      
      toast({
        title: 'Cache Atualizado',
        description: 'Todos os dados foram atualizados com sucesso.',
        duration: 3000,
      });
      
      // Aguardar um momento antes de recarregar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro ao forçar refresh:', error);
      toast({
        title: 'Erro ao Atualizar',
        description: 'Ocorreu um erro ao atualizar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const showDiagnosticInfo = () => {
    const info = CacheManagerService.getDiagnosticInfo();
    console.log('📊 Cache Diagnostic Info:', info);
    
    toast({
      title: 'Diagnóstico do Cache',
      description: `Queries: ${info.reactQueryCacheSize} | LocalStorage: ${info.localStorageKeys} keys`,
      duration: 5000,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        onClick={handleForceRefresh}
        disabled={isRefreshing}
        variant={variant}
        size={size}
        className="gap-2"
        title="Força atualização completa dos dados"
      >
        {isRefreshing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {isRefreshing ? 'Atualizando...' : 'Force Refresh'}
      </Button>
      
      {showDiagnostic && (
        <Button 
          onClick={showDiagnosticInfo}
          variant="ghost"
          size={size}
          className="px-2"
          title="Mostrar informações de diagnóstico"
        >
          📊
        </Button>
      )}
    </div>
  );
};