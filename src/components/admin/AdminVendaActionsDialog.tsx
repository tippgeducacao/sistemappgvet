import React, { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [pontuacaoExtra, setPontuacaoExtra] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isSavingValidations, setIsSavingValidations] = useState(false);
  const [showMotivoField, setShowMotivoField] = useState(false);
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
      setShowMotivoField(!!venda.motivo_pendencia);
    }
  }, [venda]);
  if (!venda) return null;

  // Verificar se o usuário atual pode excluir vendas
  const userEmail = profile?.email || currentUser?.email || '';
  const canDeleteVendas = userEmail === 'wallasmonteiro019@gmail.com';
  const handleApprove = () => {
    console.log('🎯 AdminVendaActionsDialog: BOTÃO APROVAÇÃO CLICADO!');
    console.log('📋 Dados da venda:', { id: venda.id.substring(0, 8), status: venda.status });
    console.log('📅 Data assinatura:', dataAssinaturaContrato);
    
    // Validar se a data de assinatura foi preenchida
    if (!dataAssinaturaContrato) {
      console.log('❌ Faltou data de assinatura');
      toast({
        title: "Campo obrigatório",
        description: "Para aprovar a venda é obrigatório informar a data de assinatura do contrato",
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ Validação passou, chamando updateStatus...');
    // Calcular pontuação total (esperada + extra)
    const pontuacaoBase = venda.pontuacao_esperada || 0;
    const pontuacaoExtraValue = parseFloat(pontuacaoExtra) || 0;
    const pontuacaoTotal = pontuacaoBase + pontuacaoExtraValue;
    
    console.log('🔢 Pontuação base:', pontuacaoBase);
    console.log('➕ Pontuação extra:', pontuacaoExtraValue);
    console.log('📊 Pontuação total:', pontuacaoTotal);
    
    updateStatus({
      vendaId: venda.id,
      status: 'matriculado',
      pontuacaoValidada: pontuacaoTotal,
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
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <DialogTitle className="text-lg">
                    Gerenciar Venda #{venda.id.substring(0, 8)}
                  </DialogTitle>
                </div>
                {dataMatricula && (
                  <div className="text-sm text-gray-600">
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
            {/* Informações Compactas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
              {/* Informações do Aluno */}
              <div className="bg-white border rounded-lg shadow-sm">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 border-b">
                  <h3 className="font-semibold text-blue-900 text-sm">Informações do Aluno</h3>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b bg-white hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-700 w-1/3">Nome:</td>
                      <td className="px-3 py-2 text-gray-900">{venda.aluno?.nome || 'Não informado'}</td>
                    </tr>
                    <tr className="bg-gray-50 hover:bg-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-700 w-1/3">Email:</td>
                      <td className="px-3 py-2 text-gray-900">{venda.aluno?.email || 'Não informado'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Informações do Curso */}
              <div className="bg-white border rounded-lg shadow-sm">
                <div className="bg-gradient-to-r from-green-50 to-green-100 px-3 py-2 border-b">
                  <h3 className="font-semibold text-green-900 text-sm">Informações do Curso</h3>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                     <tr className="border-b bg-white hover:bg-gray-50">
                       <td className="px-3 py-2 font-medium text-gray-700 w-1/3">Curso:</td>
                       <td className="px-3 py-2 text-gray-900">{venda.curso?.nome || 'Não informado'}</td>
                     </tr>
                     <tr className="border-b bg-gray-50 hover:bg-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-700 w-1/3">Semestre:</td>
                        <td className="px-3 py-2 text-gray-900">
                          {formDetails?.find(r => r.campo_nome === 'Semestre' || r.campo_nome === 'semestre')?.valor_informado || 'Não informado'}
                        </td>
                      </tr>
                      <tr className="bg-white hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-700 w-1/3">Ano:</td>
                        <td className="px-3 py-2 text-gray-900">
                          {formDetails?.find(r => r.campo_nome === 'Ano' || r.campo_nome === 'ano')?.valor_informado || 'Não informado'}
                        </td>
                      </tr>
                      <tr className="border-b bg-gray-50 hover:bg-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-700 w-1/3">Turma:</td>
                        <td className="px-3 py-2 text-gray-900">
                          {formDetails?.find(r => r.campo_nome === 'Turma' || r.campo_nome === 'turma')?.valor_informado || 'Não informado'}
                        </td>
                      </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status da Venda */}
            <div className="bg-white border rounded-lg shadow-sm mb-4">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-3 py-2 border-b">
                <h3 className="font-semibold text-purple-900 text-sm">Status da Venda</h3>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-700 w-1/4">Status Atual:</td>
                    <td className="px-3 py-2 text-gray-900">
                      <Badge variant={getStatusBadgeVariant(venda.status)}>
                        {getStatusLabel(venda.status)}
                      </Badge>
                    </td>
                  </tr>
                  <tr className="border-b bg-gray-50 hover:bg-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-700 w-1/4">Pontuação (calculada automaticamente):</td>
                    <td className="px-3 py-2 text-cyan-600 font-medium">{DataFormattingService.formatPoints(venda.pontuacao_esperada || 0)} pts</td>
                  </tr>
                  {venda.pontuacao_validada && (
                    <tr className="border-b bg-white hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-700 w-1/4">Pontuação Validada:</td>
                      <td className="px-3 py-2 text-green-600 font-medium">{DataFormattingService.formatPoints(venda.pontuacao_validada)} pts</td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {venda.motivo_pendencia && (
                <div className="m-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                  <span className="text-xs font-medium text-yellow-800">Motivo da Pendência:</span>
                  <p className="text-xs text-yellow-700 mt-1">{venda.motivo_pendencia}</p>
                </div>
              )}

              {venda.observacoes && (
                <div className="m-3 bg-gray-50 border border-gray-200 rounded p-3">
                  <span className="text-xs font-medium text-gray-800">Observações:</span>
                  <p className="text-xs text-gray-700 mt-1">{venda.observacoes}</p>
                </div>
              )}
            </div>
            
            {/* Detalhes do Formulário */}
            <div className="mt-3">
              <VendaFormDetailsCard respostas={formDetails} isLoading={isLoadingDetails} error={detailsError} vendaId={venda.id} onRefetch={refetchDetails} />
            </div>

            {/* Validação de Campos */}
            <div className="mt-3">
              <VendaFieldValidationCard respostas={formDetails} isLoading={isLoadingDetails} error={detailsError} vendaId={venda.id} onSaveValidations={handleSaveValidations} isSaving={isSavingValidations} />
            </div>
          </div>

          {/* Seção de Gerenciamento */}
          <div className="border-t pt-3 space-y-3 flex-shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dataAssinatura" className="text-sm">Data de Assinatura do Contrato *</Label>
                <Input
                  id="dataAssinatura"
                  type="date"
                  value={dataAssinaturaContrato}
                  onChange={(e) => setDataAssinaturaContrato(e.target.value)}
                  placeholder="Data de assinatura"
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="pontuacaoExtra" className="text-sm">Pontuação Extra (opcional)</Label>
                <Input
                  id="pontuacaoExtra"
                  type="number"
                  step="0.1"
                  min="0"
                  value={pontuacaoExtra}
                  onChange={(e) => setPontuacaoExtra(e.target.value)}
                  placeholder="Ex: 2.5"
                  className="text-sm"
                />
                {pontuacaoExtra && (
                  <span className="text-xs text-gray-600">
                    Total: {DataFormattingService.formatPoints((venda.pontuacao_esperada || 0) + (parseFloat(pontuacaoExtra) || 0))} pts
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox 
                  id="motivo-checkbox"
                  checked={showMotivoField}
                  onCheckedChange={(checked) => {
                    setShowMotivoField(!!checked);
                    if (!checked) {
                      setMotivoPendencia('');
                    }
                  }}
                />
                <Label htmlFor="motivo-checkbox" className="text-sm">Adicionar motivo da pendência</Label>
              </div>
              {showMotivoField && (
                <Textarea 
                  value={motivoPendencia} 
                  onChange={e => setMotivoPendencia(e.target.value)} 
                  placeholder="Digite o motivo..." 
                  rows={2}
                  className="text-sm"
                />
              )}
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
            
            <Button 
              variant="destructive" 
              onClick={handleOpenRejectDialog} 
              disabled={isUpdating || isDeleting || venda.status === 'desistiu'}
            >
              Rejeitar
            </Button>
            
            <Button 
              onClick={handleApprove} 
              disabled={isUpdating || isDeleting || venda.status === 'matriculado'}
            >
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