import React from 'react';
import { useSupervisorComissionamento } from '@/hooks/useSupervisorComissionamento';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  // Buscar regras de comissionamento para supervisores
  const { data: regrasComissionamento } = useQuery({
    queryKey: ['regras-comissionamento', 'supervisor'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regras_comissionamento')
        .select('*')
        .eq('tipo_usuario', 'supervisor')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <span className="text-muted-foreground">...</span>;
  }

  if (!supervisorData?.sdrsDetalhes || !regrasComissionamento) {
    return <span>0.0% - R$ 0</span>;
  }

  // Calcular média dos percentuais dos membros
  const percentuais = members.map(membro => {
    const membroDetalhe = supervisorData.sdrsDetalhes.find(sdr => sdr.id === membro.usuario_id);
    return membroDetalhe?.percentualAtingimento || 0;
  });

  const mediaPercentual = percentuais.length > 0 
    ? percentuais.reduce((sum, p) => sum + p, 0) / percentuais.length 
    : 0;

  // Calcular comissão do supervisor baseado na média
  let comissaoSupervisor = 0;
  if (mediaPercentual >= regrasComissionamento.percentual_minimo) {
    const percentualNormalizado = Math.min(mediaPercentual, regrasComissionamento.percentual_maximo) / 100;
    
    // Buscar o fixo mensal do supervisor (assumindo valor base para cálculo)
    // Por enquanto vou usar um valor fixo, mas idealmente deveria vir do perfil do supervisor
    const valorBase = 1000; // Este valor deveria vir do perfil/nível do supervisor
    comissaoSupervisor = valorBase * percentualNormalizado * regrasComissionamento.multiplicador;
  }

  return (
    <div className="text-center">
      <div className="font-semibold">{mediaPercentual.toFixed(1)}%</div>
      <div className="text-xs text-muted-foreground">
        R$ {comissaoSupervisor.toFixed(0)}
      </div>
    </div>
  );
};