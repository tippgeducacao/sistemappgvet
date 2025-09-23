import React, { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBatchComissionamentoCalculation } from '@/hooks/useComissionamentoCalculation';
import { supabase } from '@/integrations/supabase/client';

// Regras de comissionamento SDR atualizadas conforme banco
const REGRAS_COMISSIONAMENTO_SDR = [
  { percentual_minimo: 0, percentual_maximo: 50, multiplicador: 0.0 },
  { percentual_minimo: 51, percentual_maximo: 70, multiplicador: 0.0 },
  { percentual_minimo: 71, percentual_maximo: 84, multiplicador: 0.5 },
  { percentual_minimo: 85, percentual_maximo: 99, multiplicador: 0.7 },
  { percentual_minimo: 100, percentual_maximo: 119, multiplicador: 1.0 },
  { percentual_minimo: 120, percentual_maximo: 150, multiplicador: 1.2 },
  { percentual_minimo: 151, percentual_maximo: 200, multiplicador: 1.8 },
  { percentual_minimo: 201, percentual_maximo: 999, multiplicador: 2.0 }
];

const getMultiplicadorSDR = (percentual: number): number => {
  console.log('📋 SDR MULTIPLICADOR:', { percentual });
  
  // LÓGICA CORRIGIDA: encontrar a regra correta  
  let regra = null;
  
  for (const r of REGRAS_COMISSIONAMENTO_SDR) {
    // Para percentuais >= 999 (muito altos) - verificar primeiro
    if (r.percentual_maximo >= 999 && percentual >= r.percentual_minimo) {
      regra = r;
      break;
    }
    // Para outros percentuais, usar >= minimo e <= maximo (CORRIGIDO)
    else if (percentual >= r.percentual_minimo && percentual <= r.percentual_maximo) {
      regra = r;
      break;
    }
  }
  
  console.log('✅ SDR REGRA:', { percentual, regra: regra ? `${regra.percentual_minimo}-${regra.percentual_maximo}: ${regra.multiplicador}x` : 'NENHUMA' });
  return regra?.multiplicador || 0;
};

interface SDRTableRowProps {
  sdr: any;
  index: number;
  weeks: any[];
  agendamentos?: any[];
  niveis: any[];
}

const SDRTableRow: React.FC<SDRTableRowProps> = React.memo(({
  sdr,
  index,
  weeks,
  agendamentos,
  niveis
}) => {
  const [reunioesPorSemana, setReunioesPorSemana] = useState<number[]>([]);

  const sdrTipoUsuario = sdr.user_type;
  
  console.log('🔍 SDR Row - Dados do SDR:', { nivel: sdr.nivel, userType: sdr.user_type });
  
  // Buscar configuração do nível diretamente usando apenas o nível básico
  const nivelConfig = useMemo(() => 
    niveis.find(n => n.tipo_usuario === 'sdr' && n.nivel === sdr.nivel),
    [niveis, sdr.nivel]
  );
  
  console.log('📊 SDR Row - Configuração do nível encontrada:', nivelConfig);
  
  const metaSemanal = nivelConfig?.meta_semanal_inbound ?? 55;
  const metaMensal = useMemo(() => metaSemanal * weeks.length, [metaSemanal, weeks.length]);
  const variavelSemanal = Number(nivelConfig?.variavel_semanal || 0);

  // NOVA LÓGICA - Baseada exatamente no SDRMetasSemanais (que está correto)
  useEffect(() => {
    const fetchAgendamentosPorSemana = async () => {
      console.log(`🔄 ${sdr.name} - Buscando agendamentos por semana...`);
      
      const reunioesSemanas = await Promise.all(
        weeks.map(async (week, weekIndex) => {
          const startOfWeek = new Date(week.startDate);
          const endOfWeek = new Date(week.endDate);
          
          // Ajustar horários para início e fim do dia
          const startDateFormatted = new Date(startOfWeek);
          startDateFormatted.setHours(0, 0, 0, 0);
          
          const endDateFormatted = new Date(endOfWeek);
          endDateFormatted.setHours(23, 59, 59, 999);
          
          console.log(`🗓️ ${sdr.name} - Semana ${weekIndex + 1}: ${startOfWeek.toLocaleDateString()} a ${endOfWeek.toLocaleDateString()}`);
          console.log(`🔍 ${sdr.name} - Query exata:`, {
            sdr_id: sdr.id,
            data_inicio: startDateFormatted.toISOString(),
            data_fim: endDateFormatted.toISOString()
          });
          
          try {
            // Buscar agendamentos usando EXATAMENTE a mesma query do SDRMetasSemanais
            const { data: agendamentosSemana, error } = await supabase
              .from('agendamentos')
              .select('*')
              .eq('sdr_id', sdr.id)
              .gte('data_agendamento', startDateFormatted.toISOString())
              .lte('data_agendamento', endDateFormatted.toISOString())
              .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou']);

            if (error) {
              console.error(`❌ ${sdr.name} - Erro na consulta semana ${weekIndex + 1}:`, error);
              return 0;
            }

            const totalNaSemana = agendamentosSemana?.length || 0;
            
            console.log(`📊 ${sdr.name} - Semana ${weekIndex + 1}: ${totalNaSemana} reuniões encontradas`);
            console.log(`📋 ${sdr.name} - Detalhes:`, agendamentosSemana?.map(a => ({
              id: a.id,
              data_agendamento: a.data_agendamento,
              resultado: a.resultado_reuniao
            })));
            
            return totalNaSemana;
          } catch (error) {
            console.error(`❌ ${sdr.name} - Erro ao buscar semana ${weekIndex + 1}:`, error);
            return 0;
          }
        })
      );
      
      console.log(`✅ ${sdr.name} - Resultado final por semana:`, reunioesSemanas);
      setReunioesPorSemana(reunioesSemanas);
    };
    
    if (sdr.id && weeks.length > 0) {
      fetchAgendamentosPorSemana();
    }
  }, [sdr.id, weeks]);
  
  // Calcular totais com memoização
  const { totalReunioes, achievementPercentage } = useMemo(() => {
    const total = reunioesPorSemana.reduce((sum, reunioes) => sum + reunioes, 0);
    const percentage = metaMensal > 0 ? (total / metaMensal) * 100 : 0;
    
    return {
      totalReunioes: total,
      achievementPercentage: percentage
    };
  }, [reunioesPorSemana, metaMensal]);
  
  console.log(`🎯 NOVA LÓGICA - ${sdr.name} - RESUMO: ${totalReunioes} reuniões total, ${achievementPercentage.toFixed(1)}% da meta`);
  
  // Usar hook otimizado para cálculos de comissão semanal em batch
  const calculosComissao = weeks.map((_, weekIndex) => ({
    pontosObtidos: reunioesPorSemana[weekIndex] || 0,
    metaSemanal,
    variavelSemanal,
    tipoUsuario: 'sdr' as const,
    enabled: reunioesPorSemana.length > 0
  }));
  
  // Hook para múltiplos cálculos otimizados
  const { data: commissionsData, loading: commissionsLoading } = useBatchComissionamentoCalculation(
    calculosComissao,
    reunioesPorSemana.length > 0
  );
  
  // Calcular total de comissões com memoização
  const { totalSDRCommission, weeklySDRCommissions } = useMemo(() => {
    if (!commissionsData || commissionsData.length === 0) {
      return { totalSDRCommission: 0, weeklySDRCommissions: [] };
    }
    
    const weeklyValues = commissionsData.map(c => c?.valor || 0);
    const total = weeklyValues.reduce((sum, value) => sum + value, 0);
    
    return {
      totalSDRCommission: total,
      weeklySDRCommissions: weeklyValues
    };
  }, [commissionsData]);

  return (
    <tr key={sdr.id} className={index % 2 === 0 ? "bg-background/50" : "bg-muted/20"}>
      <td className="p-2 font-medium">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={sdr.photo_url} alt={sdr.name} />
            <AvatarFallback className="text-xs">
              {sdr.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span>{sdr.name}</span>
        </div>
      </td>
      <td className="p-2">SDR</td>
      <td className="p-2">{sdr.nivel?.charAt(0).toUpperCase() + sdr.nivel?.slice(1) || 'Junior'}</td>
      <td className="p-2">{metaSemanal}</td>
      <td className="p-2">R$ {variavelSemanal.toFixed(2)}</td>
      {reunioesPorSemana.map((reunioes, weekIndex) => {
        const percentage = metaSemanal > 0 ? ((reunioes / metaSemanal) * 100).toFixed(1) : "0.0";
        
        // Calcular o multiplicador correto baseado na porcentagem atingida
        const percentualAtingido = metaSemanal > 0 ? (reunioes / metaSemanal) * 100 : 0;
        const multiplicador = getMultiplicadorSDR(percentualAtingido);
        const weeklyCommission = weeklySDRCommissions[weekIndex] || 0;
        
        return (
          <td key={weekIndex} className="p-2 text-xs">
            <div>{reunioes} reuniões ({percentage}%) x {multiplicador.toFixed(1)}</div>
            <div className="opacity-70 text-green-600">R$ {weeklyCommission.toFixed(2)}</div>
          </td>
        );
      })}
      <td className="p-2 font-semibold">{totalReunioes}</td>
      <td className="p-2 font-semibold">{achievementPercentage.toFixed(1)}%</td>
      <td className="p-2 font-semibold text-green-600">R$ {totalSDRCommission.toFixed(2)}</td>
    </tr>
  );
});

SDRTableRow.displayName = 'SDRTableRow';

export default SDRTableRow;