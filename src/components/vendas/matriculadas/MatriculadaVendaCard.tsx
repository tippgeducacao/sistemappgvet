import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, RotateCcw } from 'lucide-react';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import { useUserRoles } from '@/hooks/useUserRoles';
import type { VendaCompleta } from '@/hooks/useVendas';

interface MatriculadaVendaCardProps {
  venda: VendaCompleta;
  isUpdating: boolean;
  onViewVenda: (venda: VendaCompleta) => void;
  onRevertToPending: (vendaId: string) => void;
}

const MatriculadaVendaCard: React.FC<MatriculadaVendaCardProps> = ({
  venda,
  isUpdating,
  onViewVenda,
  onRevertToPending
}) => {
  const {
    isAdmin,
    isSecretaria,
    isLoading
  } = useUserRoles();

  // Lógica de permissão simplificada e explícita
  const canManageVendas = !isLoading && (isAdmin === true || isSecretaria === true);

  const handleViewDetails = () => {
    console.log('👁️ CLIQUE: Ver detalhes da venda', venda.id.substring(0, 8));
    onViewVenda(venda);
  };

  const handleRevert = () => {
    console.log('🔄 CLIQUE: Reverter venda', venda.id.substring(0, 8));
    onRevertToPending(venda.id);
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4 w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900">
              {venda.aluno?.nome || 'Nome não informado'}
            </h3>
            <Badge className="bg-green-600 text-white text-xs mt-1">
              Matriculado
            </Badge>
          </div>
        </div>
      </div>

      {/* Informações do Curso e Aluno */}
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-600">Email:</span>
          <span className="ml-2 text-gray-900">{venda.aluno?.email || 'Email não informado'}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Curso:</span>
          <span className="ml-2 text-gray-900">{venda.curso?.nome || 'Não informado'}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Pontuação:</span>
          <span className="ml-2 text-green-700 font-semibold">{venda.pontuacao_esperada || 0} pts</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Data:</span>
          <span className="ml-2 text-gray-900">
            {venda.enviado_em ? DataFormattingService.formatDate(venda.enviado_em) : 'Não informada'}
          </span>
        </div>
      </div>

      {/* Botões de Ação */}
      {canManageVendas && (
        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-green-200">
          <Button 
            onClick={handleViewDetails} 
            size="sm" 
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="h-4 w-4" />
            VER DETALHES
          </Button>

          <Button 
            onClick={handleRevert} 
            disabled={isUpdating} 
            size="sm" 
            variant="outline" 
            className="flex items-center justify-center gap-2 border-orange-500 text-orange-700 hover:bg-orange-50 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            {isUpdating ? 'REVERTENDO...' : 'REVERTER'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MatriculadaVendaCard;
