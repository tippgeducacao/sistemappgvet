import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingUp, TrendingDown, Target, Calendar, X, Users, ZoomIn, ZoomOut, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useNiveis } from '@/hooks/useNiveis';
import { useAuthStore } from '@/stores/AuthStore';
import { isVendaInPeriod, getVendaPeriod, getMesAnoSemanaAtual } from '@/utils/semanaUtils';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentWeekConversions } from '@/hooks/useWeeklyConversion';
import { ComissionamentoService } from '@/services/comissionamentoService';

interface VendedorData {
  id: string;
  name: string;
  weeklySales: number;
  weeklyTarget: number;
  avatar: string;
  points: number;
  isSDR: boolean;
  monthlyTotal: number;
  nivel?: string;
  // Dados específicos para SDRs
  reunioesSemana?: number;
  reunioesDia?: number;
  reunioesMes?: number;
  metaReunioesSemanais?: number;
  metaReunioesEnvioDiario?: number;
  // Novos dados para vendedores - pontuação diária
  pontosOntem?: number;
  pontosHoje?: number;
  // Taxa de conversão semanal
  taxaConversaoSemanal?: number;
}

interface TVRankingDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

const Podium: React.FC<{ topThree: VendedorData[] }> = ({ topThree }) => {
  const podiumHeights = [50, 70, 40];
  const positions = ['2nd', '1st', '3rd'];
  const colors = ['bg-gray-400', 'bg-yellow-500', 'bg-orange-400'];

  return (
    <div className="flex items-end justify-center gap-1 mb-4">
      {[topThree[1], topThree[0], topThree[2]].map((person, index) => (
        <motion.div
          key={person?.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.2 }}
          className="flex flex-col items-center"
        >
          <div className="mb-1 text-center">
            <img
              src={person?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person?.name.replace(' ', '')}`}
              alt={person?.name}
              className="w-12 h-12 rounded-full mx-auto mb-1"
            />
            <div className="text-sm font-medium text-foreground">{person?.name}</div>
            <div className="text-xs text-muted-foreground">{person?.points} pts</div>
          </div>
          <div
            className={`${colors[index]} rounded-t-lg flex items-end justify-center text-white font-bold text-xs relative`}
            style={{ height: `${podiumHeights[index]}px`, width: '60px' }}
          >
            <div className="absolute top-1">
              {index === 1 && <Trophy className="w-4 h-4" />}
              {index !== 1 && <span className="text-xs">{positions[index]}</span>}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const VendedorCard: React.FC<{ person: VendedorData; rank: number; isTopThree?: boolean }> = ({ person, rank, isTopThree = false }) => {
  const weeklyProgress = person.weeklyTarget > 0 ? (person.weeklySales / person.weeklyTarget) * 100 : 0;
  
  // Para SDRs, calcular progresso das reuniões também
  const reunioesWeeklyProgress = person.isSDR && person.metaReunioesSemanais ? 
    (person.reunioesSemana! / person.metaReunioesSemanais) * 100 : 0;
  const reunioesDailyProgress = person.isSDR && person.metaReunioesEnvioDiario ? 
    (person.reunioesDia! / person.metaReunioesEnvioDiario) * 100 : 0;
  
  // Verificar se é SDR com comissão bloqueada (abaixo de 71%)
  const isSDR = person.isSDR;
  const comissaoBloqueada = isSDR && weeklyProgress < 71;

  const getTopThreeStyle = () => {
    // Se for SDR, usar borda verde quando atingir 71% da meta, vermelha quando não
    if (isSDR) {
      if (weeklyProgress >= 71) {
        return 'bg-card border-green-500 border-2 shadow-lg text-foreground';
      } else {
        return 'bg-card border-red-500 border-2 shadow-lg text-foreground';
      }
    }
    
    if (!isTopThree) return 'bg-card border-border';
    
    switch (rank) {
      case 1:
        return 'bg-card border-yellow-500 border-2 shadow-lg shadow-yellow-500/20';
      case 2:
        return 'bg-card border-gray-400 border-2 shadow-lg shadow-gray-500/20';
      case 3:
        return 'bg-card border-orange-500 border-2 shadow-lg shadow-orange-500/20';
      default:
        return 'bg-card border-border';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`relative border rounded-lg p-3 hover:shadow-md transition-shadow ${getTopThreeStyle()}`}
    >
      
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs font-bold">
            {rank}
          </div>
          <img
            src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name.replace(' ', '')}`}
            alt={person.name}
            className="w-9 h-9 rounded-full"
          />
          <div>
            <div className="text-sm font-medium text-foreground">{person.name}</div>
            <div className="text-xs text-muted-foreground">
               {person.isSDR ? '' : `${person.points} pts`}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${weeklyProgress >= 100 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-muted-foreground">
                {weeklyProgress.toFixed(0)}%
              </span>
              {/* Bolinha da taxa de conversão para SDRs */}
              {person.isSDR && person.taxaConversaoSemanal !== undefined && (
                <>
                  <div className={`w-1.5 h-1.5 rounded-full ml-2 ${person.taxaConversaoSemanal >= 50 ? 'bg-emerald-500' : person.taxaConversaoSemanal >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-muted-foreground">
                    {person.taxaConversaoSemanal.toFixed(1)}%
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {person.isSDR && <Users className="w-3 h-3 text-blue-500" />}
          {!person.isSDR && (weeklyProgress >= 100 ? (
            <TrendingUp className="w-3 h-3 text-green-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          ))}
        </div>
      </div>
      
      <div className="space-y-1">
        {/* Para SDRs, mostrar duas barras separadas como nos outros rankings */}
        {person.isSDR ? (
          <>
            {/* Vendas de Cursos (azul) */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Target className="w-2 h-2" />
                  vendas cursos
                </div>
                <span className="text-xs font-medium text-blue-600">
                  {person.weeklySales}/{person.weeklyTarget}
                </span>
              </div>
              <Progress value={Math.min(weeklyProgress, 100)} className="h-2 bg-blue-100">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-in-out" 
                  style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
                />
              </Progress>
            </div>
            
            {/* Reuniões (rosa/magenta) */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1 text-xs text-ppgvet-magenta">
                  <Users className="w-2 h-2" />
                  reuniões
                </div>
                <span className="text-xs font-medium text-ppgvet-magenta">
                  {person.reunioesSemana}/{person.metaReunioesSemanais}
                </span>
              </div>
              <Progress value={Math.min(reunioesWeeklyProgress, 100)} className="h-2 bg-muted/20">{/* Mudou de bg-purple-100 para bg-muted/20 */}
                <div 
                  className="h-full bg-ppgvet-magenta transition-all duration-300 ease-in-out" 
                  style={{ width: `${Math.min(reunioesWeeklyProgress, 100)}%` }}
                />
              </Progress>
            </div>
          </>
        ) : (
          <>
            {/* Vendedores normais */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Target className="w-2 h-2" />
                  Meta Pontos Semanal
                </div>
                <span className="text-xs font-medium">
                  {person.weeklySales.toFixed(1)}/{person.weeklyTarget} ({weeklyProgress.toFixed(0)}%)
                </span>
              </div>
              <div className="h-1 bg-muted rounded-full">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-2 h-2" />
                  Ontem
                </div>
                <span className="text-xs font-medium">
                  {(person.pontosOntem || 0).toFixed(1)} pts
                </span>
              </div>
              <div className="h-1 bg-muted rounded-full">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(((person.pontosOntem || 0) / Math.max(person.weeklyTarget / 7, 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-2 h-2" />
                  Hoje
                </div>
                <span className="text-xs font-medium">
                  {(person.pontosHoje || 0).toFixed(1)} pts
                </span>
              </div>
              <div className="h-1 bg-muted rounded-full">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(((person.pontosHoje || 0) / Math.max(person.weeklyTarget / 7, 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

const VendasReunioesSummaryCard: React.FC<{ 
  vendasSemana: number; 
  vendasMes: number; 
  reunioesSemana: number; 
  reunioesMes: number; 
}> = ({ vendasSemana, vendasMes, reunioesSemana, reunioesMes }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 border border-blue-400 dark:border-blue-300 rounded-lg p-4 shadow-xl text-white"
    >
      <div className="text-center">
        <h3 className="text-lg font-bold mb-3">Resumo Geral</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm opacity-90 font-medium">Vendas</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-80">Semana:</span>
                <span className="text-lg font-bold">{vendasSemana}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-80">Mês:</span>
                <span className="text-lg font-bold">{vendasMes}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm opacity-90 font-medium">Reuniões</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-80">Semana:</span>
                <span className="text-lg font-bold">{reunioesSemana}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-80">Mês:</span>
                <span className="text-lg font-bold">{reunioesMes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TVRankingDisplay: React.FC<TVRankingDisplayProps> = ({ isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const { vendas } = useAllVendas();
  const { vendedores } = useVendedores();
  const { metasSemanais, getSemanaAtual } = useMetasSemanais();
  const { niveis } = useNiveis();
  const { currentUser } = useAuthStore();

  // Buscar todos os agendamentos para os SDRs
  const { data: allAgendamentos = [] } = useQuery({
    queryKey: ['all-agendamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          sdr:sdr_id(id, name),
          vendedor:vendedor_id(id, name),
          lead:lead_id(id, nome)
        `)
        .order('data_agendamento', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar agendamentos:', error);
        throw error;
      }

      return data || [];
    },
    enabled: isOpen, // Só buscar quando o modal estiver aberto
  });

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      // Atualizar dados sem recarregar a página
      window.location.hash = window.location.hash; // Força re-render
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  console.log('🔍 TVRankingDisplay - Dados carregados:', {
    vendas: vendas?.length || 0,
    vendedores: vendedores?.length || 0,
    metasSemanais: metasSemanais?.length || 0,
    allAgendamentos: allAgendamentos?.length || 0,
    isOpen
  });

  // Bloquear scroll do body quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Detectar quando sai do fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Calcular dados para ranking usando a regra de semanas (quarta a terça)
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  const { mes: currentMonth, ano: currentYear } = getMesAnoSemanaAtual();
  const currentWeek = getSemanaAtual();
  const today = new Date();

  // Calcular período da semana atual (quarta-feira a terça-feira)
  const getDaysUntilWednesday = (date: Date) => {
    const day = date.getDay(); // 0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
    if (day >= 3) { // Quinta, sexta, sábado ou quarta
      return day - 3;
    } else { // Domingo, segunda, terça
      return day + 4; // Volta para quarta anterior
    }
  };

  const startOfWeek = new Date(today);
  const daysToWednesday = getDaysUntilWednesday(today);
  startOfWeek.setDate(today.getDate() - daysToWednesday);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // 6 dias depois (quarta + 6 = terça)
  endOfWeek.setHours(23, 59, 59, 999);

  // Filtrar vendas usando a regra de semana (quarta a terça) para a semana atual
  const vendasSemanaAtual = vendas.filter(venda => {
    if (venda.status !== 'matriculado') return false;
    const vendaDate = new Date(venda.enviado_em);
    return vendaDate >= startOfWeek && vendaDate <= endOfWeek;
  });

  // Filtrar vendas do mês atual usando a regra de semana
  const vendasMesAtual = vendas.filter(venda => {
    if (venda.status !== 'matriculado') return false;
    const vendaDate = new Date(venda.enviado_em);
    const { mes, ano } = getVendaPeriod(vendaDate);
    return mes === currentMonth && ano === currentYear;
  });

  // Filtrar vendas do dia atual
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const vendasDiaAtual = vendas.filter(venda => {
    const vendaDate = new Date(venda.enviado_em);
    return vendaDate >= startOfDay && vendaDate <= endOfDay && 
           venda.status === 'matriculado';
  });

  console.log('📅 TVRankingDisplay - Períodos (regra de semana):', {
    today: today.toISOString(),
    startOfWeek: startOfWeek.toISOString(),
    endOfWeek: endOfWeek.toISOString(),
    currentWeek,
    currentYear,
    currentMonth,
    daysToWednesday,
    totalVendas: vendas.length,
    vendasMatriculadas: vendas.filter(v => v.status === 'matriculado').length,
    vendasSemana: vendasSemanaAtual.length,
    vendasMes: vendasMesAtual.length,
    vendasDia: vendasDiaAtual.length
  });

  // Calcular dados dos vendedores (filtrar apenas vendedores e SDRs, excluir admins)
  const vendedoresData: VendedorData[] = vendedores
    .filter(vendedor => vendedor.user_type && !vendedor.user_type.includes('admin'))
    .map(vendedor => {
    const isSDR = vendedor.user_type?.includes('sdr') || false;
    
    if (isSDR) {
      // Para SDRs - buscar dados reais das reuniões usando mesma lógica de semana (quarta a terça)
      // Para SDRs - contar VENDAS DE CURSOS + reuniões realizadas
      
      // 1. VENDAS DE CURSOS que o SDR fez diretamente
      const vendasSDRSemana = vendasSemanaAtual.filter(v => v.vendedor_id === vendedor.id);
      const vendasSDRMes = vendasMesAtual.filter(v => v.vendedor_id === vendedor.id);
      const vendasSDRDia = vendasDiaAtual.filter(v => v.vendedor_id === vendedor.id);

      // 2. REUNIÕES REALIZADAS (compareceu ou comprou)
      const agendamentosSDRSemana = allAgendamentos.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data_agendamento);
        const isDoSDR = agendamento.sdr_id === vendedor.id;
        const dentroDaSemana = dataAgendamento >= startOfWeek && dataAgendamento <= endOfWeek;
        const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                           agendamento.resultado_reuniao === 'comprou';
        
        // Debug para Regiane
        if (vendedor.name === 'Regiane') {
          console.log('🔍 DEBUG REGIANE - Agendamento:', {
            id: agendamento.id,
            data_agendamento: agendamento.data_agendamento,
            resultado_reuniao: agendamento.resultado_reuniao,
            status: agendamento.status,
            isDoSDR,
            dentroDaSemana,
            compareceu,
            startOfWeek: startOfWeek.toISOString(),
            endOfWeek: endOfWeek.toISOString()
          });
        }
        
        return isDoSDR && dentroDaSemana && compareceu;
      });

      const agendamentosSDRDia = allAgendamentos.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data_agendamento);
        dataAgendamento.setHours(0, 0, 0, 0);
        const isDoSDR = agendamento.sdr_id === vendedor.id;
        const dentroDoDia = dataAgendamento.getTime() === startOfDay.getTime();
        const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                           agendamento.resultado_reuniao === 'comprou';
        return isDoSDR && dentroDoDia && compareceu;
      });

      const agendamentosSDRMes = allAgendamentos.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data_agendamento);
        const isDoSDR = agendamento.sdr_id === vendedor.id;
        const { mes, ano } = getVendaPeriod(dataAgendamento);
        const dentroDoMes = mes === currentMonth && ano === currentYear;
        const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                           agendamento.resultado_reuniao === 'comprou';
        return isDoSDR && dentroDoMes && compareceu;
      });

      // Buscar meta de vendas de cursos do SDR
      const sdrNivel = vendedor.nivel || 'junior';
      const nivelConfig = niveis.find(n => n.nivel === sdrNivel && n.tipo_usuario === 'sdr');
      const metaVendasCursos = nivelConfig?.meta_vendas_cursos || 8;
      
      // CALCULAR TAXA DE CONVERSÃO SEMANAL (quarta a terça)
      // Para SDRs: quantas reuniões comparecidas foram convertidas em vendas pelo vendedor
      const agendamentosComparecidos = allAgendamentos.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data_agendamento);
        const isDoSDR = agendamento.sdr_id === vendedor.id;
        const dentroDaSemana = dataAgendamento >= startOfWeek && dataAgendamento <= endOfWeek;
        const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                           agendamento.resultado_reuniao === 'comprou';
        return isDoSDR && dentroDaSemana && compareceu;
      });

      const agendamentosConvertidos = allAgendamentos.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data_agendamento);
        const isDoSDR = agendamento.sdr_id === vendedor.id;
        const dentroDaSemana = dataAgendamento >= startOfWeek && dataAgendamento <= endOfWeek;
        const converteu = agendamento.resultado_reuniao === 'comprou';
        return isDoSDR && dentroDaSemana && converteu;
      });

      const taxaConversaoSemanal = agendamentosComparecidos.length > 0 ? 
        (agendamentosConvertidos.length / agendamentosComparecidos.length) * 100 : 0;
      
      // Total de pontos = vendas diretas + reuniões realizadas
      const pontosSemanaTotais = vendasSDRSemana.length + agendamentosSDRSemana.length;
      const pontosMesTotais = vendasSDRMes.length + agendamentosSDRMes.length;

      console.log(`🎯 SDR ${vendedor.name}:`, {
        sdrId: vendedor.id,
        vendasDiretas: { semana: vendasSDRSemana.length, mes: vendasSDRMes.length },
        reunioesRealizadas: { semana: agendamentosSDRSemana.length, mes: agendamentosSDRMes.length },
        agendamentosComparecidos: agendamentosComparecidos.length,
        agendamentosConvertidos: agendamentosConvertidos.length,
        taxaConversaoSemanal: taxaConversaoSemanal.toFixed(1) + '%',
        pontosSemanaTotais,
        pontosMesTotais,
        metaVendasCursos
      });

      return {
        id: vendedor.id,
        name: vendedor.name,
        weeklySales: vendasSDRSemana.length, // Vendas de cursos apenas
        weeklyTarget: metaVendasCursos, // Meta de vendas de cursos
        avatar: vendedor.photo_url || '',
        points: vendasSDRSemana.length, // Para ordenação
        isSDR: true,
        monthlyTotal: vendasSDRMes.length,
        nivel: vendedor.nivel,
        // Dados específicos para SDRs - reuniões
        reunioesSemana: agendamentosSDRSemana.length,
        reunioesDia: agendamentosSDRDia.length,
        reunioesMes: agendamentosSDRMes.length,
        metaReunioesSemanais: nivelConfig?.meta_semanal_sdr || 55,
        metaReunioesEnvioDiario: Math.ceil((nivelConfig?.meta_semanal_sdr || 55) / 7),
        // Taxa de conversão semanal
        taxaConversaoSemanal
      };
    } else {
      // Para vendedores - usar pontuação em vez de número de vendas
      const vendasVendedorSemana = vendasSemanaAtual.filter(v => v.vendedor_id === vendedor.id);
      const vendasVendedorMes = vendasMesAtual.filter(v => v.vendedor_id === vendedor.id);
      
      // Calcular vendas de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      
      const vendasVendedorHoje = vendas.filter(venda => {
        if (venda.vendedor_id !== vendedor.id) return false;
        if (venda.status !== 'matriculado') return false;
        
        const dataVenda = venda.data_aprovacao ? new Date(venda.data_aprovacao) : new Date(venda.enviado_em || venda.atualizado_em);
        dataVenda.setHours(0, 0, 0, 0);
        
        return dataVenda.getTime() === hoje.getTime();
      });
      
      // Calcular vendas de ontem
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      
      const vendasVendedorOntem = vendas.filter(venda => {
        if (venda.vendedor_id !== vendedor.id) return false;
        if (venda.status !== 'matriculado') return false;
        
        const dataVenda = venda.data_aprovacao ? new Date(venda.data_aprovacao) : new Date(venda.enviado_em || venda.atualizado_em);
        dataVenda.setHours(0, 0, 0, 0);
        
        return dataVenda.getTime() === ontem.getTime();
      });
      
      // Buscar meta semanal baseada no nível do vendedor (da tabela niveis_vendedores)
      const vendedorNivel = vendedor.nivel || 'junior';
      const nivelConfig = niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === 'vendedor');
      const metaSemanal = nivelConfig?.meta_semanal_vendedor || 7;

      // Calcular pontos obtidos usando a pontuação real das vendas (validada ou esperada)
      const pontosSemana = vendasVendedorSemana.reduce((sum, venda) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
      const pontosMes = vendasVendedorMes.reduce((sum, venda) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
      const pontosHoje = vendasVendedorHoje.reduce((sum, venda) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
      const pontosOntem = vendasVendedorOntem.reduce((sum, venda) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
      
      console.log(`💰 Vendedor ${vendedor.name}:`, {
        vendedorId: vendedor.id,
        vendasSemana: vendasVendedorSemana.length,
        vendasMes: vendasVendedorMes.length,
        vendasHoje: vendasVendedorHoje.length,
        vendasOntem: vendasVendedorOntem.length,
        pontosSemana,
        pontosMes,
        pontosHoje,
        pontosOntem,
        metaSemanal,
        vendasDetalhes: vendasVendedorSemana.map(v => ({
          id: v.id,
          pontuacao_validada: v.pontuacao_validada,
          status: v.status,
          enviado_em: v.enviado_em
        }))
      });

      return {
        id: vendedor.id,
        name: vendedor.name,
        weeklySales: pontosSemana, // Pontos da semana, não número de vendas
        weeklyTarget: metaSemanal, // Meta semanal em pontos
        avatar: vendedor.photo_url || '',
        points: pontosSemana, // Pontos para ordenação
        isSDR: false,
        monthlyTotal: pontosMes, // Pontos do mês, não número de vendas
        nivel: vendedor.nivel,
        pontosHoje: pontosHoje, // Pontos de hoje
        pontosOntem: pontosOntem // Pontos de ontem
      };
    }
  });

  // Separar vendedores e SDRs
  const vendedoresOnly = vendedoresData.filter(v => !v.isSDR).sort((a, b) => b.points - a.points);
  const sdrsOnly = vendedoresData.filter(v => v.isSDR).sort((a, b) => b.weeklySales - a.weeklySales);

  console.log('📊 TVRankingDisplay - Dados separados:', {
    vendedores: vendedoresOnly.length,
    sdrs: sdrsOnly.length,
    vendedoresData: vendedoresOnly.map(v => ({ 
      name: v.name, 
      pontos: v.points, 
      weeklySales: v.weeklySales,
      weeklyTarget: v.weeklyTarget 
    })),
    sdrsData: sdrsOnly.map(s => ({ 
      name: s.name, 
      reunioes: s.weeklySales,
      weeklyTarget: s.weeklyTarget 
    }))
  });

  // NÃO combinar - manter separados
  const topThreeVendedores = vendedoresOnly.slice(0, 3);
  const remainingVendedores = vendedoresOnly.slice(3);

  // Calcular totais de vendas da semana e mês atual
  const totalVendasSemana = vendas.filter(v => {
    if (v.status !== 'matriculado') return false;
    const dataVenda = v.data_aprovacao ? new Date(v.data_aprovacao) : new Date(v.enviado_em || v.atualizado_em);
    return dataVenda >= startOfWeek && dataVenda <= endOfWeek;
  }).length;
  
  // Mês atual
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const totalVendasMes = vendas.filter(v => {
    if (v.status !== 'matriculado') return false;
    const dataVenda = v.data_aprovacao ? new Date(v.data_aprovacao) : new Date(v.enviado_em || v.atualizado_em);
    return dataVenda >= startOfMonth && dataVenda <= endOfMonth;
  }).length;

  // Calcular reuniões realizadas (sem "não compareceu")
  const totalReunioesSemana = allAgendamentos.filter(agendamento => {
    const dataAgendamento = new Date(agendamento.data_agendamento);
    const dentroDaSemana = dataAgendamento >= startOfWeek && dataAgendamento <= endOfWeek;
    const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                       agendamento.resultado_reuniao === 'comprou';
    
    return dentroDaSemana && compareceu;
  }).length;

  const totalReunioesMes = allAgendamentos.filter(agendamento => {
    const dataAgendamento = new Date(agendamento.data_agendamento);
    const dentroDoMes = dataAgendamento >= startOfMonth && dataAgendamento <= endOfMonth;
    const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                       agendamento.resultado_reuniao === 'comprou';
    
    return dentroDoMes && compareceu;
  }).length;

  // Função para calcular as semanas do mês com datas (todas as semanas do mês)
  const getWeeksOfMonth = (year: number, month: number) => {
    const weeks = [];
    let weekNumber = 1;
    
    // Encontrar a primeira terça-feira do mês
    const firstDay = new Date(year, month - 1, 1);
    let firstTuesday = new Date(firstDay);
    
    while (firstTuesday.getDay() !== 2) { // 2 = terça-feira
      firstTuesday.setDate(firstTuesday.getDate() + 1);
    }
    
    // Se a primeira terça está muito tarde no mês, verificar semana anterior
    if (firstTuesday.getDate() > 7) {
      firstTuesday.setDate(firstTuesday.getDate() - 7);
    }
    
    let currentTuesday = new Date(firstTuesday);
    
    // Adicionar todas as terças-feiras que estão no mês
    while (currentTuesday.getMonth() === month - 1 && currentTuesday.getFullYear() === year) {
      const startOfWeek = new Date(currentTuesday);
      startOfWeek.setDate(startOfWeek.getDate() - 6); // Quarta anterior
      
      const endOfWeek = new Date(currentTuesday); // Terça atual
      endOfWeek.setHours(23, 59, 59, 999); // Final do dia da terça
      
      weeks.push({
        week: weekNumber,
        startDate: startOfWeek,
        endDate: endOfWeek,
        label: `${startOfWeek.getDate().toString().padStart(2, '0')}/${(startOfWeek.getMonth() + 1).toString().padStart(2, '0')} - ${endOfWeek.getDate().toString().padStart(2, '0')}/${(endOfWeek.getMonth() + 1).toString().padStart(2, '0')}`
      });
      
      weekNumber++;
      currentTuesday.setDate(currentTuesday.getDate() + 7);
    }
    
    return weeks;
  };

  // Função para calcular pontos por semana do vendedor (copiada do VendorsRanking)
  const getVendedorWeeklyPoints = (vendedorId: string, weeks: any[]) => {
    return weeks.map((week, index) => {
      const weekPoints = vendas
        .filter(venda => {
          if (venda.vendedor_id !== vendedorId || venda.status !== 'matriculado') return false;
          
          const vendaDate = new Date(venda.enviado_em);
          const isInRange = vendaDate >= week.startDate && vendaDate <= week.endDate;
          
          return isInRange;
        })
        .reduce((sum, venda) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
      
      return weekPoints;
    });
  };

  // Função para calcular comissão POR SEMANA usando as regras de comissionamento (copiada do VendorsRanking)
  const calculateWeeklyCommission = async (points: number, metaSemanal: number, variavelSemanal: number) => {
    const achievementPercentage = (points / metaSemanal) * 100;
    
    try {
      const { valor, multiplicador } = await ComissionamentoService.calcularComissao(
        points, 
        metaSemanal, 
        variavelSemanal, 
        'vendedor'
      );
      return { valor, multiplicador, percentual: achievementPercentage };
    } catch (error) {
      console.error('Erro ao calcular comissão:', error);
      return { valor: 0, multiplicador: 0, percentual: achievementPercentage };
    }
  };

  // Função para calcular comissão total (copiada do VendorsRanking)
  const calculateTotalCommission = async (vendedorId: string, weeks: any[], nivelConfig: any) => {
    const weeklyPoints = getVendedorWeeklyPoints(vendedorId, weeks);
    const metaSemanal = nivelConfig?.meta_semanal_vendedor || 7;
    const variavelSemanal = nivelConfig?.variavel_semanal || 0;
    
    const weeklyCommissions = await Promise.all(
      weeklyPoints.map(points => calculateWeeklyCommission(points, metaSemanal, variavelSemanal))
    );
    
    const totalWeeklyCommission = weeklyCommissions.reduce((total, commission) => {
      return total + commission.valor;
    }, 0);
    
    return { total: totalWeeklyCommission, weeklyCommissions };
  };

  const exportToPDF = async () => {
    const { mes: currentMonth, ano: currentYear } = getMesAnoSemanaAtual();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mesAtualSelecionado = `${monthNames[currentMonth - 1]} de ${currentYear}`;
    
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape
    const weeks = getWeeksOfMonth(currentYear, currentMonth);
    
    // PÁGINA 1: VENDEDORES
    doc.setFontSize(16);
    doc.text(`Ranking de Vendedores - ${mesAtualSelecionado}`, 20, 20);
    
    // Cabeçalhos da tabela de vendedores
    const vendedoresHeaders = [
      'Vendedor',
      'Nível',
      'Meta Semanal',
      'Comissão Semanal',
      ...weeks.map(w => `Semana ${w.week}\n${w.label}`),
      'Total Pontos',
      'Atingimento %',
      'Comissão Total'
    ];
    
    // Dados da tabela de vendedores
    const vendedoresTableData = await Promise.all(vendedoresOnly.map(async vendedor => {
      const vendedorData = vendedores.find(v => v.id === vendedor.id);
      const vendedorNivel = vendedorData?.nivel || 'junior';
      const nivelConfig = niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === 'vendedor');
      const weeklyPoints = getVendedorWeeklyPoints(vendedor.id, weeks);
      const totalPoints = weeklyPoints.reduce((sum, points) => sum + points, 0);
      const metaMensal = (nivelConfig?.meta_semanal_vendedor || 7) * weeks.length;
      const achievementPercentage = metaMensal > 0 ? (totalPoints / metaMensal) * 100 : 0;
      const commissionData = await calculateTotalCommission(vendedor.id, weeks, nivelConfig);
      
      const weeklyCommissionStrings = await Promise.all(weeklyPoints.map(async (points, index) => {
        const metaSemanal = nivelConfig?.meta_semanal_vendedor || 7;
        const variavelSemanal = nivelConfig?.variavel_semanal || 0;
        const commission = await calculateWeeklyCommission(points, metaSemanal, variavelSemanal);
        const percentage = metaSemanal > 0 ? ((points / metaSemanal) * 100).toFixed(1) : '0.0';
        const valorFormatado = `R$ ${commission.valor.toFixed(2)}`;
        return `${points.toFixed(1)}pts ${percentage}% (x${commission.multiplicador}) = ${valorFormatado}`;
      }));
      
      return [
        vendedor.name,
        vendedorNivel.charAt(0).toUpperCase() + vendedorNivel.slice(1),
        nivelConfig?.meta_semanal_vendedor || 7,
        `R$ ${(nivelConfig?.variavel_semanal || 0).toFixed(2)}`,
        ...weeklyCommissionStrings,
        totalPoints,
        `${achievementPercentage.toFixed(1)}%`,
        `R$ ${commissionData.total.toFixed(2)}`
      ];
    }));
    
    autoTable(doc, {
      head: [vendedoresHeaders],
      body: vendedoresTableData,
      startY: 30,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30 }, // Vendedor
      }
    });

    // PÁGINA 2: SDRs
    if (sdrsOnly.length > 0) {
      // Nova página para SDRs
      doc.addPage();
      doc.setFontSize(16);
      doc.text(`Ranking de SDRs - ${mesAtualSelecionado}`, 20, 20);

      // Cabeçalhos da tabela de SDRs
      const sdrsHeaders = [
        'SDR',
        'Tipo',
        'Nível',
        'Meta Semanal',
        'Comissão Semanal',
        ...weeks.map(w => `Semana ${w.week}\n${w.label}`),
        'Total Reuniões',
        'Atingimento %',
        'Comissão Total'
      ];

      // Dados da tabela de SDRs
      const sdrsTableData = sdrsOnly.map((sdr) => {
        const sdrData = vendedores.find(v => v.id === sdr.id);
        const baseNivel = (sdrData?.nivel || 'junior').toLowerCase();
        const sdrTipoUsuario = sdrData?.user_type; // 'sdr'
        const sdrType = sdrData?.nivel?.includes('inbound') ? 'inbound' : 'outbound';
        
        // Se o nível não tiver o prefixo sdr_, compor corretamente com o tipo (inbound/outbound)
        const nivelCompleto = baseNivel.startsWith('sdr_') ? baseNivel : `sdr_${sdrType}_${baseNivel}`;
        const nivelConfig = niveis.find(n => n.tipo_usuario === 'sdr' && n.nivel.toLowerCase() === nivelCompleto);
        const nivelLabel = nivelCompleto.charAt(0).toUpperCase() + nivelCompleto.slice(1);
        
        // Meta semanal para SDRs
        const metaSemanal = nivelConfig?.meta_semanal_sdr ?? 55;
        const metaMensal = metaSemanal * weeks.length;
        const variavelSemanal = Number(nivelConfig?.variavel_semanal || 0);
        
        // Calcular reuniões por semana - APENAS para semanas que já passaram
        const reunioesPorSemana = weeks.map(week => {
          const startDate = new Date(week.startDate);
          const endDate = new Date(week.endDate);
          
          // Contar reuniões realizadas nesta semana específica
          const reunioesNaSemana = allAgendamentos.filter(agendamento => {
            const dataAgendamento = new Date(agendamento.data_agendamento);
            const isDoSDR = agendamento.sdr_id === sdr.id;
            const dentroDaSemana = dataAgendamento >= startDate && dataAgendamento <= endDate;
            const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                               agendamento.resultado_reuniao === 'comprou';
            return isDoSDR && dentroDaSemana && compareceu;
          }).length;
          
          return reunioesNaSemana;
        });
        
        const totalReunioes = reunioesPorSemana.reduce((sum, reunioes) => sum + reunioes, 0);
        const achievementPercentage = metaMensal > 0 ? (totalReunioes / metaMensal) * 100 : 0;
        
        const weeklyMeetingsStrings = reunioesPorSemana.map((reunioes, index) => {
          const percentage = metaSemanal > 0 ? ((reunioes / metaSemanal) * 100).toFixed(1) : '0.0';
          return `${reunioes} Reuniões (${percentage}%)`;
        });
        
        return [
          sdr.name,
          sdrType === 'inbound' ? 'Inbound' : 'Outbound',
          nivelLabel,
          metaSemanal,
          `R$ ${variavelSemanal.toFixed(2)}`,
          ...weeklyMeetingsStrings,
          totalReunioes,
          `${achievementPercentage.toFixed(1)}%`,
          `R$ 0.00` // TODO: Implementar cálculo de comissão para SDRs
        ];
      });

      autoTable(doc, {
        head: [sdrsHeaders],
        body: sdrsTableData,
        startY: 30,
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 30 }, // SDR
        }
      });
    }
    
    doc.save(`ranking-vendedores-sdrs-${mesAtualSelecionado.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const exportToSpreadsheet = async () => {
    const { mes: currentMonth, ano: currentYear } = getMesAnoSemanaAtual();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mesAtualSelecionado = `${monthNames[currentMonth - 1]} de ${currentYear}`;
    
    const weeks = getWeeksOfMonth(currentYear, currentMonth);
    
    // Dados dos Vendedores
    const vendedoresData = await Promise.all(vendedoresOnly.map(async vendedor => {
      const vendedorData = vendedores.find(v => v.id === vendedor.id);
      const vendedorNivel = vendedorData?.nivel || 'junior';
      const nivelConfig = niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === 'vendedor');
      const weeklyPoints = getVendedorWeeklyPoints(vendedor.id, weeks);
      const totalPoints = weeklyPoints.reduce((sum, points) => sum + points, 0);
      const metaMensal = (nivelConfig?.meta_semanal_vendedor || 7) * weeks.length;
      const achievementPercentage = metaMensal > 0 ? (totalPoints / metaMensal) * 100 : 0;
      const commissionData = await calculateTotalCommission(vendedor.id, weeks, nivelConfig);
      
      const row: any = {
        'Vendedor': vendedor.name,
        'Nível': vendedorNivel.charAt(0).toUpperCase() + vendedorNivel.slice(1),
        'Meta Semanal': nivelConfig?.meta_semanal_vendedor || 7,
        'Comissão Semanal': `R$ ${(nivelConfig?.variavel_semanal || 0).toFixed(2)}`
      };
      
      // Adicionar colunas das semanas com pontos, porcentagem, multiplicadores e valores
      for (let i = 0; i < weeklyPoints.length; i++) {
        const points = weeklyPoints[i];
        const metaSemanal = nivelConfig?.meta_semanal_vendedor || 7;
        const variavelSemanal = nivelConfig?.variavel_semanal || 0;
        const commission = await calculateWeeklyCommission(points, metaSemanal, variavelSemanal);
        const percentage = metaSemanal > 0 ? ((points / metaSemanal) * 100).toFixed(1) : '0.0';
        const valorFormatado = `R$ ${commission.valor.toFixed(2)}`;
        
        row[`Semana ${weeks[i].week} (${weeks[i].label})`] = `${points.toFixed(1)}pts ${percentage}% (x${commission.multiplicador}) = ${valorFormatado}`;
      }
      
      // Adicionar colunas finais na ordem correta
      row['Total Pontos'] = totalPoints;
      row['Atingimento %'] = parseFloat(achievementPercentage.toFixed(1));
      row['Comissão Total'] = parseFloat(commissionData.total.toFixed(2));
      
      return row;
    }));

    // Dados dos SDRs
    const sdrsData = sdrsOnly.map(sdr => {
      const sdrData = vendedores.find(v => v.id === sdr.id);
      const sdrNivel = sdrData?.nivel || 'junior';
      const sdrType = sdrData?.nivel?.includes('inbound') ? 'inbound' : 'outbound';
      
      // Montar o nível completo exatamente como está na tabela niveis_vendedores
      const nivelCompleto = `sdr_${sdrType}_${sdrNivel}`;
      const nivelConfig = niveis.find(n => n.nivel === nivelCompleto);
      
      // Buscar a meta correta baseada no nível do SDR (vendas de cursos)
      const metaSemanal = nivelConfig?.meta_vendas_cursos || 55;
      const metaMensal = metaSemanal * weeks.length;
      
      // Calcular reuniões por semana (usando dados já calculados)
      const reunioesPorSemana = weeks.map(week => sdr.reunioesSemana || 0);
      
      const totalReunioes = reunioesPorSemana.reduce((sum, reunioes) => sum + reunioes, 0);
      const achievementPercentage = metaMensal > 0 ? (totalReunioes / metaMensal) * 100 : 0;
      
      const row: any = {
        'SDR': sdr.name,
        'Tipo': sdrType === 'inbound' ? 'Inbound' : 'Outbound',
        'Nível': sdrNivel.charAt(0).toUpperCase() + sdrNivel.slice(1),
        'Meta Semanal': metaSemanal,
        'Comissão Semanal': `R$ ${(nivelConfig?.variavel_semanal || 0).toFixed(2)}`
      };
      
      // Adicionar colunas das semanas com reuniões e porcentagem
      for (let i = 0; i < reunioesPorSemana.length; i++) {
        const reunioes = reunioesPorSemana[i];
        const percentage = metaSemanal > 0 ? ((reunioes / metaSemanal) * 100).toFixed(1) : '0.0';
        
        row[`Semana ${weeks[i].week} (${weeks[i].label})`] = `${reunioes} Reuniões (${percentage}%)`;
      }
      
      // Adicionar colunas finais
      row['Total Reuniões'] = totalReunioes;
      row['Atingimento %'] = parseFloat(achievementPercentage.toFixed(1));
      
      return row;
    });
    
    const workbook = XLSX.utils.book_new();
    
    // Adicionar aba dos Vendedores
    const vendedoresWorksheet = XLSX.utils.json_to_sheet(vendedoresData);
    XLSX.utils.book_append_sheet(workbook, vendedoresWorksheet, 'Ranking Vendedores');
    
    // Adicionar aba dos SDRs
    if (sdrsData.length > 0) {
      const sdrsWorksheet = XLSX.utils.json_to_sheet(sdrsData);
      XLSX.utils.book_append_sheet(workbook, sdrsWorksheet, 'Ranking SDRs');
    }
    
    const fileName = `ranking-vendedores-sdrs-${mesAtualSelecionado.toLowerCase().replace(/\s+/g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-background overflow-hidden">
      {/* Background igual ao da tela de login */}
      <div className="absolute inset-0 bg-gradient-to-br from-ppgvet-teal/20 via-ppgvet-magenta/10 to-ppgvet-teal/30 dark:from-ppgvet-teal/10 dark:via-ppgvet-magenta/5 dark:to-ppgvet-teal/15">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ppgvet-teal/30 dark:bg-ppgvet-teal/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-ppgvet-magenta/20 dark:bg-ppgvet-magenta/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-ppgvet-teal/20 dark:bg-ppgvet-teal/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      {/* Header mais compacto */}
      <div className="relative z-10 flex justify-between items-center p-4 backdrop-blur-md border-b border-white/20">
        <h1 className="text-2xl font-bold text-foreground">Ranking de Vendas - TV</h1>
        <div className="flex gap-2">
          <Button
            onClick={exportToPDF}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button
            onClick={exportToSpreadsheet}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button 
            onClick={() => setZoom(Math.max(10, zoom - 10))} 
            variant="outline" 
            size="sm"
            disabled={zoom <= 10}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="flex items-center px-2 text-sm font-medium text-foreground">{zoom}%</span>
          <Button 
            onClick={() => setZoom(Math.min(200, zoom + 10))} 
            variant="outline" 
            size="sm"
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button onClick={toggleFullscreen} variant="outline" size="sm">
            {isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}
          </Button>
          <Button onClick={onClose} variant="outline" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div 
        className="relative z-10 p-4 min-h-[calc(100vh-80px)] origin-top-left transition-transform duration-300 overflow-hidden"
        style={{ 
          transform: `scale(${zoom / 100})`,
          width: `${10000 / zoom}%`,
          height: `${10000 / zoom}%`,
        }}
      >
        <div className="max-w-full mx-auto overflow-hidden">
          {/* SEÇÃO DOS VENDEDORES */}
          <div className="mb-8">
            {/* Grid de 5 colunas para vendedores */}
            <div className="grid grid-cols-5 gap-4">
              {/* Top 3 vendedores */}
              {topThreeVendedores.map((person, index) => (
                <VendedorCard
                  key={person.id}
                  person={person}
                  rank={index + 1}
                  isTopThree={true}
                />
              ))}
              
              {/* Card de vendas e reuniões no lugar do 4º card */}
              <div className="col-span-2">
                <VendasReunioesSummaryCard 
                  vendasSemana={totalVendasSemana}
                  vendasMes={totalVendasMes}
                  reunioesSemana={totalReunioesSemana}
                  reunioesMes={totalReunioesMes}
                />
              </div>
              
              {/* Resto dos vendedores a partir da segunda linha */}
              {remainingVendedores.map((person, index) => (
                <VendedorCard
                  key={person.id}
                  person={person}
                  rank={index + 4}
                  isTopThree={false}
                />
              ))}
            </div>
          </div>

          {/* SEÇÃO DOS SDRs - SEMPRE EMBAIXO E SEPARADA */}
          {sdrsOnly.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 text-center">SDR</h2>
              <div className="grid grid-cols-5 gap-4">
                {sdrsOnly.map((person, index) => (
                  <VendedorCard
                    key={person.id}
                    person={person}
                    rank={vendedoresOnly.length + index + 1}
                    isTopThree={false}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TVRankingDisplay;