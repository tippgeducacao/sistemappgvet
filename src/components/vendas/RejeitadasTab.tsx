import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useDeleteVenda } from '@/hooks/useDeleteVenda';
import { useAuthStore } from '@/stores/AuthStore';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import DeleteVendaDialog from '@/components/vendas/dialogs/DeleteVendaDialog';
import type { VendaCompleta } from '@/hooks/useVendas';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';

interface RejeitadasTabProps {
  vendas: VendaCompleta[];
  showDeleteButton?: boolean;
}

const RejeitadasTab: React.FC<RejeitadasTabProps> = ({ vendas, showDeleteButton = false }) => {
  const [selectedVenda, setSelectedVenda] = useState<VendaCompleta | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendaToDelete, setVendaToDelete] = useState<VendaCompleta | null>(null);
  
  const { deleteVenda, isDeleting } = useDeleteVenda();
  const { currentUser, profile } = useAuthStore();

  // Verificar se o usuário atual pode excluir vendas (apenas o admin específico)
  const userEmail = profile?.email || currentUser?.email || '';
  const canDeleteVendas = userEmail === 'wallasmonteiro019@gmail.com' && showDeleteButton;

  const handleViewVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setDialogOpen(true);
  };

  const handleDeleteVenda = (venda: VendaCompleta) => {
    setVendaToDelete(venda);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (vendaToDelete) {
      await deleteVenda(vendaToDelete.id);
      setDeleteDialogOpen(false);
      setVendaToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Vendas Rejeitadas ({vendas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendas.length === 0 ? (
            <div className="text-center py-8 bg-green-50 rounded-lg">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Nenhuma venda rejeitada</p>
              <p className="text-gray-500">Todas as vendas foram aprovadas ou estão pendentes! 🎉</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vendas.map(venda => (
                <div key={venda.id} className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {venda.aluno?.nome || 'Nome não informado'}
                        </h3>
                        <Badge variant="destructive">Rejeitada</Badge>
                        <span className="text-xs text-gray-500 font-mono">
                          #{venda.id.substring(0, 8)}
                        </span>
                        <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          <AlertTriangle className="h-3 w-3" />
                          Pode ser editada pelo vendedor
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Email:</strong> {venda.aluno?.email || 'Não informado'}</p>
                        <p><strong>Curso:</strong> {venda.curso?.nome || 'Não informado'}</p>
                        <p><strong>Pontuação:</strong> {venda.pontuacao_esperada || 0} pts</p>
                        <p><strong>Vendedor:</strong> {venda.vendedor?.name || venda.vendedor_id}</p>
                        {venda.motivo_pendencia && (
                          <div className="mt-2 p-2 bg-red-100 rounded border-l-4 border-red-500">
                            <p className="text-red-800"><strong>Motivo da rejeição:</strong></p>
                            <p className="text-red-700 text-sm">{venda.motivo_pendencia}</p>
                          </div>
                        )}
                        {venda.observacoes && (
                          <p><strong>Observações do vendedor:</strong> {venda.observacoes}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          <strong>Rejeitada em:</strong> {venda.atualizado_em ? DataFormattingService.formatDateTime(venda.atualizado_em) : 'Não informada'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewVenda(venda)} 
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </Button>

                      {/* Botão Excluir - apenas para o admin específico */}
                      {canDeleteVendas && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteVenda(venda)}
                          title="Excluir venda permanentemente"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <VendaDetailsDialog
        venda={selectedVenda}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <DeleteVendaDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        vendaId={vendaToDelete?.id || ''}
        vendaNome={vendaToDelete?.aluno?.nome}
      />
    </>
  );
};

export default RejeitadasTab;
