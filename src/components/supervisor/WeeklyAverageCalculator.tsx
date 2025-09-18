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
  console.log('🚀 WeeklyAverageCalculator iniciado:', { 
    supervisorId, 
    year, 
    week, 
    membersCount: members.length,
    members: members.map(m => ({ id: m.id, usuario_id: m.usuario_id, user_type: m.usuario?.user_type }))
  });
  
  const { data: supervisorData, isLoading, error } = useSupervisorComissionamento(supervisorId, year, month, week);

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

  // Buscar variável semanal do supervisor
  const { data: nivelSupervisorData } = useQuery({
    queryKey: ['nivel-supervisor', supervisorId],
    queryFn: async () => {
      const { data: supervisorProfile } = await supabase
        .from('profiles')
        .select('nivel')
        .eq('id', supervisorId)
        .maybeSingle();
        
      if (!supervisorProfile?.nivel) return null;
      
      const { data: nivelData } = await supabase
        .from('niveis_vendedores')
        .select('variavel_semanal')
        .eq('nivel', supervisorProfile.nivel)
        .eq('tipo_usuario', 'supervisor')
        .maybeSingle();
        
      return nivelData;
    },
    enabled: !!supervisorId
  });

  // Calcular comissão do supervisor baseado na média
  let comissaoSupervisor = 0;
  let regraAplicavel = null;
  
  // Encontrar a regra de comissionamento apropriada
  if (regrasComissionamento && regrasComissionamento.length > 0) {
    regraAplicavel = regrasComissionamento.find(regra => 
      mediaPercentual >= regra.percentual_minimo && mediaPercentual <= regra.percentual_maximo
    );
  }
  
  console.log('🎯 Regra aplicável:', {
    mediaPercentual,
    regraAplicavel,
    todasRegras: regrasComissionamento,
    variavel_semanal: nivelSupervisorData?.variavel_semanal
  });
  
  // Só calcular comissão se houver regra aplicável E se o multiplicador for > 0
  if (regraAplicavel && regraAplicavel.multiplicador > 0 && nivelSupervisorData?.variavel_semanal) {
    comissaoSupervisor = nivelSupervisorData.variavel_semanal * regraAplicavel.multiplicador;
    
    console.log('💰 Cálculo da comissão:', {
      variavel_semanal: nivelSupervisorData.variavel_semanal,
      multiplicador: regraAplicavel.multiplicador,
      comissaoFinal: comissaoSupervisor
    });
  } else {
    console.log('❌ Sem comissão:', {
      temRegra: !!regraAplicavel,
      multiplicador: regraAplicavel?.multiplicador || 0,
      temVariavel: !!nivelSupervisorData?.variavel_semanal,
      mediaPercentual
    });
  }

  return (
    <div className="text-center">
      <div className="font-semibold">{mediaPercentual.toFixed(1)}%</div>
      <div className="text-xs text-muted-foreground">
        {regraAplicavel && comissaoSupervisor > 0 ? (
          <span>
            R$ {nivelSupervisorData?.variavel_semanal || 0} x {regraAplicavel.multiplicador} = R$ {comissaoSupervisor.toFixed(0)}
          </span>
        ) : (
          <span>R$ 0</span>
        )}
      </div>
    </div>
  );
};