
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Settings, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeleteVenda } from '@/hooks/useDeleteVenda';
import { useAuthStore } from '@/stores/AuthStore';
import AdminVendaActionsDialog from '@/components/admin/AdminVendaActionsDialog';
import DeleteVendaDialog from '@/components/vendas/dialogs/DeleteVendaDialog';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import type { VendaCompleta } from '@/hooks/useVendas';

interface TodasVendasTabProps {
  vendas: VendaCompleta[];
  showDeleteButton?: boolean;
}

const TodasVendasTab: React.FC<TodasVendasTabProps> = ({ vendas, showDeleteButton = false }) => {
  const navigate = useNavigate();
  const { deleteVenda, isDeleting } = useDeleteVenda();
  const { currentUser, profile } = useAuthStore();
  const [selectedVenda, setSelectedVenda] = useState<VendaCompleta | null>(null);
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendaToDelete, setVendaToDelete] = useState<VendaCompleta | null>(null);

  // Verificar se o usuário atual pode excluir vendas (apenas o admin específico)
  const userEmail = profile?.email || currentUser?.email || '';
  const canDeleteVendas = userEmail === 'wallasmonteiro019@gmail.com' && showDeleteButton;

  console.log('🔐 TodasVendasTab: Verificando permissão de exclusão:', {
    userEmail,
    canDeleteVendas,
    showDeleteButton
  });

  const handleViewVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setDetailsDialogOpen(true);
  };

  const handleEditVenda = (venda: VendaCompleta) => {
    navigate(`/nova-venda?edit=${venda.id}`);
  };

  const handleManageVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setActionsDialogOpen(true);
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'matriculado':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'desistiu':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'matriculado':
        return 'Matriculado';
      case 'pendente':
        return 'Pendente';
      case 'desistiu':
        return 'Rejeitada';
      default:
        return status;
    }
  };

  if (vendas.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-muted-foreground">Nenhuma venda encontrada.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Histórico Completo de Vendas</CardTitle>
          <CardDescription>
            {vendas.length} vendas encontradas em 06/2025
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendas.map((venda, index) => (
              <div key={venda.id} className="border rounded-lg p-4 hover:bg-muted/50 dark:hover:bg-muted/80 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground font-mono">#{index + 1}</span>
                      <h3 className="font-semibold text-lg">{venda.aluno?.nome || 'Nome não informado'}</h3>
                      <Badge variant={getStatusBadgeVariant(venda.status)}>
                        {getStatusLabel(venda.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Email:</span> {venda.aluno?.email || 'Não informado'}
                      </div>
                      <div>
                        <span className="font-medium">Curso:</span> {venda.curso?.nome || 'Não informado'}
                      </div>
                      <div>
                        <span className="font-medium">Vendedor:</span> {venda.vendedor?.name || 'Não informado'}
                      </div>
                      <div>
                        <span className="font-medium">Enviado:</span> {venda.enviado_em ? DataFormattingService.formatDateTime(venda.enviado_em) : 'Não informada'}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="font-medium">Pontuação:</span> 
                        <span className="ml-1 text-ppgvet-teal font-bold">
                          {DataFormattingService.formatPoints(venda.pontuacao_esperada || 0)} pts
                        </span>
                      </div>
                      {venda.pontuacao_validada && (
                        <div>
                          <span className="font-medium">Validada:</span> 
                          <span className="ml-1 text-green-600 font-bold">
                            {DataFormattingService.formatPoints(venda.pontuacao_validada)} pts
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Botão Visualizar */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewVenda(venda)}
                      title="Visualizar detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* Botão Gerenciar */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleManageVenda(venda)}
                      title="Gerenciar status e pontuação"
                    >
                      <Settings className="h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Diálogos */}
      <AdminVendaActionsDialog
        venda={selectedVenda}
        open={actionsDialogOpen}
        onOpenChange={setActionsDialogOpen}
      />

      <VendaDetailsDialog
        venda={selectedVenda}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
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

export default TodasVendasTab;
