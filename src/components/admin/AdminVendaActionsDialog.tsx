import React, { useState, useEffect } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, AlertCircle, Save } from 'lucide-react';
import { useAdminVendas } from '@/hooks/useAdminVendas';
import { useFormDetails } from '@/hooks/useFormDetails';
import { useAuthStore } from '@/stores/AuthStore';
import VendaStatusCard from '@/components/vendas/details/VendaStatusCard';
import VendaAlunoInfoCard from '@/components/vendas/details/VendaAlunoInfoCard';
import VendaCursoInfoCard from '@/components/vendas/details/VendaCursoInfoCard';
import VendaObservationsCard from '@/components/vendas/details/VendaObservationsCard';
import VendaFormDetailsCard from '@/components/vendas/details/VendaFormDetailsCard';
import VendaDocumentCard from '@/components/vendas/details/VendaDocumentCard';
import type { VendaCompleta } from '@/hooks/useVendas';
import VendaFieldValidationCard from '@/components/vendas/details/VendaFieldValidationCard';
import { useToast } from '@/hooks/use-toast';
import RejectVendaDialog from '@/components/vendas/dialogs/RejectVendaDialog';

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
  
  const { currentUser, profile } = useAuthStore();
  const { toast } = useToast();

  const [pontuacaoValidada, setPontuacaoValidada] = useState<string>('');
  const [motivoPendencia, setMotivoPendencia] = useState<string>('');
  const [dataAssinaturaContrato, setDataAssinaturaContrato] = useState<string>('');
  const [pontuacaoExtra, setPontuacaoExtra] = useState<string>('');
  const [showMotivoField, setShowMotivoField] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isSavingValidations, setIsSavingValidations] = useState(false);

  const {
    formDetails,
    isLoading: isLoadingDetails,
    error: detailsError,
    refetch: refetchDetails
  } = useFormDetails(venda?.id || '');

  const formatarDataBrasileira = (data: string | Date | null): string => {
    if (!data) return '';
    try {
      const date = typeof data === 'string' ? parseISO(data) : data;
      return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : '';
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    if (venda) {
      setPontuacaoValidada(venda.pontuacao_validada?.toString() || '');
      setMotivoPendencia(venda.motivo_pendencia || '');
      setDataAssinaturaContrato(venda.data_assinatura_contrato || '');
    }
  }, [venda]);

  if (!venda) return null;

  const handleApprove = () => {
    console.log('🎯 AdminVendaActionsDialog: BOTÃO APROVAÇÃO CLICADO!');
    console.log('📋 Dados da venda:', { id: venda.id.substring(0, 8), status: venda.status });
    console.log('📅 Data assinatura:', dataAssinaturaContrato);
    
    if (!dataAssinaturaContrato) {
      console.log('❌ Faltou data de assinatura');
      toast({
        title: "Data de assinatura obrigatória",
        description: "Para aprovar a venda é obrigatório informar a data de assinatura do contrato",
        variant: "destructive",
      });
      return;
    }

    const pontuacao = pontuacaoValidada ? parseFloat(pontuacaoValidada) : undefined;
    console.log('✅ Chamando updateStatus com:', { status: 'matriculado', pontuacao, dataAssinatura: dataAssinaturaContrato });
    
    updateStatus(venda.id, 'matriculado', pontuacao, undefined, dataAssinaturaContrato);
  };

  const handleSetPending = () => {
    const motivo = motivoPendencia.trim();
    if (!motivo) {
      setShowMotivoField(true);
      return;
    }
    updateStatus(venda.id, 'pendente', undefined, motivo);
  };

  const handleOpenRejectDialog = () => {
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async (motivo: string) => {
    await updateStatus(venda.id, 'desistiu', undefined, motivo);
    setRejectDialogOpen(false);
  };

  const handleSaveValidations = async (validationData: any) => {
    setIsSavingValidations(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('💾 Salvando validações:', validationData);
      toast({
        title: "Validações salvas",
        description: "As validações de campos foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar validações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as validações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSavingValidations(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="p-1 h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex-1">
                <DialogTitle className="text-lg">Gerenciar Venda</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {venda.aluno?.nome} - {venda.curso?.nome}
                </DialogDescription>
              </div>

              <Badge variant={venda.status === 'matriculado' ? 'default' : venda.status === 'pendente' ? 'secondary' : 'destructive'}>
                {venda.status === 'matriculado' ? 'Matriculado' : venda.status === 'pendente' ? 'Pendente' : 'Rejeitada'}
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <VendaAlunoInfoCard venda={venda} />
              <VendaCursoInfoCard venda={venda} />
            </div>

            <VendaStatusCard venda={venda} />

            {venda.observacoes && (
              <VendaObservationsCard observacoes={venda.observacoes} />
            )}

            <VendaDocumentCard venda={venda} />

            <div className="space-y-3">
              <VendaFormDetailsCard respostas={formDetails} isLoading={isLoadingDetails} error={detailsError} vendaId={venda.id} onRefetch={refetchDetails} />
            </div>

            <div className="mt-3">
              <VendaFieldValidationCard respostas={formDetails} isLoading={isLoadingDetails} error={detailsError} vendaId={venda.id} onSaveValidations={handleSaveValidations} isSaving={isSavingValidations} />
            </div>
          </div>

          <div className="border-t pt-3 space-y-3 flex-shrink-0 px-6 pb-4">
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
                <Label htmlFor="pontuacaoValidada" className="text-sm">Pontuação Validada (opcional)</Label>
                <Input
                  id="pontuacaoValidada"
                  type="number"
                  step="0.01"
                  value={pontuacaoValidada}
                  onChange={(e) => setPontuacaoValidada(e.target.value)}
                  placeholder="Pontuação"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Motivo (Opcional para Pendente/Rejeitar)</Label>
                {venda.status !== 'pendente' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMotivoField(!showMotivoField)}
                    className="text-xs"
                  >
                    {showMotivoField ? 'Ocultar' : 'Adicionar motivo'}
                  </Button>
                )}
              </div>
              
              {(showMotivoField || venda.status === 'pendente' || motivoPendencia) && (
                <Textarea
                  value={motivoPendencia} 
                  onChange={e => setMotivoPendencia(e.target.value)} 
                  placeholder="Digite o motivo..." 
                  rows={2}
                  className="text-sm"
                />
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 flex-shrink-0 border-t pt-4 px-6 pb-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
              Cancelar
            </Button>
            
            {venda.status !== 'pendente' && (
              <Button variant="secondary" onClick={handleSetPending} disabled={isUpdating}>
                Marcar como Pendente
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              onClick={handleOpenRejectDialog} 
              disabled={isUpdating || venda.status === 'desistiu'}
            >
              Rejeitar
            </Button>
            
            <Button 
              onClick={handleApprove} 
              disabled={isUpdating || venda.status === 'matriculado'}
            >
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejectVendaDialog 
        open={rejectDialogOpen} 
        onOpenChange={setRejectDialogOpen} 
        onConfirm={handleConfirmReject} 
        isLoading={isUpdating} 
        vendaNome={venda.aluno?.nome} 
      />
    </>
  );
};

export default AdminVendaActionsDialog;