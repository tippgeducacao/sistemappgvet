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
  console.log('🚀 WeeklyAverageCalculator iniciado:', { supervisorId, year, week, membersCount: members.length });
  
  const { data: supervisorData, isLoading, error } = useSupervisorComissionamento(supervisorId, year, week);

  // Buscar regras de comissionamento (usar as mesmas dos vendedores)
  const { data: regrasComissionamento, error: regrasError } = useQuery({
    queryKey: ['regras-comissionamento', 'vendedor'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regras_comissionamento')
        .select('*')
        .eq('tipo_usuario', 'vendedor')
        .order('percentual_minimo', { ascending: true });
      
      if (error) {
        console.error('❌ Erro ao buscar regras:', error);
        throw error;
      }
      console.log('✅ Regras carregadas:', data);
      return data;
    }
  });

  console.log('📊 Status dos dados:', {
    isLoading,
    error,
    regrasError,
    hasSupervisorData: !!supervisorData,
    hasRegras: !!regrasComissionamento,
    supervisorDataStructure: supervisorData ? Object.keys(supervisorData) : null
  });

  if (isLoading) {
    return <span className="text-muted-foreground">...</span>;
  }

  if (error) {
    console.error('❌ Erro no hook useSupervisorComissionamento:', error);
    return <span>Erro - R$ 0</span>;
  }

  if (regrasError) {
    console.error('❌ Erro nas regras de comissionamento:', regrasError);
    return <span>0.0% - Erro regras</span>;
  }

  if (!supervisorData || !regrasComissionamento || regrasComissionamento.length === 0) {
    console.warn('⚠️ Dados não disponíveis:', { 
      supervisorData: !!supervisorData, 
      regrasComissionamento: regrasComissionamento?.length || 0 
    });
    return <span>0.0% - R$ 0</span>;
  }

  // Verificar se temos detalhes dos SDRs
  if (!supervisorData.sdrsDetalhes || supervisorData.sdrsDetalhes.length === 0) {
    console.warn('⚠️ Sem detalhes dos SDRs');
    return <span>0.0% - R$ 0</span>;
  }

  // Calcular média dos percentuais dos membros
  console.log('🔍 WeeklyAverageCalculator Debug:', {
    supervisorId,
    year,
    week,
    membersCount: members.length,
    sdrsDetalhesCount: supervisorData.sdrsDetalhes?.length || 0,
    supervisorData: supervisorData
  });

  const percentuais = members.map(membro => {
    const membroDetalhe = supervisorData.sdrsDetalhes.find(sdr => sdr.id === membro.usuario_id);
    console.log('👤 Membro Debug:', {
      membroId: membro.usuario_id,
      membroDetalhe: membroDetalhe,
      percentual: membroDetalhe?.percentualAtingimento || 0
    });
    return membroDetalhe?.percentualAtingimento || 0;
  });

  const mediaPercentual = percentuais.length > 0 
    ? percentuais.reduce((sum, p) => sum + p, 0) / percentuais.length 
    : 0;

  console.log('📊 Cálculo final:', {
    percentuais,
    mediaPercentual,
    regrasComissionamento
  });

  // Calcular comissão do supervisor baseado na média
  let comissaoSupervisor = 0;
  
  // Encontrar a regra de comissionamento apropriada
  const regraAplicavel = regrasComissionamento.find(regra => 
    mediaPercentual >= regra.percentual_minimo && mediaPercentual <= regra.percentual_maximo
  );
  
  console.log('🎯 Regra aplicável:', {
    mediaPercentual,
    regraAplicavel,
    todasRegras: regrasComissionamento
  });
  
  if (regraAplicavel && mediaPercentual > 0) {
    const percentualNormalizado = mediaPercentual / 100;
    
    // Buscar o fixo mensal do supervisor (assumindo valor base para cálculo)
    // Por enquanto vou usar um valor fixo, mas idealmente deveria vir do perfil do supervisor
    const valorBase = 1000; // Este valor deveria vir do perfil/nível do supervisor
    comissaoSupervisor = valorBase * percentualNormalizado * regraAplicavel.multiplicador;
    
    console.log('💰 Cálculo da comissão:', {
      valorBase,
      percentualNormalizado,
      multiplicador: regraAplicavel.multiplicador,
      comissaoFinal: comissaoSupervisor
    });
  }

  return (
    <div className="text-center">
      <div className="font-semibold">{mediaPercentual.toFixed(1)}%</div>
      <div className="text-xs text-muted-foreground">
        {regraAplicavel ? (
          <span>
            1000 x {(mediaPercentual / 100).toFixed(2)} x {regraAplicavel.multiplicador} = R$ {comissaoSupervisor.toFixed(0)}
          </span>
        ) : (
          <span>R$ 0</span>
        )}
      </div>
    </div>
  );
};