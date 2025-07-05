
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface SecretariaHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const SecretariaHeader: React.FC<SecretariaHeaderProps> = ({
  onRefresh,
  isLoading
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gerenciar Vendas - Secretaria
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie e aprove as vendas dos vendedores
        </p>
      </div>
      
      <Button
        onClick={onRefresh}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Carregando...' : 'Atualizar'}
      </Button>
    </div>
  );
};

export default SecretariaHeader;
