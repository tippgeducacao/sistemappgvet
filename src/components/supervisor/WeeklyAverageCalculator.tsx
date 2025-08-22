import React from 'react';
import { useSupervisorComissionamento } from '@/hooks/useSupervisorComissionamento';

interface Member {
  id: string;
  usuario_id: string;
  usuario?: {
    user_type?: string;
  };
}

interface WeeklyAverageCalculatorProps {
  supervisorId: string;
  year: number;
  month: number;
  week: number;
  members: Member[];
}

export const WeeklyAverageCalculator: React.FC<WeeklyAverageCalculatorProps> = ({
  supervisorId,
  year,
  month,
  week,
  members
}) => {
  const { data: supervisorData, isLoading } = useSupervisorComissionamento(supervisorId, year, week);

  if (isLoading) {
    return <span className="text-muted-foreground">...</span>;
  }

  if (!supervisorData?.sdrsDetalhes) {
    return <span>0.0%</span>;
  }

  // Calcular média dos percentuais dos membros
  const percentuais = members.map(membro => {
    const membroDetalhe = supervisorData.sdrsDetalhes.find(sdr => sdr.id === membro.usuario_id);
    return membroDetalhe?.percentualAtingimento || 0;
  });

  const mediaPercentual = percentuais.length > 0 
    ? percentuais.reduce((sum, p) => sum + p, 0) / percentuais.length 
    : 0;

  return <span>{mediaPercentual.toFixed(1)}%</span>;
};