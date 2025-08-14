
import React from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFormDetails } from '@/hooks/useFormDetails';
import { useAuth } from '@/hooks/useAuth';
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

  const { profile } = useAuth();

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
  
  // Usar a data de assinatura da própria venda (que é limpa quando status muda para pendente/desistiu)
  // Só usar as respostas do formulário se a data na venda não existir
  let dataAssinaturaRaw = venda.data_assinatura_contrato;
  
  // Se não tiver na venda (casos antigos), buscar nas respostas do formulário
  if (!dataAssinaturaRaw) {
    dataAssinaturaRaw = formDetails?.find(r => r.campo_nome === 'Data de Assinatura do Contrato')?.valor_informado;
    if (!dataAssinaturaRaw) {
      dataAssinaturaRaw = formDetails?.find(r => r.campo_nome === 'Data de assinatura do contrato')?.valor_informado;
    }
    if (!dataAssinaturaRaw) {
      dataAssinaturaRaw = formDetails?.find(r => r.campo_nome === 'Data Assinatura Contrato')?.valor_informado;
    }
    if (!dataAssinaturaRaw) {
      dataAssinaturaRaw = formDetails?.find(r => r.campo_nome === 'Data de Assinatura')?.valor_informado;
    }
    if (!dataAssinaturaRaw) {
      dataAssinaturaRaw = formDetails?.find(r => r.campo_nome === 'DataAssinaturaContrato')?.valor_informado;
    }
  }
  
  const dataAssinatura = formatarDataBrasileira(dataAssinaturaRaw);

  // Debug logs para entender o que está acontecendo
  console.log('🔍 Debug completo da venda:', {
    vendaId: venda.id,
    vendaStatus: venda.status,
    vendaDataAssinatura: venda.data_assinatura_contrato,
    dataMatriculaRaw,
    dataMatricula,
    dataAssinaturaRaw,
    dataAssinatura,
    camposDisponiveis: formDetails?.map(r => r.campo_nome).sort(),
    formDetails: formDetails?.map(r => ({ campo: r.campo_nome, valor: r.valor_informado })),
    totalCampos: formDetails?.length
  });

  // Se a venda está pendente ou desistiu, a data de assinatura DEVE estar null
  if ((venda.status === 'pendente' || venda.status === 'desistiu') && venda.data_assinatura_contrato) {
    console.warn('⚠️ PROBLEMA: Venda está pendente/desistiu mas ainda tem data_assinatura_contrato:', {
      status: venda.status,
      dataAssinatura: venda.data_assinatura_contrato
    });
  }

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
              {(dataMatricula || dataAssinatura) && (
                <div className="mt-2 space-y-1">
                  {dataMatricula && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Data de Matrícula:</span> {dataMatricula}
                    </div>
                  )}
                  {dataAssinatura && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Data de Assinatura do Contrato:</span> {dataAssinatura}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Badge className={getStatusColor(venda.status)}>
              {getStatusLabel(venda.status)}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            {/* Informações Principais Compactas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Informações Básicas */}
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 px-4 py-2 border-b dark:border-gray-700">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Informações Básicas</h3>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300 w-1/3">Nome:</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{venda.aluno?.nome || 'Não informado'}</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                      <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300 w-1/3">Email:</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{venda.aluno?.email || 'Não informado'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Informações do Curso */}
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm">
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 px-4 py-2 border-b dark:border-gray-700">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 text-sm">Informações do Curso</h3>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300 w-1/3">Curso:</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{venda.curso?.nome || 'Não informado'}</td>
                    </tr>
                    <tr className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                      <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300 w-1/3">Semestre/Ano/Turma:</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                        {(() => {
                          const semestre = formDetails?.find(r => r.campo_nome === 'Semestre' || r.campo_nome === 'semestre')?.valor_informado;
                          const ano = formDetails?.find(r => r.campo_nome === 'Ano' || r.campo_nome === 'ano')?.valor_informado;
                          const turma = formDetails?.find(r => r.campo_nome === 'Turma' || r.campo_nome === 'turma')?.valor_informado;
                          
                          if (!semestre || !ano || !turma) return 'Não informado';
                          return `${semestre}/${ano}/${turma}`;
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status da Venda - Usando o componente VendaStatusCard */}
            <VendaStatusCard
              status={venda.status}
              pontuacaoEsperada={venda.pontuacao_esperada}
              pontuacaoValidada={venda.pontuacao_validada}
              motivoPendencia={venda.motivo_pendencia}
              dataMatricula={dataMatriculaRaw}
              dataAssinaturaContrato={venda.data_assinatura_contrato || dataAssinaturaRaw}
              vendaId={venda.id}
              userType={profile?.user_type || ''}
              onUpdate={refetchDetails}
            />

            {/* Documentos e Observações em grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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
            
            {/* Detalhes do Formulário */}
            <VendaFormDetailsCard
              respostas={formDetails}
              isLoading={isLoadingDetails}
              error={detailsError}
              vendaId={venda.id}
              onRefetch={refetchDetails}
            />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VendaDetailsDialog;
