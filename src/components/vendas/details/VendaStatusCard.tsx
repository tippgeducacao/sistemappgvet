
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VendaStatusCardProps {
  status: string;
  pontuacaoEsperada: number | null;
  pontuacaoValidada: number | null;
  motivoPendencia: string | null;
}

const VendaStatusCard: React.FC<VendaStatusCardProps> = ({
  status,
  pontuacaoEsperada,
  pontuacaoValidada,
  motivoPendencia
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Status da Venda
          <Badge className={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Pontuação Esperada:</span>
              <p className="font-medium">{pontuacaoEsperada || 0} pontos</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Pontuação Validada:</span>
              <p className="font-medium">{pontuacaoValidada || '-'} pontos</p>
            </div>
          </div>
          
          {motivoPendencia && (
            <div className={`border rounded-lg p-3 ${
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
      </CardContent>
    </Card>
  );
};

export default VendaStatusCard;
