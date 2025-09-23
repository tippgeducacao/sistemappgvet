
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Trash2 } from 'lucide-react';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import DeleteVendaDialog from '@/components/vendas/dialogs/DeleteVendaDialog';
import VendasPagination from '@/components/vendas/VendasPagination';
import { useSecretariaVendas } from '@/hooks/useSecretariaVendas';
import { useDeleteVenda } from '@/hooks/useDeleteVenda';
import { useAuthStore } from '@/stores/AuthStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import MatriculadaVendaCard from '@/components/vendas/matriculadas/MatriculadaVendaCard';
import MatriculadasEmptyState from '@/components/vendas/matriculadas/MatriculadasEmptyState';
import MatriculadasNotice from '@/components/vendas/matriculadas/MatriculadasNotice';
import CacheClearButton from '@/components/debug/CacheClearButton';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import type { VendaCompleta } from '@/hooks/useVendas';

interface MatriculadasTabProps {
  vendas: VendaCompleta[];
  showDeleteButton?: boolean;
}

const MatriculadasTab: React.FC<MatriculadasTabProps> = ({ vendas, showDeleteButton = false }) => {
  const [selectedVenda, setSelectedVenda] = useState<VendaCompleta | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendaToDelete, setVendaToDelete] = useState<VendaCompleta | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const { updateStatus, isUpdating } = useSecretariaVendas();
  const { deleteVenda, isDeleting } = useDeleteVenda();
  const { currentUser, profile } = useAuthStore();
  const { toast } = useToast();

  // Verificar se o usuário atual pode excluir vendas (apenas o admin específico)
  const userEmail = profile?.email || currentUser?.email || '';
  const canDeleteVendas = userEmail === 'wallasmonteiro019@gmail.com' && showDeleteButton;

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

  console.log('🔍 MatriculadasTab: Renderizando com', vendas.length, 'vendas matriculadas');
  console.log('🔍 MatriculadasTab: IDs das vendas:', vendas.map(v => v.id.substring(0, 8)));

  const handleViewVenda = (venda: VendaCompleta) => {
    console.log('🔍 MatriculadasTab: Abrindo detalhes da venda:', venda.id.substring(0, 8));
    setSelectedVenda(venda);
    setDialogOpen(true);
  };

  const handleRevertToPending = async (vendaId: string) => {
    console.log('🔄 MatriculadasTab: Revertendo venda para pendente:', vendaId.substring(0, 8));
    
    try {
      await updateStatus(vendaId, 'pendente', undefined, 'Venda revertida para análise');
      
      toast({
        title: 'Sucesso',
        description: 'Venda revertida para pendente com sucesso!',
      });
    } catch (error) {
      console.error('❌ Erro ao reverter venda:', error);
      
      toast({
        title: 'Erro',
        description: 'Erro ao reverter venda para pendente',
        variant: 'destructive',
      });
    }
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

  if (vendas.length === 0) {
    return <MatriculadasEmptyState />;
  }

  return (
    <>
      <div 
        className="space-y-6"
        style={{ 
          display: 'block !important', 
          visibility: 'visible',
          overflow: 'visible !important'
        }}
      >
        <Card 
          style={{ 
            display: 'block !important', 
            visibility: 'visible',
            overflow: 'visible !important'
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle>Alunos Matriculados</CardTitle>
              </div>
              <CacheClearButton />
            </div>
            <CardDescription>
              {vendas.length} {vendas.length === 1 ? 'aluno' : 'alunos'} com matrícula efetivada - Exibindo {Math.min(startIndex + 1, vendas.length)} a {Math.min(startIndex + itemsPerPage, vendas.length)} de {vendas.length}
            </CardDescription>
          </CardHeader>
          <CardContent 
            style={{ 
              display: 'block !important', 
              visibility: 'visible',
              overflow: 'visible !important'
            }}
          >
            <div 
              className="space-y-4"
              style={{ 
                display: 'block !important', 
                visibility: 'visible',
                overflow: 'visible !important'
              }}
            >
              {currentItems.map((venda, index) => {
                console.log(`🔍 MatriculadasTab: Renderizando card ${index} para venda:`, {
                  id: venda.id.substring(0, 8),
                  nome: venda.aluno?.nome,
                  email: venda.aluno?.email,
                  curso: venda.curso?.nome,
                  key: `matriculada-venda-${venda.id}` // Log da key que será usada
                });
                
                return (
                  <div key={venda.id} className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50/50 dark:bg-green-950/30">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground font-mono">#{startIndex + index + 1}</span>
                          <h3 className="font-semibold text-lg">{venda.aluno?.nome || 'Nome não informado'}</h3>
                          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm font-medium">
                            Matriculado
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Email:</span> {venda.aluno?.email || 'Não informado'}
                          </div>
                          <div>
                            <span className="font-medium">Curso:</span> {venda.curso?.nome || 'Não informado'}
                          </div>
                          <div>
                            <span className="font-medium">Vendedor:</span> {venda.vendedor?.name || 'Não informado'}
                            {venda.sdr && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">SDR:</span> {venda.sdr.name}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="font-medium">Pontuação Esperada:</span> 
                            <span className="ml-1 text-ppgvet-teal font-bold">
                              {DataFormattingService.formatPoints(venda.pontuacao_esperada || 0)} pts
                            </span>
                          </div>
                          {venda.pontuacao_validada && (
                            <div>
                              <span className="font-medium">Pontuação Validada:</span> 
                              <span className="ml-1 text-green-600 font-bold">
                                {DataFormattingService.formatPoints(venda.pontuacao_validada)} pts
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Matriculado em:</span> 
                            <span className="ml-1">
                              {venda.atualizado_em ? DataFormattingService.formatDate(venda.atualizado_em) : 'Não informado'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {/* Botão para visualizar detalhes */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewVenda(venda)}
                          title="Visualizar detalhes"
                        >
                          Ver Detalhes
                        </Button>

                        {/* Botão para reverter para pendente */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRevertToPending(venda.id)}
                          disabled={isUpdating}
                          title="Reverter para pendente"
                        >
                          {isUpdating ? 'Revertendo...' : 'Reverter'}
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
                );
              })}
            </div>
            
            <VendasPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>

        <MatriculadasNotice />
      </div>

      {selectedVenda && (
        <VendaDetailsDialog
          venda={selectedVenda}
          open={dialogOpen}
          onOpenChange={(open) => {
            console.log('🔍 MatriculadasTab: Dialog estado mudou:', open);
            setDialogOpen(open);
            if (!open) {
              setSelectedVenda(null);
            }
          }}
        />
      )}

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

export default MatriculadasTab;
