
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, CheckCircle } from 'lucide-react';
import RejectVendaDialog from '@/components/vendas/dialogs/RejectVendaDialog';
import type { VendaCompleta } from '@/hooks/useVendas';

interface VendasPendentesCardProps {
  vendas: VendaCompleta[];
  isUpdating: boolean;
  onAprovar: (vendaId: string, pontuacaoEsperada: number) => Promise<void>;
  onRejeitar: (vendaId: string, motivo: string) => Promise<void>;
}

const VendasPendentesCard: React.FC<VendasPendentesCardProps> = ({
  vendas,
  isUpdating,
  onAprovar,
  onRejeitar
}) => {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [vendaToReject, setVendaToReject] = useState<VendaCompleta | null>(null);

  const handleOpenRejectDialog = (venda: VendaCompleta) => {
    setVendaToReject(venda);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async (motivo: string) => {
    if (!vendaToReject) return;

    try {
      await onRejeitar(vendaToReject.id, motivo);
      setRejectDialogOpen(false);
      setVendaToReject(null);
    } catch (error) {
      console.error('❌ Erro ao rejeitar venda:', error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Vendas Pendentes ({vendas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendas.length === 0 ? (
            <div className="text-center py-8 bg-green-50 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-green-800 font-medium">Nenhuma venda pendente</p>
              <p className="text-green-600">Todas as vendas foram processadas! 🎉</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vendas.map(venda => (
                <div key={venda.id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {venda.aluno?.nome || 'Nome não informado'}
                        </h3>
                        <Badge variant="secondary">Pendente</Badge>
                        <span className="text-xs text-gray-500 font-mono">
                          #{venda.id.substring(0, 8)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Email:</strong> {venda.aluno?.email || 'Não informado'}</p>
                        <p><strong>Curso:</strong> {venda.curso?.nome || 'Não informado'}</p>
                        <p><strong>Pontuação:</strong> {venda.pontuacao_esperada || 0} pts</p>
                        <p><strong>Vendedor:</strong> {venda.vendedor?.name || venda.vendedor_id}</p>
                        {venda.observacoes && (
                          <p><strong>Observações:</strong> {venda.observacoes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onAprovar(venda.id, venda.pontuacao_esperada || 0)} 
                        disabled={isUpdating}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                        {isUpdating ? 'Aprovando...' : 'Aprovar'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenRejectDialog(venda)} 
                        disabled={isUpdating}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RejectVendaDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleConfirmReject}
        isLoading={isUpdating}
        vendaNome={vendaToReject?.aluno?.nome}
      />
    </>
  );
};

export default VendasPendentesCard;
