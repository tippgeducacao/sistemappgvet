import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SupervisorComissionamentoService, type SupervisorComissionamentoData } from '@/services/supervisor/SupervisorComissionamentoService';

interface SupervisorMetaColetivaProps {
  supervisorId: string;
  supervisorName: string;
  selectedMonth: string;
  getWeeksOfMonth: (year: number, month: number) => any[];
}

const SupervisorMetaColetiva: React.FC<SupervisorMetaColetivaProps> = ({
  supervisorId,
  supervisorName,
  selectedMonth,
  getWeeksOfMonth
}) => {
  const [weeklyData, setWeeklyData] = useState<SupervisorComissionamentoData[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = parseInt(selectedMonth.split('-')[0]);
  const currentMonth = parseInt(selectedMonth.split('-')[1]);
  const weeks = getWeeksOfMonth(currentYear, currentMonth);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentMonthName = monthNames[currentMonth - 1];

  useEffect(() => {
    const fetchWeeklyData = async () => {
      setLoading(true);
      const data: SupervisorComissionamentoData[] = [];

      for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
        const weekNumber = weekIndex + 1;
        
        try {
          const comissionamentoData = await SupervisorComissionamentoService.calcularComissionamentoSupervisor(
            supervisorId,
            currentYear,
            currentMonth,
            weekNumber
          );

          if (comissionamentoData) {
            data.push(comissionamentoData);
          }
        } catch (error) {
          console.error(`Erro ao buscar dados da semana ${weekNumber}:`, error);
        }
      }

      setWeeklyData(data);
      setLoading(false);
    };

    if (supervisorId && weeks.length > 0) {
      fetchWeeklyData();
    }
  }, [supervisorId, currentYear, currentMonth, weeks.length]);

  // Calcular taxa de atingimento média por semana (baseado na média dos membros)
  const taxasAtingimentoMediasPorSemana = weeks.map((week, index) => {
    const data = weeklyData[index];
    return data?.mediaPercentualAtingimento || 0;
  });

  // Obter lista única de todos os membros da equipe
  const todosMembros = weeklyData.reduce((membros, semanaData) => {
    semanaData.sdrsDetalhes?.forEach(sdr => {
      if (!membros.find(m => m.id === sdr.id)) {
        membros.push({
          id: sdr.id,
          nome: sdr.nome
        });
      }
    });
    return membros;
  }, [] as Array<{id: string, nome: string}>);

  if (loading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Meta coletiva - Supervisor {supervisorName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-xl">Meta coletiva - Supervisor {supervisorName}</CardTitle>
        <div className="text-base text-muted-foreground">
          Desempenho semanal dos membros da sua equipe - {currentMonth}/{currentYear}
        </div>
        <div className="text-sm text-muted-foreground">
          Acompanhe o desempenho de cada membro por semana
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-3 text-left font-semibold border-r">Membro</th>
                <th className="p-3 text-left font-semibold border-r">Nível</th>
                <th className="p-3 text-left font-semibold border-r">Meta Semanal</th>
                {weeks.map((week, index) => (
                  <th key={week.week} className="p-3 text-center font-semibold border-r min-w-[120px]">
                    <div className="flex flex-col">
                      <span className={index === 3 ? 'text-primary font-bold' : ''}>
                        Semana {week.week}
                      </span>
                      <span className="text-xs opacity-70 font-normal">
                        {week.label}
                      </span>
                      {index === 3 && (
                        <Badge variant="secondary" className="text-xs mt-1 bg-primary/20 text-primary">
                          ATUAL
                        </Badge>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todosMembros.map((membro, membroIndex) => {
                // Buscar dados deste membro em cada semana
                const dadosMembroPorSemana = weeks.map((_, weekIndex) => {
                  const semanaData = weeklyData[weekIndex];
                  return semanaData?.sdrsDetalhes?.find(sdr => sdr.id === membro.id);
                });

                // Pegar dados da primeira semana para informações base
                const primeirosDados = dadosMembroPorSemana.find(d => d);
                const metaSemanal = primeirosDados?.metaSemanal || 0;

                return (
                  <tr key={membro.id} className={membroIndex % 2 === 0 ? "bg-background/50" : "bg-muted/10"}>
                    <td className="p-3 border-r">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {membro.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{membro.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {/* Determinar tipo baseado na meta */}
                            {metaSemanal >= 50 ? 'SDR' : 'Vendedor'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 border-r text-center">
                      {metaSemanal >= 50 ? 'senior' : 'junior'}
                    </td>
                    <td className="p-3 border-r text-center font-semibold">
                      {metaSemanal}
                    </td>
                    {dadosMembroPorSemana.map((dados, weekIndex) => {
                      const isCurrentWeek = weekIndex === 3;

                      // Se não há dados para este membro nesta semana, significa que não estava no grupo
                      if (!dados) {
                        return (
                          <td key={weekIndex} className={`p-3 text-center border-r bg-muted/20 ${isCurrentWeek ? 'bg-primary/5' : ''}`}>
                            <div className="italic text-muted-foreground/70 text-sm">
                              Fora do grupo
                            </div>
                          </td>
                        );
                      }

                      const reunioesRealizadas = dados.reunioesRealizadas || 0;
                      const percentual = dados.percentualAtingimento || 0;

                      return (
                        <td key={weekIndex} className={`p-3 text-center border-r ${isCurrentWeek ? 'bg-primary/10' : ''}`}>
                          <div className={`font-medium ${isCurrentWeek ? 'text-primary font-bold' : ''}`}>
                            {Number(reunioesRealizadas).toFixed(2)}/{metaSemanal} ({percentual.toFixed(1)}%)
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-muted/30 border-t-2">
              <tr>
                <td colSpan={3} className="p-3 font-bold text-lg">
                  Taxa de Atingimento Média
                </td>
                {taxasAtingimentoMediasPorSemana.map((taxa, weekIndex) => {
                  const isCurrentWeek = weekIndex === 3;
                  return (
                    <td key={weekIndex} className={`p-3 text-center font-bold text-lg ${isCurrentWeek ? 'bg-primary/20 text-primary' : ''}`}>
                      {taxa.toFixed(1)}%
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Legenda explicativa */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
          <div className="font-semibold mb-2">Legenda:</div>
          <div className="flex flex-wrap gap-4">
            <div><span className="italic">Fora do grupo:</span> O membro não estava no grupo do supervisor nesta semana</div>
            <div>A média semanal é calculada apenas considerando os membros ativos em cada semana</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupervisorMetaColetiva;