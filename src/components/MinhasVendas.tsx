
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVendas } from '@/hooks/useVendas';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useDeleteVenda } from '@/hooks/useDeleteVenda';
import { useAuthStore } from '@/stores/AuthStore';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import DeleteVendaDialog from '@/components/vendas/dialogs/DeleteVendaDialog';
import VendasPagination from '@/components/vendas/VendasPagination';
import VendasFilter from '@/components/vendas/VendasFilter';
import type { VendaCompleta } from '@/hooks/useVendas';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import { getVendaEffectivePeriod } from '@/utils/vendaDateUtils';

const ITEMS_PER_PAGE = 20; // Aumentado de 10 para 20

const MinhasVendas: React.FC = () => {
  const { vendas, isLoading, error } = useVendas();
  const { isAdmin, isSecretaria } = useUserRoles();
  const { deleteVenda, isDeleting, canDelete } = useDeleteVenda();
  const { currentUser, profile } = useAuthStore();
  const navigate = useNavigate();
  const [selectedVenda, setSelectedVenda] = useState<VendaCompleta | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendaToDelete, setVendaToDelete] = useState<VendaCompleta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estados para filtro por período - usar lógica de semanas consistente
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  const { mes: mesCorreto, ano: anoCorreto } = getMesAnoSemanaAtual();
  const [selectedMonth, setSelectedMonth] = useState(mesCorreto);
  const [selectedYear, setSelectedYear] = useState(anoCorreto);

  // Filtrar vendas por mês e ano
  const filteredVendas = useMemo(() => {
    return vendas.filter(venda => {
      if (!venda.enviado_em) return false;
      
      const vendaPeriod = getVendaEffectivePeriod(venda);
      return vendaPeriod.mes === selectedMonth && vendaPeriod.ano === selectedYear;
    });
  }, [vendas, selectedMonth, selectedYear]);

  // Calcular dados paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredVendas.slice(startIndex, endIndex);
  }, [filteredVendas, currentPage]);

  const totalPages = Math.ceil(filteredVendas.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll para o topo quando mudar de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setCurrentPage(1); // Reset para primeira página ao mudar filtro
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentPage(1); // Reset para primeira página ao mudar filtro
  };

  const handleViewVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setDialogOpen(true);
  };

  const handleEditVenda = (venda: VendaCompleta) => {
    console.log('🔄 Iniciando edição da venda rejeitada:', venda.id);
    
    // Redirecionar para o formulário com o ID da venda para edição
    navigate(`/nova-venda?edit=${venda.id}`);
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

  // Determina se o vendedor pode editar uma venda
  const canEditVenda = (venda: VendaCompleta): boolean => {
    // Vendedores só podem editar vendas rejeitadas (desistiu)
    return venda.status === 'desistiu';
  };

  // Verifica se o usuário atual pode excluir vendas (apenas o admin específico)
  const userEmail = profile?.email || currentUser?.email || '';
  const canDeleteVendas = userEmail === 'wallasmonteiro019@gmail.com';

  console.log('🔐 MinhasVendas: Verificando permissão de exclusão:', {
    userEmail,
    canDeleteVendas,
    canDeleteFromHook: canDelete
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-gray-100 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
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

  // Estatísticas baseadas nas vendas filtradas
  const stats = {
    total: filteredVendas.length,
    approved: filteredVendas.filter(v => v.status === 'matriculado').length,
    pending: filteredVendas.filter(v => v.status === 'pendente').length,
    totalPoints: filteredVendas.reduce((sum, v) => sum + (v.pontuacao_esperada || 0), 0)
  };

  return (
    <>
      <div className="space-y-6">
        {/* Filtro por período */}
        <VendasFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
        />

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ppgvet-teal">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">
                Matrículas confirmadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando validação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontuação Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ppgvet-magenta">{stats.totalPoints.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Pontos acumulados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Vendas</CardTitle>
            <CardDescription>
              {filteredVendas.length === 0 
                ? `Nenhuma venda encontrada para ${selectedMonth}/${selectedYear}`
                : `Exibindo ${paginatedData.length} de ${filteredVendas.length} vendas - Página ${currentPage} de ${totalPages} (${selectedMonth}/${selectedYear})`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredVendas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma venda encontrada para o período selecionado.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Tente alterar o mês ou ano no filtro acima.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedData.map((venda) => (
                    <div key={venda.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{venda.aluno?.nome || 'Nome não informado'}</h3>
                            <Badge variant={venda.status === 'matriculado' ? 'default' : venda.status === 'pendente' ? 'secondary' : 'destructive'}>
                              {venda.status === 'matriculado' ? 'Matriculado' : venda.status === 'pendente' ? 'Pendente' : 'Rejeitada'}
                            </Badge>
                            {venda.status === 'desistiu' && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                Pode ser editada
                              </span>
                            )}
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
                            {venda.data_assinatura_contrato && (
                              <div>
                                <span className="font-medium">Data de Assinatura do Contrato:</span> {DataFormattingService.formatDate(venda.data_assinatura_contrato)}
                              </div>
                            )}
                            {venda.data_aprovacao && (
                              <div>
                                <span className="font-medium">Aprovado:</span> {DataFormattingService.formatDateTime(venda.data_aprovacao)}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <span className="font-medium">Pontuação:</span> 
                              <span className="ml-1 text-ppgvet-teal font-bold">{venda.pontuacao_esperada || 0} pts</span>
                            </div>
                            {venda.pontuacao_validada && (
                              <div>
                                <span className="font-medium">Validada:</span> 
                                <span className="ml-1 text-green-600 font-bold">{venda.pontuacao_validada} pts</span>
                              </div>
                            )}
                            {venda.motivo_pendencia && (
                              <div>
                                <span className="font-medium">Motivo da rejeição:</span> 
                                <span className="ml-1 text-red-600">{venda.motivo_pendencia}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {/* Botão Visualizar - sempre disponível */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewVenda(venda)}
                            title="Visualizar detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Botão Editar - apenas para vendas rejeitadas (vendedores) ou sempre (admin/secretaria) */}
                          {(canEditVenda(venda) || isAdmin || isSecretaria) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditVenda(venda)}
                              title={canEditVenda(venda) ? "Editar venda rejeitada" : "Editar venda"}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

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

                {/* Componente de Paginação */}
                <VendasPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

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

export default MinhasVendas;
