
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddRule?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddRule }) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Plus className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Nenhuma regra de pontuação encontrada
      </h3>
      <p className="text-gray-600 mb-6">
        Comece criando sua primeira regra de pontuação para as vendas.
      </p>
      {onAddRule && (
        <Button onClick={onAddRule}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Primeira Regra
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
