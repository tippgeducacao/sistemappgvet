import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ComissionamentoService } from '@/services/comissionamentoService';

// Regras de comissionamento SDR fixas para performance
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
  const regra = REGRAS_COMISSIONAMENTO_SDR.find(r => 
    percentual >= r.percentual_minimo && percentual <= r.percentual_maximo
  );
  return regra?.multiplicador || 0;
};

interface SDRTableRowProps {
  sdr: any;
  index: number;
  weeks: any[];
  agendamentos?: any[];
  niveis: any[];
}

const SDRTableRow: React.FC<SDRTableRowProps> = ({
  sdr,
  index,
  weeks,
  agendamentos,
  niveis
}) => {
  const [totalSDRCommission, setTotalSDRCommission] = useState(0);
  const [weeklySDRCommissions, setWeeklySDRCommissions] = useState<number[]>([]);

  const sdrTipoUsuario = sdr.user_type;
  
  console.log('🔍 SDR Row - Dados do SDR:', { nivel: sdr.nivel, userType: sdr.user_type });
  
  // Buscar configuração do nível diretamente usando apenas o nível básico
  const nivelConfig = niveis.find(n => n.tipo_usuario === 'sdr' && n.nivel === sdr.nivel);
  
  console.log('📊 SDR Row - Configuração do nível encontrada:', nivelConfig);
  
  const metaSemanal = nivelConfig?.meta_semanal_outbound ?? 30;
  
  const metaMensal = metaSemanal * weeks.length;
  const variavelSemanal = Number(nivelConfig?.variavel_semanal || 0);
  
  // Calcular reuniões por semana
  const reunioesPorSemana = weeks.map(week => {
    const startDate = new Date(week.startDate);
    const endDate = new Date(week.endDate);
    
    const reunioesNaSemana = agendamentos?.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.data_agendamento);
      const isDoSDR = agendamento.sdr_id === sdr.id;
      const dentroDaSemana = dataAgendamento >= startDate && dataAgendamento <= endDate;
      const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                         agendamento.resultado_reuniao === 'comprou';
      return isDoSDR && dentroDaSemana && compareceu;
    }).length || 0;
    
    return reunioesNaSemana;
  });
  
  const totalReunioes = reunioesPorSemana.reduce((sum, reunioes) => sum + reunioes, 0);
  const achievementPercentage = metaMensal > 0 ? (totalReunioes / metaMensal) * 100 : 0;
  
  useEffect(() => {
    const calculateSDRCommissions = async () => {
      const commissions = await Promise.all(
        reunioesPorSemana.map(reunioes => 
          ComissionamentoService.calcularComissao(reunioes, metaSemanal, variavelSemanal, 'sdr')
        )
      );
      
      const total = commissions.reduce((sum, c) => sum + c.valor, 0);
      setTotalSDRCommission(total);
      setWeeklySDRCommissions(commissions.map(c => c.valor));
    };
    
    if (reunioesPorSemana.length > 0) {
      calculateSDRCommissions();
    }
  }, [reunioesPorSemana, metaSemanal, variavelSemanal]);

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
      <td className="p-2">{sdr.nivel || 'junior'}</td>
      <td className="p-2">{metaSemanal}</td>
      <td className="p-2">R$ {variavelSemanal.toFixed(2)}</td>
      {reunioesPorSemana.map((reunioes, weekIndex) => {
        const percentage = metaSemanal > 0 ? ((reunioes / metaSemanal) * 100).toFixed(1) : "0.0";
        const weeklyCommission = weeklySDRCommissions[weekIndex] || 0;
        
        // Calcular o multiplicador correto baseado na porcentagem atingida
        const percentualAtingido = metaSemanal > 0 ? (reunioes / metaSemanal) * 100 : 0;
        const multiplicador = getMultiplicadorSDR(percentualAtingido);
        
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
};

export default SDRTableRow;