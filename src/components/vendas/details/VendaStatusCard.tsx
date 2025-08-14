
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditMatriculaDateDialog from '../dialogs/EditMatriculaDateDialog';

interface VendaStatusCardProps {
  status: string;
  pontuacaoEsperada: number | null;
  pontuacaoValidada: number | null;
  motivoPendencia: string | null;
  dataMatricula?: string | null;
  dataAssinaturaContrato?: string | null;
  dataAssinaturaContratoRaw?: string | null;
  vendaId: string;
  userType: string;
  onUpdate: () => void;
}

const VendaStatusCard: React.FC<VendaStatusCardProps> = ({
  status,
  pontuacaoEsperada,
  pontuacaoValidada,
  motivoPendencia,
  dataMatricula,
  dataAssinaturaContrato,
  dataAssinaturaContratoRaw,
  vendaId,
  userType,
  onUpdate
}) => {
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
      case 'desistiu': return 'Rejeitada';
      default: return status;
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-purple-900">Status da Venda</h3>
        <Badge className={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Badge>
      </div>
      <div className="p-0">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b bg-white hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-700 w-1/3">Status Atual:</td>
              <td className="px-4 py-3 text-gray-900">
                <Badge className={getStatusColor(status)}>
                  {getStatusLabel(status)}
                </Badge>
              </td>
            </tr>
            <tr className="border-b bg-gray-50 hover:bg-gray-100">
              <td className="px-4 py-3 font-medium text-gray-700 w-1/3">Pontuação (calculada automaticamente):</td>
              <td className="px-4 py-3 text-cyan-600 font-medium">{pontuacaoEsperada || 0} pts</td>
            </tr>
            <tr className="bg-white hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-700 w-1/3">Pontuação Validada:</td>
              <td className="px-4 py-3 text-green-600 font-medium">{pontuacaoValidada || '-'} pts</td>
            </tr>
            
            {/* Mostrar as datas apenas se a venda foi aprovada/matriculada */}
            {status === 'matriculado' && (
              <>
                  <tr className="border-b bg-gray-50 hover:bg-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-700 w-1/3">Data de Matrícula:</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">
                      {dataMatricula || 'Não informada'}
                  </td>
                </tr>
                <tr className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700 w-1/3">Data de Assinatura de Contrato:</td>
                  <td className="px-4 py-3 text-purple-600 font-medium flex items-center justify-between">
                    <span>
                      {dataAssinaturaContrato ? dataAssinaturaContrato : 'Não informada'}
                    </span>
                    <EditMatriculaDateDialog 
                      vendaId={vendaId}
                      currentDate={dataAssinaturaContratoRaw}
                      onUpdate={onUpdate}
                      userType={userType}
                    />
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
        
        {motivoPendencia && (
          <div className={`m-4 border rounded-lg p-3 ${
            status === 'desistiu' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <span className={`text-sm font-medium ${
              status === 'desistiu' 
                ? 'text-red-800' 
                : 'text-yellow-800'
            }`}>
              {status === 'desistiu' ? 'Motivo da Rejeição:' : 'Motivo da Pendência:'}
            </span>
            <p className={`text-sm mt-1 ${
              status === 'desistiu' 
                ? 'text-red-700' 
                : 'text-yellow-700'
            }`}>
              {motivoPendencia}
            </p>
            {status === 'desistiu' && (
              <p className="text-xs text-red-600 mt-2 italic">
                💡 Corrija os pontos mencionados e envie uma nova venda
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendaStatusCard;
