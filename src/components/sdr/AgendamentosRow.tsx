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
}

const AgendamentosRow: React.FC<AgendamentosRowProps> = ({
  semana,
  formatPeriodo,
  isAtual,
  percentual,
  metaValue,
  realizado,
  getStatusBadge,
  getAgendamentosNaSemana
}) => {
  const [agendamentosData, setAgendamentosData] = useState({
    realizados: 0,
    meta: 0,
    percentual: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getAgendamentosNaSemana(semana);
        setAgendamentosData(data);
      } catch (error) {
        console.error('Erro ao buscar dados da semana:', error);
        setAgendamentosData({ realizados: 0, meta: 0, percentual: 0 });
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
        <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          {metaValue}
        </Badge>
      </td>
      <td className="p-3">
        <span className="font-medium">{realizado}</span>
      </td>
      <td className="p-3">
        <span className={`font-medium ${percentual >= 100 ? 'text-emerald-600' : percentual >= 71 ? 'text-green-600' : 'text-red-600'}`}>
          {percentual.toFixed(0)}%
        </span>
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
        {getStatusBadge(percentual, isAtual)}
      </td>
    </tr>
  );
};

export default AgendamentosRow;