import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Clock } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useAuthStore } from '@/stores/AuthStore';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useSupervisorComissionamentoBatch } from '@/hooks/useSupervisorComissionamentoBatch';
import UserProfileModal from '@/components/UserProfileModal';
import VendedorProfileModal from '@/components/dashboard/VendedorProfileModal';
import SDRProfileModal from '@/components/dashboard/SDRProfileModal';
import { getWeekRange, getMesAnoSemanaAtual } from '@/utils/semanaUtils';


const SupervisorDashboardAtualizado: React.FC = () => {
  const { user } = useAuthStore();
  const { grupos, loading } = useGruposSupervisores();
  
  // Estado para seleção de mês/ano - usando lógica de semanas
  const { mes: initialMes, ano: initialAno } = getMesAnoSemanaAtual();
  const [selectedYear, setSelectedYear] = useState(initialAno);
  const [selectedMonth, setSelectedMonth] = useState(initialMes);
  
  console.log('🔍 SupervisorDashboard - Estado inicial:', { 
    initialMes, 
    initialAno, 
    selectedYear, 
    selectedMonth 
  });
  
  // Estado para modais de perfil
  const [selectedUserProfile, setSelectedUserProfile] = useState<{
    id: string;
    name: string;
    photo_url?: string;
    user_type: string;
    nivel?: string;
  } | null>(null);
  
  // Hooks para metas semanais - armazenar as funções de forma estável
  const metasHook = useMetasSemanais();
  const getSemanasDoMes = metasHook.getSemanasDoMes;
  const getSemanaAtual = metasHook.getSemanaAtual;
  
  // Verificar se as funções estão disponíveis
  const isMetasFunctionsReady = Boolean(getSemanasDoMes && getSemanaAtual);
  
  console.log('🔍 SupervisorDashboard - Funções de metas:', { 
    getSemanasDoMes: typeof getSemanasDoMes,
    getSemanaAtual: typeof getSemanaAtual,
    isMetasFunctionsReady 
  });
  
  // Gerar opções de anos (últimos 3 anos + próximos 2)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 3; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  }, []);

  // Gerar opções de meses
  const monthOptions = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  // Função para calcular datas das semanas que TERMINAM no mês (quarta a terça)
  const getWeekDates = (year: number, month: number, week: number) => {
    // Encontrar todas as terças-feiras que estão no mês
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);
    
    const tuesdays = [];
    let currentDate = new Date(firstDayOfMonth);
    
    // Encontrar primeira terça-feira do mês ou anterior que termine no mês
    while (currentDate.getDay() !== 2) { // 2 = terça-feira
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Se a primeira terça é muito tarde, verificar se há uma anterior que termine no mês
    if (currentDate.getDate() > 7) {
      const previousTuesday = new Date(currentDate);
      previousTuesday.setDate(currentDate.getDate() - 7);
      if (previousTuesday.getMonth() === month - 1) {
        tuesdays.push(new Date(previousTuesday));
      }
    }
    
    // Adicionar todas as terças-feiras do mês
    while (currentDate.getMonth() === month - 1) {
      tuesdays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    // Pegar a terça-feira da semana solicitada
    if (week <= tuesdays.length) {
      const endWeek = tuesdays[week - 1];
      const startWeek = new Date(endWeek);
      startWeek.setDate(endWeek.getDate() - 6); // Voltar 6 dias para quarta-feira
      
      return {
        start: startWeek,
        end: endWeek
      };
    }
    
    // Fallback se a semana não existir
    return {
      start: new Date(),
      end: new Date()
    };
  };

  // Semanas do mês atual - usar callback estável
  const semanasDoMes = useMemo(() => {
    console.log('🔍 useMemo semanasDoMes executando:', { 
      isMetasFunctionsReady, 
      selectedYear, 
      selectedMonth
    });
    
    if (!isMetasFunctionsReady) {
      console.log('⚠️ Retornando array vazio - funções não estão prontas');
      return [];
    }
    
    try {
      const result = getSemanasDoMes(selectedYear, selectedMonth);
      console.log('✅ semanasDoMes resultado:', result);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('❌ Erro ao obter semanas do mês:', error);
      return [];
    }
  }, [selectedYear, selectedMonth, isMetasFunctionsReady]);
  
  const semanaAtual = useMemo(() => {
    console.log('🔍 useMemo semanaAtual executando:', { 
      isMetasFunctionsReady, 
      selectedYear, 
      selectedMonth
    });
    
    if (!isMetasFunctionsReady) {
      console.log('⚠️ Retornando semana 1 - funções não estão prontas');
      return 1;
    }
    
    try {
      const { mes: currentMes, ano: currentAno } = getMesAnoSemanaAtual();
      if (currentAno === selectedYear && currentMes === selectedMonth) {
        const result = getSemanaAtual();
        console.log('✅ semanaAtual resultado:', result);
        return typeof result === 'number' ? result : 1;
      }
      return 1; // Padrão para meses diferentes
    } catch (error) {
      console.error('❌ Erro ao obter semana atual:', error);
      return 1;
    }
  }, [selectedYear, selectedMonth, isMetasFunctionsReady]);
  
  // Remover selectedWeek - não precisamos mais

  // Encontrar o grupo do supervisor logado
  const meuGrupo = useMemo(() => {
    console.log('🔍 DEBUG meuGrupo:', { 
      userId: user?.id, 
      gruposCount: grupos?.length,
      grupos: grupos?.map(g => ({ id: g.id, supervisor_id: g.supervisor_id, nome: g.nome_grupo })) || []
    });
    
    if (!user || !grupos || grupos.length === 0) {
      console.log('⚠️ User ou grupos não disponíveis:', { user: !!user, grupos: !!grupos, gruposLength: grupos?.length });
      return null;
    }
    
    const grupo = grupos.find(grupo => grupo.supervisor_id === user.id);
    console.log('🎯 Grupo encontrado:', grupo ? { id: grupo.id, nome: grupo.nome_grupo, membros: grupo.membros?.length } : 'Nenhum grupo');
    
    return grupo;
  }, [user, grupos]);

  // Usar hook otimizado com batch processing
  const semanas = semanasDoMes || [];
  const { 
    data: weeklyData = [], 
    isLoading: supervisorLoading 
  } = useSupervisorComissionamentoBatch(
    user?.id || '', 
    selectedYear, 
    selectedMonth, 
    semanas
  );

  // Dados da semana atual para o card de resumo
  const supervisorData = weeklyData.find(data => data.semana === semanaAtual);

  // Log para debug
  console.log('🔍 Dashboard params:', {
    supervisorId: user?.id,
    selectedYear,
    selectedMonth,
    semanaAtual,
    supervisorData
  });

  // Memoizar cálculos dos cards baseados na planilha detalhada
  const percentualGeral = useMemo(() => {
    if (!supervisorData) return 0;
    return supervisorData.mediaPercentualAtingimento || 0;
  }, [supervisorData]);

  if (loading || supervisorLoading || !isMetasFunctionsReady) {
    console.log('⏳ Estado de carregamento:', { loading, supervisorLoading, isMetasFunctionsReady });
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  if (!user) {
    console.log('❌ Usuário não encontrado');
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Usuário não encontrado</p>
      </div>
    );
  }

  if (!grupos || grupos.length === 0) {
    console.log('❌ Nenhum grupo disponível');
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Nenhum grupo disponível no sistema</p>
      </div>
    );
  }

  if (!meuGrupo) {
    console.log('❌ Supervisor não tem grupo atribuído');
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Você não está associado a nenhum grupo</p>
        <p className="text-sm text-muted-foreground mt-2">Entre em contato com o administrador</p>
      </div>
    );
  }

  if (!meuGrupo.membros || meuGrupo.membros.length === 0) {
    console.log('❌ Grupo sem membros');
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Seu grupo ainda não tem membros cadastrados</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Principal */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard - Time de Vendas</h1>
            <p className="text-muted-foreground mt-1">Acompanhe o desempenho da sua equipe</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Seletor de Período */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-foreground">META COLETIVA</h2>
            <div className="flex items-center gap-2">
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(value) => {
                console.log('🔄 Mudando mês de', selectedMonth, 'para', value);
                setSelectedMonth(parseInt(value));
              }}
            >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => {
                console.log('🔄 Mudando ano de', selectedYear, 'para', value);
                setSelectedYear(parseInt(value));
              }}
            >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>


        {/* Cards de Métricas */}
        <div className="flex justify-center">
          {/* Taxa de Atingimento da Semana */}
          <Card className="w-full max-w-md">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">TAXA DE ATINGIMENTO DA SEMANA</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-foreground">
                  {percentualGeral.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">média do grupo</p>
                <Progress value={Math.min(percentualGeral, 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meta Coletiva */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-foreground">
              Desempenho semanal dos membros da sua equipe - {selectedMonth}/{selectedYear}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Acompanhe o desempenho de cada membro por semana
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-foreground">Membro</th>
                    <th className="text-left py-3 px-2 font-semibold text-foreground">Nível</th>
                    <th className="text-left py-3 px-2 font-semibold text-foreground">Meta Semanal</th>
                     {(semanasDoMes || []).map((semana) => {
                       const { start, end } = getWeekDates(selectedYear, selectedMonth, semana);
                       const startFormatted = start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                       const endFormatted = end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                       
                       // Verificar se é a semana atual usando a lógica correta
                       const today = new Date();
                       const { start: currentWeekStart, end: currentWeekEnd } = getWeekRange(today);
                       const { mes: currentMes, ano: currentAno } = getMesAnoSemanaAtual();
                       
                       // É semana atual se as datas se sobrepõem E estamos no mesmo mês/ano
                       const isCurrentWeek = (currentAno === selectedYear && currentMes === selectedMonth) &&
                         (start <= currentWeekEnd && end >= currentWeekStart);
                       
                       return (
                         <th key={semana} className={`text-center py-3 px-4 font-semibold border-l border-border ${isCurrentWeek ? 'bg-primary/10 text-primary' : 'text-foreground'}`}>
                           <div className="space-y-1">
                             <div className="flex items-center justify-center gap-1">
                               Semana {semana}
                               {isCurrentWeek && <Clock className="h-3 w-3" />}
                             </div>
                             <div className="text-xs text-muted-foreground font-normal">
                               {startFormatted} - {endFormatted}
                             </div>
                             {isCurrentWeek && (
                               <div className="text-xs font-semibold text-primary">
                                 ATUAL
                               </div>
                             )}
                           </div>
                         </th>
                       );
                     })}
                  </tr>
                </thead>
                <tbody>
                  {meuGrupo.membros.map((membro) => {
                    // Buscar dados do membro na planilha detalhada do supervisor
                    const membroDetalhe = supervisorData?.sdrsDetalhes?.find(sdr => sdr.id === membro.usuario_id);
                    const metaSemanal = membroDetalhe?.metaSemanal || 0;
                    const totalReunioes = membroDetalhe?.reunioesRealizadas || 0;
                    const percentualTotal = membroDetalhe?.percentualAtingimento || 0;
                    
                    return (
                      <tr key={membro.id} className="border-b border-border hover:bg-muted/30">
                        {/* Membro */}
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border-2 border-primary/20 relative overflow-hidden cursor-pointer hover:border-primary/40 transition-colors"
                              onClick={() => setSelectedUserProfile({
                                id: membro.usuario_id,
                                name: membro.usuario?.name || '',
                                photo_url: membro.usuario?.photo_url,
                                user_type: membro.usuario?.user_type || '',
                                nivel: membro.usuario?.nivel
                              })}
                            >
                              {membro.usuario?.photo_url ? (
                                <img 
                                  src={membro.usuario.photo_url}
                                  alt={membro.usuario?.name || 'User'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : null}
                              <span className={`text-sm ${membro.usuario?.photo_url ? 'hidden' : 'block'}`}>
                                {membro.usuario?.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <div 
                                className="font-semibold text-foreground text-sm cursor-pointer hover:text-primary transition-colors"
                                onClick={() => setSelectedUserProfile({
                                  id: membro.usuario_id,
                                  name: membro.usuario?.name || '',
                                  photo_url: membro.usuario?.photo_url,
                                  user_type: membro.usuario?.user_type || '',
                                  nivel: membro.usuario?.nivel
                                })}
                              >
                                {membro.usuario?.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {membro.usuario?.user_type === 'vendedor' ? 'Vendedor' : 'SDR'}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Nível */}
                        <td className="py-4 px-2 text-sm text-foreground">
                          {membro.usuario?.nivel || 'Junior'}
                        </td>
                        
                        {/* Meta Semanal */}
                        <td className="py-4 px-2 text-sm font-semibold text-foreground">
                          {metaSemanal}
                        </td>
                        
                        {/* Colunas das Semanas */}
                         {(semanasDoMes || []).map((semana) => {
                           const { start, end } = getWeekDates(selectedYear, selectedMonth, semana);
                           const today = new Date();
                           const { start: currentWeekStart, end: currentWeekEnd } = getWeekRange(today);
                           const { mes: currentMes, ano: currentAno } = getMesAnoSemanaAtual();
                           
                           // É semana atual se as datas se sobrepõem E estamos no mesmo mês/ano
                           const isCurrentWeek = (currentAno === selectedYear && currentMes === selectedMonth) &&
                             (start <= currentWeekEnd && end >= currentWeekStart);
                           
                            // Buscar dados específicos desta semana nos dados otimizados
                            const semanaData = weeklyData.find(data => data.semana === semana);
                            const membroDetalhe = semanaData?.sdrsDetalhes?.find(sdr => sdr.id === membro.usuario_id);
                            
                            // Verificar se é uma semana futura
                            const endDate = new Date(end);
                            const now = new Date();
                            const isFutureWeek = endDate > now;
                            
                            return (
                              <td key={semana} className={`py-4 px-4 text-center border-l border-border ${isCurrentWeek ? 'bg-primary/5' : ''}`}>
                                 {/* Aplicar formatação condicional para células < 50% */}
                                 <div className={`text-sm ${isCurrentWeek ? 'font-semibold text-primary' : 'text-foreground'} ${membroDetalhe && membroDetalhe.percentualAtingimento < 50 ? 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-950/30 p-2 rounded' : ''}`}>
                                   {!membroDetalhe ? (
                                     isFutureWeek ? (
                                       // Semana futura: mostrar progresso 0% (não marcar como fora do grupo)
                                       (() => {
                                         const userType = membro.usuario?.user_type;
                                         const nivel = membro.usuario?.nivel || 'junior';
                                         let metaPadrao = 0;
                                         
                                         if (userType === 'vendedor') {
                                           metaPadrao = nivel === 'junior' ? 7 : nivel === 'pleno' ? 8 : nivel === 'senior' ? 10 : 7;
                                         } else {
                                           metaPadrao = nivel === 'junior' ? 55 : nivel === 'pleno' ? 70 : nivel === 'senior' ? 85 : 55;
                                         }
                                         
                                         return `0/${metaPadrao} (0.0%)`;
                                       })()
                                     ) : (
                                       // Semana passada e sem dados -> fora do grupo
                                       <div className="italic text-muted-foreground/70 text-xs">
                                         Fora do grupo
                                       </div>
                                     )
                                   ) : (
                                     // Tem dados: exibir valores
                                     <>
                                       {membro.usuario?.user_type === 'vendedor' 
                                         ? (membroDetalhe.reunioesRealizadas % 1 === 0 
                                             ? membroDetalhe.reunioesRealizadas.toString() 
                                             : membroDetalhe.reunioesRealizadas.toFixed(1))
                                         : membroDetalhe.reunioesRealizadas.toString()
                                       }/{membroDetalhe.metaSemanal} ({membroDetalhe.percentualAtingimento.toFixed(1)}%)
                                     </>
                                   )}
                                 </div>
                              </td>
                            );
                         })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td colSpan={3} className="py-3 px-2 font-semibold text-foreground">
                      Taxa de Atingimento Média
                    </td>
                     {(semanasDoMes || []).map((semana) => {
                       const { start, end } = getWeekDates(selectedYear, selectedMonth, semana);
                       const today = new Date();
                       const { start: currentWeekStart, end: currentWeekEnd } = getWeekRange(today);
                       const { mes: currentMes, ano: currentAno } = getMesAnoSemanaAtual();
                       
                       // É semana atual se as datas se sobrepõem E estamos no mesmo mês/ano
                       const isCurrentWeek = (currentAno === selectedYear && currentMes === selectedMonth) &&
                         (start <= currentWeekEnd && end >= currentWeekStart);
                       
                        // Buscar dados específicos desta semana nos dados otimizados
                        const semanaData = weeklyData.find(data => data.semana === semana);
                        
                        // Calcular média dos percentuais desta semana
                        const percentualMedia = semanaData?.mediaPercentualAtingimento || 0;
                        
                        // Verificar se algum membro está abaixo de 50% nesta semana
                        const temMembroAbaixoDe50 = semanaData?.sdrsDetalhes?.some(sdr => 
                          sdr.percentualAtingimento && sdr.percentualAtingimento < 50
                        ) || false;
                        
                         // Aplicar regra: se algum membro < 50%, mostrar 0.0% (XX.X%)
                         const displayMedia = temMembroAbaixoDe50
                           ? `0.0% (${percentualMedia.toFixed(1)}%)`
                           : `${percentualMedia.toFixed(1)}%`;
                         
                         const mediaClass = temMembroAbaixoDe50
                           ? "text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-950/30"
                           : "";
                        
                        return (
                          <td key={semana} className={`py-3 px-4 text-center border-l border-border font-semibold ${isCurrentWeek ? 'bg-primary/10 text-primary' : 'text-foreground'} ${mediaClass}`}>
                            {displayMedia}
                          </td>
                        );
                     })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Modais de Perfil */}
      {selectedUserProfile && selectedUserProfile.user_type === 'vendedor' && (
        <VendedorProfileModal
          isOpen={!!selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          vendedor={{
            id: selectedUserProfile.id,
            nome: selectedUserProfile.name,
            photo_url: selectedUserProfile.photo_url,
            nivel: selectedUserProfile.nivel,
            user_type: selectedUserProfile.user_type
          }}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      )}
      
      {selectedUserProfile && selectedUserProfile.user_type === 'sdr' && (
        <SDRProfileModal
          isOpen={!!selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          sdr={{
            id: selectedUserProfile.id,
            nome: selectedUserProfile.name,
            photo_url: selectedUserProfile.photo_url,
            tipo: 'outbound' as 'inbound' | 'outbound',
            nivel: selectedUserProfile.nivel || 'junior',
            metaReunioesSemanal: 55
          }}
        />
      )}
      
      {selectedUserProfile && !['vendedor', 'sdr'].includes(selectedUserProfile.user_type) && (
        <UserProfileModal
          isOpen={!!selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          user={{
            id: selectedUserProfile.id,
            name: selectedUserProfile.name,
            photo_url: selectedUserProfile.photo_url,
            user_type: selectedUserProfile.user_type,
            nivel: selectedUserProfile.nivel
          }}
        />
      )}
    </div>
  );
};

export default SupervisorDashboardAtualizado;