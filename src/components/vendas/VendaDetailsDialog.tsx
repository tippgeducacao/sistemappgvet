
import React from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
              {dataMatricula && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Data de Matrícula:</span> {dataMatricula}
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
              {/* Informações do Aluno */}
              <div className="bg-white border rounded-lg shadow-sm">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 border-b">
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
                <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 border-b">
                  <h3 className="font-semibold text-green-900 text-sm">Informações do Curso</h3>
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="bg-white hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-700 w-1/3">Curso:</td>
                      <td className="px-3 py-2 text-gray-900">{venda.curso?.nome || 'Não informado'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status da Venda */}
            <div className="bg-white border rounded-lg shadow-sm mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-2 border-b flex items-center justify-between">
                <h3 className="font-semibold text-purple-900 text-sm">Status da Venda</h3>
                <Badge className={getStatusColor(venda.status)}>
                  {getStatusLabel(venda.status)}
                </Badge>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b bg-white hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-700 w-1/4">Status Atual:</td>
                    <td className="px-3 py-2 text-gray-900">
                      <Badge className={getStatusColor(venda.status)}>
                        {getStatusLabel(venda.status)}
                      </Badge>
                    </td>
                  </tr>
                  <tr className="border-b bg-gray-50 hover:bg-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-700 w-1/4">Pontuação (calculada automaticamente):</td>
                    <td className="px-3 py-2 text-cyan-600 font-medium">{venda.pontuacao_esperada || 0} pts</td>
                  </tr>
                  <tr className="bg-white hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-700 w-1/4">Pontuação Validada:</td>
                    <td className="px-3 py-2 text-green-600 font-medium">{venda.pontuacao_validada || '-'} pts</td>
                  </tr>
                </tbody>
              </table>
              
              {venda.motivo_pendencia && (
                <div className={`m-3 border rounded-lg p-3 ${
                  venda.status === 'desistiu' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <span className={`text-xs font-medium ${
                    venda.status === 'desistiu' 
                      ? 'text-red-800' 
                      : 'text-yellow-800'
                  }`}>
                    {venda.status === 'desistiu' ? 'Motivo da Rejeição:' : 'Motivo da Pendência:'}
                  </span>
                  <p className={`text-xs mt-1 ${
                    venda.status === 'desistiu' 
                      ? 'text-red-700' 
                      : 'text-yellow-700'
                  }`}>
                    {venda.motivo_pendencia}
                  </p>
                </div>
              )}
            </div>

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
