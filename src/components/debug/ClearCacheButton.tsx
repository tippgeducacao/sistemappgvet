import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export const ClearCacheButton: React.FC = () => {
  const queryClient = useQueryClient();

  const clearCache = () => {
    // Limpar todo o cache do React Query
    queryClient.clear();
    console.log('🧹 Cache limpo! Recarregando...');
    // Recarregar a página
    window.location.reload();
  };

  return (
    <Button 
      onClick={clearCache}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Limpar Cache
    </Button>
  );
};