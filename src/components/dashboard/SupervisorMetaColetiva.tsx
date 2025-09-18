import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SupervisorComissionamentoService, type SupervisorComissionamentoData } from '@/services/supervisor/SupervisorComissionamentoService';
import SupervisorDebugInfo from './SupervisorDebugInfo';

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

  // Função para detectar qual semana é realmente a atual
  const getCurrentWeekIndex = () => {
    const today = new Date();
    
    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      const startDate = new Date(week.startDate);
      const endDate = new Date(week.endDate);
      
      // Ajustar para fim do dia (23:59:59)
      endDate.setHours(23, 59, 59, 999);
      
      // Verificar se hoje está dentro desta semana
      if (today >= startDate && today <= endDate) {
        return i;
      }
    }
    
    // Se não encontrar, retorna -1 (nenhuma semana atual neste mês)
    return -1;
  };

  const currentWeekIndex = getCurrentWeekIndex();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentMonthName = monthNames[currentMonth - 1];

  useEffect(() => {
    const fetchWeeklyData = async () => {
      setLoading(true);
      const data: SupervisorComissionamentoData[] = [];

      console.log('🔍 SupervisorMetaColetiva - Iniciando busca de dados semanais para:', {
        supervisorId,
        supervisorName,
        currentYear,
        currentMonth,
        totalWeeks: weeks.length
      });

      for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
        const weekNumber = weekIndex + 1;
        
        console.log(`📅 SupervisorMetaColetiva - Buscando SEMANA ${weekNumber}:`, {
          week: weeks[weekIndex],
          supervisorId,
          currentYear,
          currentMonth
        });
        
        try {
          const comissionamentoData = await SupervisorComissionamentoService.calcularComissionamentoSupervisor(
            supervisorId,
            currentYear,
            currentMonth,
            weekNumber
          );

          console.log(`📊 SupervisorMetaColetiva - SEMANA ${weekNumber} resultado:`, {
            temDados: !!comissionamentoData,
            totalMembros: comissionamentoData?.sdrsDetalhes?.length || 0,
            membros: comissionamentoData?.sdrsDetalhes?.map(sdr => ({
              nome: sdr.nome,
              id: sdr.id,
              reunioes: sdr.reunioesRealizadas,
              meta: sdr.metaSemanal,
              percentual: sdr.percentualAtingimento
            })) || []
          });

          if (comissionamentoData) {
            data.push(comissionamentoData);
          } else {
            console.log(`⚠️ SupervisorMetaColetiva - SEMANA ${weekNumber}: Sem dados (supervisor sem equipe)`);
            // Adicionar um objeto vazio para manter o índice da semana
            data.push({
              supervisorId,
              nome: supervisorName,
              grupoId: '',
              nomeGrupo: '',
              ano: currentYear,
              semana: weekNumber,
              totalSDRs: 0,
              mediaPercentualAtingimento: 0,
              variabelSemanal: 0,
              multiplicador: 0,
              valorComissao: 0,
              sdrsDetalhes: []
            });
          }
        } catch (error) {
          console.error(`❌ SupervisorMetaColetiva - Erro ao buscar dados da semana ${weekNumber}:`, error);
          // Adicionar um objeto vazio para manter o índice da semana
          data.push({
            supervisorId,
            nome: supervisorName,
            grupoId: '',
            nomeGrupo: '',
            ano: currentYear,
            semana: weekNumber,
            totalSDRs: 0,
            mediaPercentualAtingimento: 0,
            variabelSemanal: 0,
            multiplicador: 0,
            valorComissao: 0,
            sdrsDetalhes: []
          });
        }
      }

      console.log('📋 SupervisorMetaColetiva - Dados semanais completos:', {
        totalSemanas: data.length,
        resumo: data.map((d, i) => ({
          semana: i + 1,
          temMembros: d.sdrsDetalhes?.length > 0,
          membros: d.sdrsDetalhes?.length || 0
        }))
      });

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

  console.log('📊 SupervisorMetaColetiva - Membros únicos encontrados:', {
    totalMembrosUnicos: todosMembros.length,
    nomes: todosMembros.map(m => m.nome)
  });

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
    <>
      {/* Componente de Debug */}
      <SupervisorDebugInfo
        supervisorId={supervisorId}
        supervisorName={supervisorName}
        selectedMonth={selectedMonth}
        getWeeksOfMonth={getWeeksOfMonth}
      />
      
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
                {weeks.map((week, index) => {
                  const isCurrentWeek = index === currentWeekIndex;
                  
                  return (
                    <th key={week.week} className="p-3 text-center font-semibold border-r min-w-[120px]">
                      <div className="flex flex-col">
                        <span className={isCurrentWeek ? 'text-primary font-bold' : ''}>
                          Semana {week.week}
                        </span>
                        <span className="text-xs opacity-70 font-normal">
                          {week.label}
                        </span>
                        {isCurrentWeek && (
                          <Badge variant="secondary" className="text-xs mt-1 bg-primary/20 text-primary">
                            ATUAL
                          </Badge>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {todosMembros.map((membro, membroIndex) => {
                console.log(`🔍 SupervisorMetaColetiva - Processando linha do membro: ${membro.nome}`);
                
                // Buscar dados deste membro em cada semana
                const dadosMembroPorSemana = weeks.map((_, weekIndex) => {
                  const semanaData = weeklyData[weekIndex];
                  const dadosMembro = semanaData?.sdrsDetalhes?.find(sdr => sdr.id === membro.id);
                  
                  console.log(`📅 SupervisorMetaColetiva - ${membro.nome} SEMANA ${weekIndex + 1}:`, {
                    temDados: !!dadosMembro,
                    reunioes: dadosMembro?.reunioesRealizadas || 'N/A',
                    meta: dadosMembro?.metaSemanal || 'N/A',
                    percentual: dadosMembro?.percentualAtingimento || 'N/A'
                  });
                  
                  return dadosMembro;
                });

                // Pegar dados da primeira semana para informações base
                const primeirosDados = dadosMembroPorSemana.find(d => d);
                const metaSemanal = primeirosDados?.metaSemanal || 0;

                console.log(`📊 SupervisorMetaColetiva - ${membro.nome} resumo:`, {
                  metaSemanal,
                  semanasComDados: dadosMembroPorSemana.filter(d => d).length,
                  semanasSemDados: dadosMembroPorSemana.filter(d => !d).length
                });

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
                             {/* Usar o user_type real em vez de inferir pela meta */}
                             {primeirosDados?.userType === 'vendedor' ? 'Vendedor' : 
                              primeirosDados?.userType === 'sdr_inbound' ? 'SDR Inbound' :
                              primeirosDados?.userType === 'sdr_outbound' ? 'SDR Outbound' :
                              primeirosDados?.userType === 'sdr' ? 'SDR' : 'Vendedor'}
                           </div>
                         </div>
                      </div>
                    </td>
                     <td className="p-3 border-r text-center">
                       {/* Usar o nível real do usuário */}
                       {primeirosDados?.nivel || 'junior'}
                     </td>
                    <td className="p-3 border-r text-center font-semibold">
                      {metaSemanal}
                    </td>
                     {dadosMembroPorSemana.map((dados, weekIndex) => {
                       const isCurrentWeek = weekIndex === currentWeekIndex;
                      const weekInfo = weeks[weekIndex];
                      const endDate: Date | undefined = weekInfo?.endDate ? new Date(weekInfo.endDate) : undefined;
                      const now = new Date();
                      const isFutureWeek = endDate ? endDate > now : false;

                      // Regra CORRETA: "Fora do grupo" SOMENTE quando a pessoa NÃO estava no grupo naquela semana (passada)
                      if (!dados) {
                        if (isFutureWeek) {
                          // Semana futura: mostrar progresso 0% (não marcar como fora do grupo)
                          return (
                            <td key={weekIndex} className={`p-3 text-center border-r ${isCurrentWeek ? 'bg-primary/5' : ''}`}>
                              <div className={`font-medium ${isCurrentWeek ? 'text-primary font-bold' : ''}`}>
                                0/{metaSemanal} (0.0%)
                              </div>
                            </td>
                          );
                        }
                        // Semana passada e sem dados -> fora do grupo
                        return (
                          <td key={weekIndex} className={`p-3 text-center border-r bg-muted/20 ${isCurrentWeek ? 'bg-primary/5' : ''}`}>
                            <div className="italic text-muted-foreground/70 text-sm">
                              Fora do grupo
                            </div>
                          </td>
                        );
                      }

                      // Tem dados: exibir valores
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
                  const isCurrentWeek = weekIndex === currentWeekIndex;
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
    </>
  );
};

export default SupervisorMetaColetiva;