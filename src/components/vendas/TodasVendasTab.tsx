import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/AuthStore';
import { useUserRoles } from '@/hooks/useUserRoles';
import AdminVendaActionsDialog from '@/components/admin/AdminVendaActionsDialog';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import VendasPagination from '@/components/vendas/VendasPagination';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import type { VendaCompleta } from '@/hooks/useVendas';

interface TodasVendasTabProps {
  vendas: VendaCompleta[];
}

const TodasVendasTab: React.FC<TodasVendasTabProps> = ({ vendas }) => {
  const navigate = useNavigate();
  const { currentUser, profile } = useAuthStore();
  const { isAdmin, isDiretor } = useUserRoles();
  const [selectedVenda, setSelectedVenda] = useState<VendaCompleta | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Verificar se pode gerenciar vendas (aprovar/rejeitar)
  const canManageVendas = isAdmin || isDiretor;

  // Reset pagination when vendas changes
  useEffect(() => {
    setCurrentPage(1);
  }, [vendas]);

  // Calcular itens da página atual
  const { currentItems, totalPages, startIndex } = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      currentItems: vendas.slice(start, end),
      totalPages: Math.ceil(vendas.length / itemsPerPage),
      startIndex: start
    };
  }, [vendas, currentPage, itemsPerPage]);

  const handleViewVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setDetailsDialogOpen(true);
  };

  const handleManageVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setActionsDialogOpen(true);
  };

  const handleEditVenda = (venda: VendaCompleta) => {
    navigate(`/nova-venda?edit=${venda.id}`);
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
            {vendas.length} vendas encontradas - Exibindo {Math.min(startIndex + 1, vendas.length)} a {Math.min(startIndex + itemsPerPage, vendas.length)} de {vendas.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentItems.map((venda, index) => (
              <div key={venda.id} className="border rounded-lg p-4 hover:bg-muted/50 dark:hover:bg-muted/80 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground font-mono">#{startIndex + index + 1}</span>
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
                        {venda.sdr && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">SDR:</span> {venda.sdr.name}
                          </div>
                        )}
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
                      {venda.data_assinatura_contrato && (
                        <div>
                          <span className="font-medium">Assinatura:</span> 
                          <span className="ml-1 text-blue-600 font-bold">
                            {DataFormattingService.formatDate(venda.data_assinatura_contrato)}
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

                    {/* Botão Gerenciar - exibido para todas as vendas */}
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleManageVenda(venda)}
                      title="Configurar venda"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <VendasPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Diálogos */}
      <VendaDetailsDialog
        venda={selectedVenda}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      <AdminVendaActionsDialog
        venda={selectedVenda}
        open={actionsDialogOpen}
        onOpenChange={setActionsDialogOpen}
      />
    </>
  );
};

export default TodasVendasTab;