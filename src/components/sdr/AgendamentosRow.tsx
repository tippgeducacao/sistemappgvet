import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

interface AgendamentosRowProps {
  semana: number;
  formatPeriodo: (semana: number) => string;
  isAtual: boolean;
  percentual: number;
  metaValue: number;
  realizado: number;
  getStatusBadge: (percentual: number, isAtual: boolean) => React.ReactNode;
  getAgendamentosNaSemana: (semana: number) => Promise<{
    realizados: number;
    meta: number;
    percentual: number;
  }>;
  calcularComissaoSemana: (agendamentosRealizados: number, metaAgendamentos: number) => Promise<{
    valor: number;
    multiplicador: number;
    percentual: number;
  }>;
  cachedCommission?: any;
  isLoadingCommission?: boolean;
}

const AgendamentosRow: React.FC<AgendamentosRowProps> = ({
  semana,
  formatPeriodo,
  isAtual,
  percentual,
  metaValue,
  realizado,
  getStatusBadge,
  getAgendamentosNaSemana,
  calcularComissaoSemana,
  cachedCommission,
  isLoadingCommission
}) => {
  const [agendamentosData, setAgendamentosData] = useState({
    realizados: 0,
    meta: 0,
    percentual: 0
  });
  const [comissaoData, setComissaoData] = useState({
    valor: 0,
    multiplicador: 0,
    percentual: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const agendamentosResult = await getAgendamentosNaSemana(semana);
        
        // Para SDRs, calcular comissão baseada nos agendamentos realizados vs meta de agendamentos
        const comissaoResult = await calcularComissaoSemana(
          agendamentosResult.realizados, 
          agendamentosResult.meta
        );
        
        setAgendamentosData(agendamentosResult);
        setComissaoData(comissaoResult);
      } catch (error) {
        console.error('Erro ao buscar dados da semana:', error);
        setAgendamentosData({ realizados: 0, meta: 0, percentual: 0 });
        setComissaoData({ valor: 0, multiplicador: 0, percentual: 0 });
      }
      setLoading(false);
    };
    
    fetchData();
  }, [semana]);

  return (
    <tr 
      className={`border-b hover:bg-muted/50 ${isAtual ? 'bg-blue-50 dark:bg-blue-950/20' : ''} ${percentual < 71 && percentual > 0 ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
    >
      <td className="p-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{semana}</span>
          {isAtual && <Badge variant="secondary" className="text-xs">Atual</Badge>}
        </div>
      </td>
      <td className="p-3 text-sm text-muted-foreground">
        {formatPeriodo(semana)}
      </td>
      <td className="p-3">
        {loading ? (
          <span className="text-sm text-muted-foreground">...</span>
        ) : (
          <Badge variant="outline" className="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
            {agendamentosData.meta}
          </Badge>
        )}
      </td>
      <td className="p-3">
        {loading ? (
          <span className="text-sm text-muted-foreground">...</span>
        ) : (
          <span className="font-medium">{agendamentosData.realizados}</span>
        )}
      </td>
      <td className="p-3">
        {loading ? (
          <span className="text-sm text-muted-foreground">...</span>
        ) : (
          <span className={`font-medium ${agendamentosData.percentual >= 100 ? 'text-emerald-600' : agendamentosData.percentual >= 70 ? 'text-green-600' : 'text-red-600'}`}>
            {agendamentosData.percentual}%
          </span>
        )}
      </td>
      <td className="p-3">
        {loading ? (
          <span className="text-sm text-muted-foreground">...</span>
        ) : (
          <div className="flex items-center">
            <span className={`font-medium text-sm ${comissaoData.multiplicador > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
              {comissaoData.multiplicador > 0 ? `${comissaoData.multiplicador}x` : '0x'}
            </span>
          </div>
        )}
      </td>
      <td className="p-3">
        {loading ? (
          <span className="text-sm text-muted-foreground">...</span>
        ) : (
          <div className="flex flex-col">
            <span className={`font-medium text-sm ${comissaoData.valor > 0 ? 'text-green-600' : 'text-gray-500'}`}>
              R$ {comissaoData.valor.toFixed(2)}
            </span>
          </div>
        )}
      </td>
      <td className="p-3">
        {loading ? (
          <span className="text-sm text-muted-foreground">...</span>
        ) : (
          getStatusBadge(agendamentosData.percentual, isAtual)
        )}
      </td>
    </tr>
  );
};

export default AgendamentosRow;