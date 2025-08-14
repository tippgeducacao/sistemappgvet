
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAdminVendas } from '@/hooks/useAdminVendas';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import AdminVendaActionsDialog from '@/components/admin/AdminVendaActionsDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { VendaCompleta } from '@/hooks/useVendas';

const AdminVendasList: React.FC = () => {
  const { vendas, isLoading, error } = useAdminVendas();
  const [selectedVenda, setSelectedVenda] = useState<VendaCompleta | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false);

  const handleViewVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setDialogOpen(true);
  };

  const handleManageVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setActionsDialogOpen(true);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar vendas: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Todas as Vendas - Área Administrativa</CardTitle>
          <CardDescription>
            Gerencie todas as vendas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendas.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma venda encontrada.</p>
          ) : (
            <div className="space-y-4">
              {vendas.map((venda) => (
                <div key={venda.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          {venda.aluno?.nome || 'Nome não informado'}
                        </h3>
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
                        {venda.data_assinatura_contrato && (
                          <div>
                            <span className="font-medium">Data de Assinatura do Contrato:</span> {DataFormattingService.formatDate(venda.data_assinatura_contrato)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="font-medium">Pontuação:</span> 
                          <span className="ml-1 text-ppgvet-teal font-bold">
                            {DataFormattingService.formatPoints(venda.pontuacao_esperada || 0)} pts
                          </span>
                        </div>
                        {venda.pontuacao_validada !== null && (
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewVenda(venda)}
                        title="Visualizar detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {venda.status === 'pendente' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleManageVenda(venda)}
                          title="Aprovar/Rejeitar"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {venda.status === 'matriculado' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleManageVenda(venda)}
                          title="Gerenciar"
                        >
                          <Clock className="h-4 w-4" />
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

      <AdminVendaActionsDialog
        venda={selectedVenda}
        open={actionsDialogOpen}
        onOpenChange={setActionsDialogOpen}
      />
    </>
  );
};

export default AdminVendasList;
