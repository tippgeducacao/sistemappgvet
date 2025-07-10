import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { CacheService } from '@/services/cache/CacheService';
import { useToast } from '@/hooks/use-toast';

const CacheClearButton: React.FC = () => {
  const { toast } = useToast();

  const handleClearCache = () => {
    CacheService.clearRelationshipCache();
    
    toast({
      title: 'Cache Limpo',
      description: 'Cache de relacionamentos foi limpo. Recarregando...',
    });

    // Aguardar um momento e recarregar a página
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleClearCache}
      className="gap-2"
      title="Limpar cache de relacionamentos do banco"
    >
      <RefreshCw className="h-4 w-4" />
      Limpar Cache
    </Button>
  );
};

export default CacheClearButton;