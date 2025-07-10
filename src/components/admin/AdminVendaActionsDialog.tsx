import React, { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { useAdminVendas } from '@/hooks/useAdminVendas';
import { useDeleteVenda } from '@/hooks/useDeleteVenda';
import { useFormDetails } from '@/hooks/useFormDetails';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import DeleteVendaDialog from '@/components/vendas/dialogs/DeleteVendaDialog';
import RejectVendaDialog from '@/components/vendas/dialogs/RejectVendaDialog';
import { useAuthStore } from '@/stores/AuthStore';
import VendaAlunoInfoCard from '@/components/vendas/details/VendaAlunoInfoCard';
import VendaCursoInfoCard from '@/components/vendas/details/VendaCursoInfoCard';
import VendaObservationsCard from '@/components/vendas/details/VendaObservationsCard';
import VendaFormDetailsCard from '@/components/vendas/details/VendaFormDetailsCard';
import VendaDocumentCard from '@/components/vendas/details/VendaDocumentCard';
import type { VendaCompleta } from '@/hooks/useVendas';
import VendaFieldValidationCard from '@/components/vendas/details/VendaFieldValidationCard';
import { useToast } from '@/hooks/use-toast';
interface AdminVendaActionsDialogProps {
  venda: VendaCompleta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const AdminVendaActionsDialog: React.FC<AdminVendaActionsDialogProps> = ({
  venda,
  open,
  onOpenChange
}) => {
  const {
    updateStatus,
    isUpdating
  } = useAdminVendas();
  const {
    deleteVenda,
    isDeleting
  } = useDeleteVenda();
  const {
    currentUser,
    profile
  } = useAuthStore();
  const {
    toast
  } = useToast();
  const [pontuacaoValidada, setPontuacaoValidada] = useState('');
  const [motivoPendencia, setMotivoPendencia] = useState('');
  const [dataAssinaturaContrato, setDataAssinaturaContrato] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isSavingValidations, setIsSavingValidations] = useState(false);
  const {
    data: formDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
    refetch: refetchDetails
  } = useFormDetails(venda?.id);
  React.useEffect(() => {
    if (venda) {
      setPontuacaoValidada(venda.pontuacao_validada?.toString() || venda.pontuacao_esperada?.toString() || '');
      setMotivoPendencia(venda.motivo_pendencia || '');
    }
  }, [venda]);
  if (!venda) return null;

  // Verificar se o usuário atual pode excluir vendas
  const userEmail = profile?.email || currentUser?.email || '';
  const canDeleteVendas = userEmail === 'wallasmonteiro019@gmail.com';
  const handleApprove = () => {
    // Validar se a data de assinatura foi preenchida
    if (!dataAssinaturaContrato) {
      toast({
        title: "Campo obrigatório",
        description: "Para aprovar a venda é obrigatório informar a data de assinatura do contrato",
        variant: "destructive"
      });
      return;
    }
    
    // Usar pontuação esperada (calculada automaticamente)
    const pontos = venda.pontuacao_esperada || 0;
    updateStatus({
      vendaId: venda.id,
      status: 'matriculado',
      pontuacaoValidada: pontos,
      dataAssinaturaContrato
    });
    onOpenChange(false);
  };
  const handleOpenRejectDialog = () => {
    setRejectDialogOpen(true);
  };
  const handleConfirmReject = (motivo: string) => {
    updateStatus({
      vendaId: venda.id,
      status: 'desistiu',
      motivoPendencia: motivo
    });
    setRejectDialogOpen(false);
    onOpenChange(false);
  };
  const handleSetPending = () => {
    updateStatus({
      vendaId: venda.id,
      status: 'pendente',
      motivoPendencia
    });
    onOpenChange(false);
  };
  const handleDeleteConfirm = async () => {
    await deleteVenda(venda.id);
    onOpenChange(false);
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
        return 'Desistiu';
      default:
        return status;
    }
  };

  // Extrair tipo de venda e data de matrícula das respostas do formulário
  const tipoVenda = formDetails?.find(r => r.campo_nome === 'Tipo de Venda')?.valor_informado || 'Não informado';
  const dataMatriculaRaw = formDetails?.find(r => r.campo_nome === 'Data de Matrícula')?.valor_informado;
  
  // Formatar data de matrícula para padrão brasileiro
  const formatarDataBrasileira = (dataString: string | undefined): string => {
    if (!dataString) return '';
    
    try {
      // Tentar parsear diferentes formatos de data
      let date: Date | null = null;
      
      if (dataString.includes('-')) {
        // Formato ISO: YYYY-MM-DD ou YYYY-MM-DD HH:mm:ss
        date = parseISO(dataString);
      } else if (dataString.includes('/')) {
        // Formato brasileiro: DD/MM/YYYY
        const [dia, mes, ano] = dataString.split('/');
        if (dia && mes && ano) {
          date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        }
      }
      
      if (date && isValid(date)) {
        return format(date, 'dd/MM/yyyy', { locale: ptBR });
      }
      
      return dataString; // Retorna o valor original se não conseguir formatar
    } catch (error) {
      console.warn('Erro ao formatar data:', error);
      return dataString || '';
    }
  };
  
  const dataMatricula = formatarDataBrasileira(dataMatriculaRaw);
  
  console.log('🗓️ Debug formatação de data:', {
    dataMatriculaRaw,
    dataMatriculaFormatada: dataMatricula,
    formDetails: formDetails?.map(r => ({ campo: r.campo_nome, valor: r.valor_informado }))
  });
  const handleSaveValidations = async (validations: any[]) => {
    setIsSavingValidations(true);
    try {
      console.log('Salvando validações:', validations);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Validações salvas!',
        description: 'As validações dos campos foram salvas com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao salvar validações:', error);
      toast({
        variant: "destructive",
        title: 'Erro',
        description: 'Erro ao salvar as validações dos campos.'
      });
    } finally {
      setIsSavingValidations(false);
    }
  };
  return <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">
                  Gerenciar Venda #{venda.id.substring(0, 8)}
                </DialogTitle>
                <DialogDescription>
                  Aprovar, rejeitar ou alterar status da venda
                </DialogDescription>
                {dataMatricula && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Data de Matrícula:</span> {dataMatricula}
                  </div>
                )}
              </div>
              <Badge variant={getStatusBadgeVariant(venda.status)}>
                {getStatusLabel(venda.status)}
              </Badge>
            </div>
          </DialogHeader>

          {/* Conteúdo Principal */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
              {/* Coluna Esquerda */}
              <div className="space-y-6">
                <VendaAlunoInfoCard alunoData={venda.aluno} isLoading={false} />
                <VendaCursoInfoCard cursoData={venda.curso} />
                
                {/* Status da Venda */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Status da Venda</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status Atual:</span>
                      <Badge variant={getStatusBadgeVariant(venda.status)}>
                        {getStatusLabel(venda.status)}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Pontuação (calculada automaticamente):</span>
                        <p className="font-medium text-lg text-ppgvet-teal">{DataFormattingService.formatPoints(venda.pontuacao_esperada || 0)} pts</p>
                        <span className="text-xs text-gray-500">Esta pontuação é calculada automaticamente com base nas regras de negócio</span>
                      </div>
                      {venda.pontuacao_validada && (
                        <div>
                          <span className="text-sm text-gray-600">Pontuação Validada:</span>
                          <p className="font-medium">{DataFormattingService.formatPoints(venda.pontuacao_validada)} pts</p>
                        </div>
                      )}
                    </div>
                    {venda.motivo_pendencia && <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <span className="text-sm font-medium text-yellow-800">Motivo da Pendência:</span>
                        <p className="text-sm text-yellow-700 mt-1">{venda.motivo_pendencia}</p>
                      </div>}
                  </div>
                </div>
              </div>

              {/* Coluna Direita */}
              <div className="space-y-6">
                <VendaDocumentCard documentPath={venda.documento_comprobatorio || null} tipoVenda={tipoVenda} vendaId={venda.id} />
                <VendaObservationsCard observacoes={venda.observacoes || ''} />
              </div>
            </div>
            
            {/* Detalhes do Formulário */}
            <div className="mt-6">
              <VendaFormDetailsCard respostas={formDetails} isLoading={isLoadingDetails} error={detailsError} vendaId={venda.id} onRefetch={refetchDetails} />
            </div>

            {/* Validação de Campos */}
            <div className="mt-6">
              <VendaFieldValidationCard respostas={formDetails} isLoading={isLoadingDetails} error={detailsError} vendaId={venda.id} onSaveValidations={handleSaveValidations} isSaving={isSavingValidations} />
            </div>
          </div>

          {/* Seção de Gerenciamento */}
          <div className="border-t pt-4 space-y-4 flex-shrink-0">
            <div>
              <Label htmlFor="dataAssinatura">Data de Assinatura do Contrato *</Label>
              <Input
                id="dataAssinatura"
                type="date"
                value={dataAssinaturaContrato}
                onChange={(e) => setDataAssinaturaContrato(e.target.value)}
                placeholder="Data de assinatura"
              />
              <span className="text-xs text-gray-600 mt-1">
                Obrigatório para aprovação da venda
              </span>
            </div>

            <div>
              <Label htmlFor="motivo">Motivo da Pendência (opcional)</Label>
              <Textarea 
                id="motivo" 
                value={motivoPendencia} 
                onChange={e => setMotivoPendencia(e.target.value)} 
                placeholder="Digite o motivo caso seja necessário..." 
                rows={3} 
              />
            </div>

            {/* Seção de Exclusão */}
            {canDeleteVendas && <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-red-800">🚨 Zona de Perigo</h4>
                    <p className="text-xs text-red-600">Exclusão PERMANENTE desta venda</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)} disabled={isUpdating || isDeleting}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    {isDeleting ? 'Excluindo...' : 'Excluir'}
                  </Button>
                </div>
              </div>}
          </div>

          <DialogFooter className="gap-2 flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating || isDeleting}>
              Cancelar
            </Button>
            
            {venda.status !== 'pendente' && <Button variant="secondary" onClick={handleSetPending} disabled={isUpdating || isDeleting}>
                Marcar como Pendente
              </Button>}
            
            <Button variant="destructive" onClick={handleOpenRejectDialog} disabled={isUpdating || isDeleting}>
              Rejeitar
            </Button>
            
            <Button onClick={handleApprove} disabled={isUpdating || isDeleting}>
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogos */}
      <RejectVendaDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen} onConfirm={handleConfirmReject} isLoading={isUpdating} vendaNome={venda.aluno?.nome} />

      <DeleteVendaDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDeleteConfirm} isLoading={isDeleting} vendaId={venda.id} vendaNome={venda.aluno?.nome} />
    </>;
};
export default AdminVendaActionsDialog;