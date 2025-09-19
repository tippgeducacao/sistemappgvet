
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, Clock } from 'lucide-react';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import { useSimpleAdminVendas } from '@/hooks/useSimpleAdminVendas';
import { useUserRoles } from '@/hooks/useUserRoles';
import RejectVendaDialog from '@/components/vendas/dialogs/RejectVendaDialog';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import type { VendaCompleta } from '@/hooks/useVendas';

interface SimplePendentesTabProps {
  vendas: VendaCompleta[];
}

const SimplePendentesTab: React.FC<SimplePendentesTabProps> = ({ vendas }) => {
  const { updateStatus, isUpdating } = useSimpleAdminVendas();
  const { isSupervisor } = useUserRoles();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [vendaToReject, setVendaToReject] = useState<VendaCompleta | null>(null);
  const [selectedVenda, setSelectedVenda] = useState<VendaCompleta | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleViewVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setDetailsDialogOpen(true);
  };

  const handleAprovar = async (vendaId: string, pontuacaoEsperada?: number) => {
    console.log('🎯 Aprovando venda:', vendaId.substring(0, 8));
    
    try {
      await updateStatus({
        vendaId,
        status: 'matriculado',
        pontuacaoValidada: pontuacaoEsperada || 0
      });
      
      console.log('✅ Venda aprovada!');
    } catch (error) {
      console.error('❌ Erro ao aprovar:', error);
    }
  };

  const handleOpenRejectDialog = (venda: VendaCompleta) => {
    setVendaToReject(venda);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async (motivo: string) => {
    if (!vendaToReject) return;

    console.log('🎯 Rejeitando venda:', vendaToReject.id.substring(0, 8), 'Motivo:', motivo);
    
    try {
      await updateStatus({
        vendaId: vendaToReject.id,
        status: 'desistiu',
        motivoPendencia: motivo
      });
      
      setRejectDialogOpen(false);
      setVendaToReject(null);
      console.log('✅ Venda rejeitada!');
    } catch (error) {
      console.error('❌ Erro ao rejeitar:', error);
    }
  };

  if (vendas.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Nenhuma Venda Pendente
            </h3>
            <p className="text-green-700">
              Todas as vendas foram processadas! 🎉
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Vendas Pendentes de Validação
          </CardTitle>
          <CardDescription>
            {vendas.length} {vendas.length === 1 ? 'venda' : 'vendas'} {isSupervisor ? 'da sua equipe' : 'aguardando sua aprovação'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendas.map(venda => (
              <div key={venda.id} className="border rounded-lg p-4 bg-yellow-50">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        {venda.aluno?.nome || 'Nome não informado'}
                      </h3>
                      <Badge variant="secondary">Pendente</Badge>
                      <span className="text-xs text-gray-500 font-mono">
                        #{venda.id.substring(0, 8)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Email:</span> {venda.aluno?.email || 'Não informado'}
                      </div>
                      <div>
                        <span className="font-medium">Curso:</span> {venda.curso?.nome || 'Não informado'}
                      </div>
                      <div>
                        <span className="font-medium">Enviado:</span> {venda.enviado_em ? DataFormattingService.formatDateTime(venda.enviado_em) : 'Não informada'}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="font-medium">Pontuação:</span> 
                        <span className="ml-1 text-ppgvet-teal font-bold">{venda.pontuacao_esperada || 0} pts</span>
                      </div>
                      <div>
                        <span className="font-medium">Vendedor:</span> 
                        <span className="ml-1 text-gray-600">{venda.vendedor?.name || venda.vendedor_id}</span>
                      </div>
                      {venda.observacoes && (
                        <div>
                          <span className="font-medium">Observações:</span> 
                          <span className="ml-1 text-gray-600">{venda.observacoes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!isSupervisor && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAprovar(venda.id, venda.pontuacao_esperada || 0)} 
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
                          {isUpdating ? 'Rejeitando...' : 'Rejeitar'}
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleViewVenda(venda)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <RejectVendaDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleConfirmReject}
        isLoading={isUpdating}
        vendaNome={vendaToReject?.aluno?.nome}
      />

      <VendaDetailsDialog
        venda={selectedVenda}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </>
  );
};

export default SimplePendentesTab;
