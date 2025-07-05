
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFormDetails } from '@/hooks/useFormDetails';
import VendaAlunoInfoCard from './details/VendaAlunoInfoCard';
import VendaCursoInfoCard from './details/VendaCursoInfoCard';
import VendaStatusCard from './details/VendaStatusCard';
import VendaObservationsCard from './details/VendaObservationsCard';
import VendaFormDetailsCard from './details/VendaFormDetailsCard';
import VendaDocumentCard from './details/VendaDocumentCard';
import type { VendaCompleta } from '@/hooks/useVendas';

interface VendaDetailsDialogProps {
  venda: VendaCompleta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VendaDetailsDialog: React.FC<VendaDetailsDialogProps> = ({
  venda,
  open,
  onOpenChange
}) => {
  const { 
    data: formDetails, 
    isLoading: isLoadingDetails, 
    error: detailsError,
    refetch: refetchDetails 
  } = useFormDetails(venda?.id);

  if (!venda) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'matriculado': return 'bg-green-100 text-green-800';
      case 'desistiu': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'matriculado': return 'Aprovada/Matriculada';
      case 'desistiu': return 'Rejeitada/Desistiu';
      default: return status;
    }
  };

  // Extrair tipo de venda das respostas do formulário
  const tipoVenda = formDetails?.find(r => r.campo_nome === 'Tipo de Venda')?.valor_informado || 'Não informado';

  // Debug logs para entender o que está acontecendo
  console.log('🔍 Dados da venda para documento:', {
    vendaId: venda.id,
    documentoComprobatorio: venda.documento_comprobatorio,
    tipoVenda: tipoVenda,
    formDetails: formDetails?.map(r => ({ campo: r.campo_nome, valor: r.valor_informado }))
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Detalhes da Venda #{venda.id.substring(0, 8)}
              </DialogTitle>
              <DialogDescription>
                Informações completas sobre a venda cadastrada
              </DialogDescription>
            </div>
            <Badge className={getStatusColor(venda.status)}>
              {getStatusLabel(venda.status)}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
              <div className="space-y-6">
                <VendaAlunoInfoCard 
                  alunoData={venda.aluno}
                  isLoading={false}
                />
                <VendaCursoInfoCard 
                  cursoData={venda.curso}
                />
                <VendaStatusCard 
                  status={venda.status}
                  pontuacaoEsperada={venda.pontuacao_esperada}
                  pontuacaoValidada={venda.pontuacao_validada}
                  motivoPendencia={venda.motivo_pendencia}
                />
              </div>
              
              <div className="space-y-6">
                <VendaDocumentCard 
                  documentPath={venda.documento_comprobatorio}
                  tipoVenda={tipoVenda}
                  vendaId={venda.id}
                  isLoadingFormDetails={isLoadingDetails}
                />
                <VendaObservationsCard 
                  observacoes={venda.observacoes || ''}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <VendaFormDetailsCard
                respostas={formDetails}
                isLoading={isLoadingDetails}
                error={detailsError}
                vendaId={venda.id}
                onRefetch={refetchDetails}
              />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VendaDetailsDialog;
