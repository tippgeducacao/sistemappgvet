import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SupervisorComissionamentoService } from '@/services/supervisor/SupervisorComissionamentoService';
import { ComissionamentoService } from '@/services/comissionamentoService';

interface SupervisorTableRowProps {
  supervisor: any;
  index: number;
  weeks: any[];
  niveis: any[];
}

const SupervisorTableRow: React.FC<SupervisorTableRowProps> = ({
  supervisor,
  index,
  weeks,
  niveis
}) => {
  const [totalSupervisorCommission, setTotalSupervisorCommission] = useState(0);
  const [weeklyAttainments, setWeeklyAttainments] = useState<number[]>([]);
  const [weeklyCommissions, setWeeklyCommissions] = useState<number[]>([]);

  const supervisorNivel = supervisor.nivel || 'supervisor';
  const nivelConfig = niveis.find(n => n.tipo_usuario === 'supervisor' && n.nivel === supervisorNivel);
  const variavelSemanal = Number(nivelConfig?.variavel_semanal || 0);

  console.log('🔍 Supervisor Row - Dados do Supervisor:', { 
    nome: supervisor.name,
    nivel: supervisorNivel, 
    nivelConfig 
  });

  useEffect(() => {
    const fetchSupervisorData = async () => {
      console.log(`🔄 ${supervisor.name} - Buscando comissionamento por semana...`);
      
      const weeklyData = await Promise.all(
        weeks.map(async (week, weekIndex) => {
          const currentYear = new Date(week.startDate).getFullYear();
          const currentMonth = new Date(week.startDate).getMonth() + 1;
          const weekNumber = weekIndex + 1;
          
          console.log(`🗓️ ${supervisor.name} - Semana ${weekNumber}: ${week.startDate} a ${week.endDate}`);
          
          try {
            // Usar o serviço existente para calcular comissionamento do supervisor
            const comissionamentoData = await SupervisorComissionamentoService.calcularComissionamentoSupervisor(
              supervisor.id, 
              currentYear, 
              currentMonth, 
              weekNumber
            );
            
            if (comissionamentoData) {
              // Usar diretamente os dados calculados pelo serviço
              const taxaAtingimentoMedia = comissionamentoData.mediaPercentualAtingimento;
              const comissaoValor = comissionamentoData.valorComissao;
              
              console.log(`📊 ${supervisor.name} - Semana ${weekNumber}: Taxa média ${taxaAtingimentoMedia.toFixed(1)}%, Comissão R$ ${comissaoValor.toFixed(2)}`);
              
              return {
                taxaAtingimento: taxaAtingimentoMedia,
                comissao: comissaoValor
              };
            }
            
            // Se não há dados (supervisor não estava ativo), retornar null
            console.log(`📊 ${supervisor.name} - Semana ${weekNumber}: Não havia equipe ativa, retornando null`);
            return { taxaAtingimento: null, comissao: null };
            
          } catch (error) {
            console.error(`❌ ${supervisor.name} - Erro na semana ${weekNumber}:`, error);
            return { taxaAtingimento: 0, comissao: 0 };
          }
        })
      );
      
      const attainments = weeklyData.map(d => d.taxaAtingimento);
      const commissions = weeklyData.map(d => d.comissao);
      
      // Calcular total apenas das semanas com dados válidos (ignorar null/undefined)
      const total = commissions.reduce((sum, c) => sum + (c !== null && c !== undefined ? c : 0), 0);
      
      console.log(`💰 COMISSÃO DEBUG - ${supervisor.name}:`, {
        semanas: weeklyData.map((d, i) => ({
          semana: i + 1,
          taxa: d.taxaAtingimento,
          comissao: d.comissao,
          variavelSemanal: variavelSemanal
        })),
        comissionsArray: commissions,
        total,
        variavelSemanal
      });
      
      console.log(`✅ ${supervisor.name} - Resultado final:`, {
        attainments,
        commissions,
        total
      });
      
      setWeeklyAttainments(attainments);
      setWeeklyCommissions(commissions);
      setTotalSupervisorCommission(total);
    };
    
    if (supervisor.id && weeks.length > 0) {
      fetchSupervisorData();
    }
  }, [supervisor.id, weeks, variavelSemanal]);

  // Calcular atingimento médio mensal apenas das semanas com dados válidos
  const validAttainments = weeklyAttainments.filter(att => att !== null && att !== undefined);
  const monthlyAttainment = validAttainments.length > 0 
    ? validAttainments.reduce((sum, att) => sum + att, 0) / validAttainments.length 
    : 0;

  return (
    <tr key={supervisor.id} className={index % 2 === 0 ? "bg-background/50" : "bg-muted/20"}>
      <td className="p-2 font-medium">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={supervisor.photo_url} alt={supervisor.name} />
            <AvatarFallback className="text-xs">
              {supervisor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span>{supervisor.name}</span>
        </div>
      </td>
      <td className="p-2">{supervisorNivel.charAt(0).toUpperCase() + supervisorNivel.slice(1)}</td>
      <td className="p-2">Meta Coletiva</td>
      <td className="p-2">R$ {variavelSemanal.toFixed(2)}</td>
      {weeks.map((_, weekIndex) => {
        const attainment = weeklyAttainments[weekIndex];
        const weeklyCommission = weeklyCommissions[weekIndex];
        
        // Se não há dados (supervisor não estava ativo), mostrar "Fora do grupo"
        if (attainment === undefined || attainment === null || weeklyCommission === undefined || weeklyCommission === null) {
          return (
            <td key={weekIndex} className="p-2 text-xs text-muted-foreground">
              <div className="italic text-muted-foreground/70">Fora do grupo</div>
              <div className="opacity-70">-</div>
            </td>
          );
        }
        
        return (
          <td key={weekIndex} className="p-2 text-xs">
            <div>{attainment.toFixed(1)}% atingimento</div>
            <div className="opacity-70 text-green-600">R$ {weeklyCommission.toFixed(2)}</div>
          </td>
        );
      })}
      <td className="p-2 font-semibold">{monthlyAttainment.toFixed(1)}%</td>
      <td className="p-2 font-semibold text-green-600">R$ {totalSupervisorCommission.toFixed(2)}</td>
    </tr>
  );
};

// Legenda para explicar os termos usados
export const SupervisorTableLegend: React.FC = () => (
  <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
    <div className="font-semibold mb-2">Legenda:</div>
    <div className="flex flex-wrap gap-4">
      <div><span className="italic">Fora do grupo:</span> O supervisor não possuía equipe ativa nesta semana</div>
      <div>As médias são calculadas apenas considerando as semanas com equipe ativa</div>
    </div>
  </div>
);

export default SupervisorTableRow;