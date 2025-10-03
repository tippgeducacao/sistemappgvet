
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Filter, Trophy, Medal, Award, Tv, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useAuthStore } from '@/stores/AuthStore';
import { ComissionamentoService } from '@/services/comissionamentoService';
import { useMetas } from '@/hooks/useMetas';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import { useNiveis } from '@/hooks/useNiveis';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useAgendamentosLeads } from '@/hooks/useAgendamentosLeads';
import { useAvaliacaoSemanal } from '@/hooks/useAvaliacaoSemanal';
import { useVendedoresWeeklyConversions } from '@/hooks/useVendedorConversion';
import { useCurrentWeekConversions } from '@/hooks/useWeeklyConversion';
import { useBatchWeeklyCommissions } from '@/hooks/useWeeklyCommission';
import html2canvas from 'html2canvas';
import { isVendaInPeriod, getVendaPeriod } from '@/utils/semanaUtils';
import { getDataEfetivaVenda, getVendaEffectivePeriod } from '@/utils/vendaDateUtils';
import VendorWeeklyGoalsModal from './VendorWeeklyGoalsModal';
import TVRankingDisplay from './TVRankingDisplay';
import SimpleSDRRanking from './SimpleSDRRanking';
import VendedorProfileModal from './VendedorProfileModal';
import VendedoresTableRow from './VendedoresTableRow';
import VendedorExportTableRow from './VendedorExportTableRow';
import SDRTableRow from './SDRTableRow';
import SupervisorTableRow, { SupervisorTableLegend } from './SupervisorTableRow';
import SupervisorMetaColetiva from './SupervisorMetaColetiva';
// Importação removida - fechamento automático por data
import { useMesFechado } from '@/hooks/useHistoricoMensal';
import { Archive, Calendar } from 'lucide-react';
import MonthYearSelector from '@/components/common/MonthYearSelector';


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useVendaWithFormResponses } from '@/hooks/useVendaWithFormResponses';

interface VendorsRankingProps {
  selectedVendedor?: string;
  selectedMonth?: number;
  selectedYear?: number;
}

const VendorsRanking: React.FC<VendorsRankingProps> = ({ selectedVendedor, selectedMonth: propSelectedMonth, selectedYear: propSelectedYear }) => {
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { vendedores, loading: vendedoresLoading } = useVendedores();
  const { metas, loading: metasLoading } = useMetas();
  const { niveis, loading: niveisLoading } = useNiveis();
  const { data: agendamentos } = useAgendamentosLeads();
  const { currentUser, profile } = useAuthStore();
  const { todasAvaliacoes } = useAvaliacaoSemanal();
  
  // Buscar respostas do formulário para usar data de matrícula
  const { vendasWithResponses, isLoading: isLoadingResponses } = useVendaWithFormResponses(vendas);
  
  // Estado interno para o filtro de mês (apenas quando não há filtro externo) - usar regra de semanas
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  const [internalSelectedMonth, setInternalSelectedMonth] = useState(() => {
    const { mes, ano } = getMesAnoSemanaAtual();
    return `${ano}-${String(mes).padStart(2, '0')}`;
  });
  
  // Debug effect para monitorar mudanças no estado
  useEffect(() => {
    console.log('🔄 internalSelectedMonth mudou:', internalSelectedMonth);
  }, [internalSelectedMonth]);
  
  // Hook para verificar se o mês está fechado
  const currentMonth = propSelectedMonth || parseInt(internalSelectedMonth?.split('-')[1] || '1');
  const currentYear = propSelectedYear || parseInt(internalSelectedMonth?.split('-')[0] || '2025');
  const { data: isMesFechado } = useMesFechado(currentYear, currentMonth);
  
  // Hook para metas semanais
  const { metasSemanais, loading: metasSemanaisLoading } = useMetasSemanais();

  // Estado para modal de metas semanais
  const [selectedVendedorForGoals, setSelectedVendedorForGoals] = useState<{
    id: string;
    name: string;
    photo_url?: string;
  } | null>(null);

  // Estado para modal de perfil do vendedor
  const [selectedVendedorForProfile, setSelectedVendedorForProfile] = useState<{
    id: string;
    nome: string;
    photo_url?: string;
    nivel?: string;
    user_type: string;
  } | null>(null);

  // Estado para modo TV
  const [isTVMode, setIsTVMode] = useState(false);
  
  console.log('🔥 VendorsRanking - isTVMode atual:', isTVMode);
  
  // Separar lógica: planilha detalhada sempre usa filtro interno
  const selectedMonth = internalSelectedMonth;
  
  // Para o ranking geral (não detalhado), usar props externos se disponíveis
  const rankingSelectedMonth = propSelectedMonth && propSelectedYear 
    ? `${propSelectedYear}-${String(propSelectedMonth).padStart(2, '0')}`
    : internalSelectedMonth;
  
  // Extrair mês e ano do selectedMonth para o filtro  
  const [selectedYearNum, selectedMonthNum] = selectedMonth.split('-').map(Number);
    
  console.log('📊 VendorsRanking Filtros:', { 
    propSelectedMonth, 
    propSelectedYear, 
    internalSelectedMonth, 
    selectedMonth,
    selectedYearNum,
    selectedMonthNum,
    selectedMonthNumType: typeof selectedMonthNum,
    selectedYearNumType: typeof selectedYearNum,
    isNaNMonth: isNaN(selectedMonthNum),
    isNaNYear: isNaN(selectedYearNum),
    totalVendas: vendas?.length || 0
  });

  const isLoading = vendasLoading || vendedoresLoading || metasLoading || niveisLoading;

  // Calcular conversões semanais atuais
  const vendedorIds = vendedores.filter(v => v.user_type === 'vendedor').map(v => v.id);
  const sdrIds = vendedores.filter(v => ['sdr'].includes(v.user_type)).map(v => v.id);
  
  const { data: vendedorConversions } = useCurrentWeekConversions(vendedorIds, 'vendedor');
  const { data: sdrConversions } = useCurrentWeekConversions(sdrIds, 'sdr');
  
  // Hook para comissionamentos em cache
  const todayDate = new Date();
  const currentYearForCommission = todayDate.getFullYear();
  const currentWeekForCommission = Math.ceil((todayDate.getTime() - new Date(currentYearForCommission, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  // Filtrar vendedores - apenas vendedores ativos e remover "Vendedor teste" exceto para admin específico
  const vendedoresFiltrados = useMemo(() => {
    const userEmail = profile?.email || currentUser?.email;
    const isSpecificAdmin = userEmail === 'wallasmonteiro019@gmail.com';
    
    return vendedores.filter(vendedor => {
      // Filtrar apenas vendedores (não mostrar admin, SDR etc)
      if (vendedor.user_type !== 'vendedor') {
        return false;
      }
      
      // Filtrar apenas vendedores ativos
      if (!vendedor.ativo) {
        return false;
      }
      
      // Se for o admin específico, mostrar todos os vendedores
      if (isSpecificAdmin) {
        return true;
      }
      
      // Para outros usuários, filtrar "Vendedor teste"
      return vendedor.name !== 'Vendedor teste';
    });
  }, [vendedores, profile?.email, currentUser?.email]);
  
  const vendedoresForCommission = vendedoresFiltrados.map(v => ({ id: v.id, type: 'vendedor' as const }));
  
  // Memoizar lista de supervisores para evitar mudanças no número de componentes renderizados
  const supervisoresFiltrados = useMemo(() => {
    const userEmail = profile?.email || currentUser?.email;
    const isSpecificAdmin = userEmail === 'wallasmonteiro019@gmail.com';
    
    return vendedores.filter(vendedor => {
      // Filtrar apenas supervisores
      if (vendedor.user_type !== 'supervisor') {
        return false;
      }
      
      // Filtrar apenas supervisores ativos
      if (!vendedor.ativo) {
        return false;
      }
      
      // Se for o admin específico, mostrar todos os supervisores
      if (isSpecificAdmin) {
        return true;
      }
      
      // Para outros usuários, filtrar "Vendedor teste"
      return vendedor.name !== 'Vendedor teste';
    });
  }, [vendedores, profile?.email, currentUser?.email]);
  
  const { data: weeklyCommissions, isLoading: commissionsLoading } = useBatchWeeklyCommissions(
    vendedoresForCommission,
    currentYearForCommission,
    currentWeekForCommission,
    vendedoresForCommission.length > 0
  );

  // Filtrar vendas por período e vendedor se especificados
  const vendasFiltradas = useMemo(() => {
    if (!vendasWithResponses || vendasWithResponses.length === 0) {
      return [];
    }
    
    return vendasWithResponses
      .filter(({ venda, respostas }) => {
        // Filtro por vendedor
        if (selectedVendedor && selectedVendedor !== 'todos' && venda.vendedor_id !== selectedVendedor) {
          return false;
        }
        
        // Filtro por período usando a regra de semana (quarta a terça)
        if ((propSelectedMonth && propSelectedYear) || internalSelectedMonth) {
          // PADRONIZADO: Usar função centralizada para obter data efetiva
          const dataEfetiva = getDataEfetivaVenda(venda, respostas);
          
          // Debug específico para Pedro Garbelini
          if (venda.id === '53af0209-9b2d-4b76-b6a2-2c9d8e4f7a8c' || 
              (venda.aluno && (venda.aluno.nome === 'Pedro Garbelini' || venda.aluno.nome?.includes('Pedro')))) {
            console.log(`🚨 PEDRO GARBELINI - VendorsRanking filtro:`, {
              venda_id: venda.id?.substring(0, 8),
              aluno: venda.aluno?.nome,
              data_efetiva: dataEfetiva.toISOString(),
              data_efetiva_br: dataEfetiva.toLocaleDateString('pt-BR'),
              data_assinatura_contrato: venda.data_assinatura_contrato,
              data_enviado: venda.enviado_em,
              status: venda.status
            });
          }
          
          // Debug detalhado para identificar inconsistências no dashboard geral
          if (venda.vendedor?.name === 'Adones' && venda.status === 'matriculado') {
            console.log(`🔍 DASHBOARD GERAL - Processando venda do Adones:`, {
              venda_id: venda.id.substring(0, 8),
              aluno: venda.aluno?.nome,
              status: venda.status,
              data_efetiva: dataEfetiva.toISOString(),
              data_efetiva_br: dataEfetiva.toLocaleDateString('pt-BR'),
              pontos: venda.pontuacao_validada || venda.pontuacao_esperada || 0,
              periodo_filtro: `${propSelectedMonth}/${propSelectedYear}`
            });
          }
          
          // Na planilha detalhada, sempre usar filtro interno se existe
          if (internalSelectedMonth) {
            // Usar filtro interno mensal com regra de semana
            const { mes: vendaMes, ano: vendaAno } = getVendaEffectivePeriod(venda, respostas);
            const filterMonth = parseInt(internalSelectedMonth.split('-')[1]);
            const filterYear = parseInt(internalSelectedMonth.split('-')[0]);
            
            console.log('🎯 Filtro detalhado:', {
              vendaMes, vendaAno,
              filterMonth, filterYear,
              dataEfetiva: dataEfetiva.toLocaleDateString('pt-BR'),
              match: vendaMes === filterMonth && vendaAno === filterYear
            });
            
            if (vendaMes !== filterMonth || vendaAno !== filterYear) {
              return false;
            }
          } else if (propSelectedMonth && propSelectedYear) {
            // Usar filtros externos do dashboard apenas se não há filtro interno
            if (!isVendaInPeriod(dataEfetiva, propSelectedMonth, propSelectedYear)) {
              return false;
            }
          }
        }
        
        return true;
      })
      .map(({ venda }) => venda); // Retornar apenas as vendas, não o objeto completo
  }, [vendasWithResponses, selectedVendedor, propSelectedMonth, propSelectedYear, internalSelectedMonth]);

  // Gerar lista de meses disponíveis usando a regra de semana
  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<string>();
    
    vendas.forEach(venda => {
      // PADRONIZADO: Usar função centralizada para obter data efetiva
      const dataEfetiva = getDataEfetivaVenda(venda);
      
      // Usar a regra de semana para categorizar o mês correto
      const { mes, ano } = getVendaEffectivePeriod(venda);
      const mesAno = `${ano}-${String(mes).padStart(2, '0')}`;
      meses.add(mesAno);
    });

    // Adicionar mês atual baseado na regra de semanas se não existir
    const { mes: mesAtualSemana, ano: anoAtualSemana } = getMesAnoSemanaAtual();
    const mesAtualString = `${anoAtualSemana}-${String(mesAtualSemana).padStart(2, '0')}`;
    meses.add(mesAtualString);

    return Array.from(meses)
      .sort((a, b) => b.localeCompare(a)) // Ordenar do mais recente para o mais antigo
      .map(mesAno => {
        const [ano, mes] = mesAno.split('-');
        const mesNome = new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        });
        return { value: mesAno, label: mesNome.charAt(0).toUpperCase() + mesNome.slice(1) };
      });
  }, [vendas, getMesAnoSemanaAtual]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Vendedores</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar vendas filtradas por vendedor - CONSIDERANDO APENAS VENDAS APROVADAS
  const vendedoresStats = vendasFiltradas.reduce((acc, venda) => {
    const vendedorId = venda.vendedor_id;
    const vendedorNome = venda.vendedor?.name || 'Vendedor não identificado';
    const vendedorPhoto = venda.vendedor?.photo_url || undefined;
    
    // APENAS contabilizar vendas aprovadas (matriculadas)
    if (venda.status === 'matriculado') {
      if (!acc[vendedorId]) {
        acc[vendedorId] = {
          id: vendedorId,
          nome: vendedorNome,
          photo_url: vendedorPhoto,
          vendas: 0,
          pontuacao: 0
        };
      }
      
      acc[vendedorId].vendas++;
      // Usar a pontuação real da venda (validada ou esperada)
      const pontuacaoVenda = venda.pontuacao_validada || venda.pontuacao_esperada || 0;
      acc[vendedorId].pontuacao += pontuacaoVenda;
    }
    
    return acc;
  }, {} as Record<string, { id: string; nome: string; photo_url?: string; vendas: number; pontuacao: number }>);

  // Função para calcular vendas semanais atuais (quarta a terça)
  const getCurrentWeekProgress = (vendedorId: string) => {
    const now = new Date();
    
    // Calcular início da semana atual (quarta-feira anterior ou atual)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay(); // 0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
    
    // Ajustar para quarta-feira (dia 3)
    let daysToWednesday;
    if (dayOfWeek >= 3) { // Quinta, sexta, sábado ou quarta
      daysToWednesday = dayOfWeek - 3;
    } else { // Domingo, segunda, terça
      daysToWednesday = dayOfWeek + 4; // Volta para quarta anterior
    }
    
    startOfWeek.setDate(now.getDate() - daysToWednesday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Final da semana é terça-feira
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // 6 dias depois (quarta + 6 = terça)
    endOfWeek.setHours(23, 59, 59, 999);

    const vendasSemanaAtual = vendas.filter(venda => {
      if (venda.vendedor_id !== vendedorId || venda.status !== 'matriculado') return false;
      
      // PADRONIZADO: Usar função centralizada para obter data efetiva
      const vendaDate = getDataEfetivaVenda(venda);
      return vendaDate >= startOfWeek && vendaDate <= endOfWeek;
    });

    return {
      vendas: vendasSemanaAtual.length,
      pontos: vendasSemanaAtual.reduce((sum, venda) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0)
    };
  };


  // Função para calcular qual dia da semana estamos na semana de trabalho (1=quarta, 7=terça)
  const getCurrentWorkDay = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
    
    // Mapear para nosso sistema de trabalho (quarta=1, terça=7)
    if (dayOfWeek === 3) return 1; // Quarta
    if (dayOfWeek === 4) return 2; // Quinta  
    if (dayOfWeek === 5) return 3; // Sexta
    if (dayOfWeek === 6) return 4; // Sábado
    if (dayOfWeek === 0) return 5; // Domingo
    if (dayOfWeek === 1) return 6; // Segunda
    if (dayOfWeek === 2) return 7; // Terça
    return 1; // Fallback
  };

  // Função para calcular meta diária dinâmica
  const calculateDynamicDailyGoal = (metaSemanal: number, pontosAtual: number) => {
    // Se já bateu a meta, meta diária = 0
    if (pontosAtual >= metaSemanal) {
      return 0;
    }
    
    const pontosRestantes = Math.max(0, metaSemanal - pontosAtual);
    const diaAtual = getCurrentWorkDay(); // 1=quarta, 7=terça
    const diasRestantes = Math.max(1, 8 - diaAtual); // Quantos dias restam (não incluindo hoje)
    
    return pontosRestantes / diasRestantes;
  };

  // Incluir TODOS os vendedores filtrados, mesmo os que não fizeram vendas
  const todosVendedoresStats = vendedoresFiltrados.map(vendedor => {
    const [year, monthStr] = selectedMonth.split('-');
    const currentYear = parseInt(year);
    const currentMonth = parseInt(monthStr);
    
    // Buscar meta semanal baseada no nível do vendedor
    const vendedorNivel = vendedores.find(v => v.id === vendedor.id)?.nivel || 'junior';
    const nivelConfig = niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === 'vendedor');
    
    // Obter progresso da semana atual
    const progressoSemanaAtual = getCurrentWeekProgress(vendedor.id);
    const metaSemanal = nivelConfig?.meta_semanal_vendedor || 7;
    
    // Buscar taxa de conversão semanal atual
    const conversaoData = vendedorConversions?.find(c => 'vendedorId' in c && c.vendedorId === vendedor.id);
    const taxaConversao = conversaoData?.taxaConversao || 0;
    
    // Buscar comissionamento da semana atual do cache
    const weeklyCommission = weeklyCommissions?.find(c => c.user_id === vendedor.id);
    const multiplicadorAtual = weeklyCommission?.multiplicador || 0;
    const valorComissao = weeklyCommission?.valor || 0;
    
    // Calcular meta diária dinâmica baseada no progresso da semana atual
    const metaDiariaRestante = calculateDynamicDailyGoal(metaSemanal, progressoSemanaAtual.pontos);
    
    // Usar dados da semana atual para o ranking
    const vendasAprovadas = progressoSemanaAtual.vendas;
    const pontuacaoAtual = progressoSemanaAtual.pontos;
    const diaAtualNaSemana = getCurrentWorkDay();
    
    return {
      id: vendedor.id,
      nome: vendedor.name,
      photo_url: vendedor.photo_url,
      vendas: vendasAprovadas,
      pontuacao: pontuacaoAtual,
      metaSemanal,
      metaDiariaRestante,
      multiplicadorAtual,
      valorComissao,
      diaAtualNaSemana,
      vendasSemanais: vendasAprovadas, // Usar vendas da semana atual
      progressoSemanal: metaSemanal > 0 ? (pontuacaoAtual / metaSemanal) * 100 : 0,
      progressoDiario: metaDiariaRestante > 0 ? Math.min((pontuacaoAtual / (metaSemanal - metaDiariaRestante)) * 100, 100) : 100,
      taxaConversao // Adicionar taxa de conversão
    };
  });

  // Ranking ordenado por PONTOS - TODOS os vendedores
  const ranking = todosVendedoresStats
    .sort((a, b) => {
      // Primeira regra: Maior pontuação
      if (a.pontuacao !== b.pontuacao) {
        return b.pontuacao - a.pontuacao; // Mais pontos primeiro
      }
      
      // Se têm a mesma pontuação, ordenar por número de vendas
      if (a.vendas !== b.vendas) {
        return b.vendas - a.vendas; // Mais vendas como critério de desempate
      }
      
      // Se tudo igual, ordenar por nome
      return a.nome.localeCompare(b.nome);
    });

  // Obter nome do mês selecionado
  const mesAtualSelecionado = propSelectedMonth && propSelectedYear 
    ? `${new Date(propSelectedYear, propSelectedMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`.charAt(0).toUpperCase() + `${new Date(propSelectedYear, propSelectedMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`.slice(1)
    : mesesDisponiveis.find(m => m.value === selectedMonth)?.label || 'Mês atual';

  // Top 3 vendedores
  const top3Vendedores = ranking.slice(0, 3);
  
  // Lista do ranking sem o top 3 (para não duplicar)
  const rankingSemTop3 = ranking.slice(3);

  // Função para calcular as semanas do mês com datas
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


  // Função para calcular pontos por semana do vendedor (usando a MESMA lógica do dashboard pessoal)
  const getVendedorWeeklyPoints = (vendedorId: string, weeks: any[]) => {
    return weeks.map((week, index) => {
      // Usar vendasWithResponses diretamente como no dashboard pessoal
      const pontosDaSemana = vendasWithResponses.filter(({ venda, respostas }) => {
        if (venda.vendedor_id !== vendedorId) return false;
        if (venda.status !== 'matriculado') return false;
        
        // PADRONIZADO: Usar função centralizada
        const respostasVenda = vendasWithResponses.find(({ venda: v }) => v.id === venda.id);
        const dataVenda = getDataEfetivaVenda(venda, respostasVenda?.respostas);
        
        // Usar o período do filtro selecionado em vez do atual
        const filterMonth = parseInt(selectedMonth.split('-')[1]);
        const filterYear = parseInt(selectedMonth.split('-')[0]);
        
        // Aplicar a mesma lógica de validação de período do filtro
        const vendaPeriod = getVendaPeriod(dataVenda);
        const periodoCorreto = vendaPeriod.mes === filterMonth && vendaPeriod.ano === filterYear;
        
        // Verificar se está na semana específica
        dataVenda.setHours(0, 0, 0, 0);
        const startSemanaUTC = new Date(week.startDate);
        startSemanaUTC.setHours(0, 0, 0, 0);
        const endSemanaUTC = new Date(week.endDate);
        endSemanaUTC.setHours(23, 59, 59, 999);
        const isInRange = dataVenda >= startSemanaUTC && dataVenda <= endSemanaUTC;
        
        return periodoCorreto && isInRange;
      }).reduce((sum, { venda }) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
      
      return pontosDaSemana;
    });
  };

  // Função para calcular comissão POR SEMANA usando as regras de comissionamento
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

  // Função para calcular comissão total (apenas soma das comissões semanais variáveis)
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

  // Função para exportar PDF
  const exportToPDF = async () => {
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
    const vendedoresTableData = await Promise.all(ranking.map(async vendedor => {
      const vendedorNivel = vendedores.find(v => v.id === vendedor.id)?.nivel || 'junior';
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
        const valorFormatado = DataFormattingService.formatCurrency(commission.valor);
        return `${points.toFixed(1)}pts ${percentage}% (x${commission.multiplicador}) = ${valorFormatado}`;
      }));
      
      return [
        vendedor.nome,
        vendedorNivel.charAt(0).toUpperCase() + vendedorNivel.slice(1),
        nivelConfig?.meta_semanal_vendedor || 7,
        DataFormattingService.formatCurrency(nivelConfig?.variavel_semanal || 0),
        ...weeklyCommissionStrings,
        totalPoints,
        `${achievementPercentage.toFixed(1)}%`,
        `R$ ${commissionData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
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
    const sdrsVendedores = vendedores.filter(v => {
      const isSDRByType = v.user_type === 'sdr';
      const isSDRByNivel = v.nivel && (
        v.user_type === 'sdr' ||
        v.nivel.includes('inbound') || 
        v.nivel.includes('outbound')
      );
      return isSDRByType || isSDRByNivel;
    });

    if (sdrsVendedores.length > 0) {
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
      const sdrsTableData = await Promise.all(sdrsVendedores.map(async (sdr) => {
        const sdrNivel = sdr.nivel || 'junior';
        const nivelConfig = niveis.find(n => n.tipo_usuario === 'sdr' && n.nivel === sdrNivel);
        
        // Para SDRs, usar meta_vendas_cursos como meta semanal
        const metaSemanal = nivelConfig?.meta_vendas_cursos ?? 8;
        const metaMensal = metaSemanal * weeks.length;
        const variavelSemanal = Number(nivelConfig?.variavel_semanal || 0);
        
        // Calcular reuniões por semana
        const reunioesPorSemana = weeks.map(week => {
          const startDate = new Date(week.startDate);
          const endDate = new Date(week.endDate);
          
          const reunioesNaSemana = agendamentos?.filter(agendamento => {
            if (agendamento.sdr_id !== sdr.id) return false;
            // Contar apenas reuniões com comparecimento confirmado
            const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                              agendamento.resultado_reuniao === 'comprou';
            if (!compareceu) return false;
            const dataAgendamento = new Date(agendamento.data_agendamento);
            return dataAgendamento >= startDate && dataAgendamento <= endDate;
          }) || [];
          
          return reunioesNaSemana.length;
        });
        
        const totalReunioes = reunioesPorSemana.reduce((sum, reunioes) => sum + reunioes, 0);
        const achievementPercentage = metaMensal > 0 ? (totalReunioes / metaMensal) * 100 : 0;
        
        // Comissão por semana usando regras do tipo de SDR correspondente
        const weeklyCommissions = await Promise.all(
          reunioesPorSemana.map(reunioes => 
            ComissionamentoService.calcularComissao(reunioes, metaSemanal, variavelSemanal, 'sdr')
          )
        );
        const totalCommission = weeklyCommissions.reduce((sum, c) => sum + c.valor, 0);
        
        const weeklyMeetingsStrings = reunioesPorSemana.map((reunioes, index) => {
          const percentage = metaSemanal > 0 ? ((reunioes / metaSemanal) * 100).toFixed(1) : '0.0';
          const commission = weeklyCommissions[index];
          const valorFormatado = DataFormattingService.formatCurrency(commission.valor);
          return `${reunioes} Reuniões (${percentage}%) (x${commission.multiplicador}) = ${valorFormatado}`;
        });
        
        return [
          sdr.name,
          'SDR',
          sdrNivel.charAt(0).toUpperCase() + sdrNivel.slice(1),
          metaSemanal,
          DataFormattingService.formatCurrency(variavelSemanal),
          ...weeklyMeetingsStrings,
          totalReunioes,
          `${achievementPercentage.toFixed(1)}%`,
          DataFormattingService.formatCurrency(totalCommission)
        ];
      }));

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

  // Função para exportar Excel
  const exportToExcel = async () => {
    console.log('🚀 Iniciando exportação...');
    console.log('📊 Dados disponíveis:', { 
      ranking: ranking.length, 
      vendedores: vendedores.length, 
      agendamentos: agendamentos?.length || 0 
    });
    
    const weeks = getWeeksOfMonth(currentYear, currentMonth);
    
    // Dados dos Vendedores
    const vendedoresData = await Promise.all(ranking.map(async vendedor => {
      const vendedorNivel = vendedores.find(v => v.id === vendedor.id)?.nivel || 'junior';
      const nivelConfig = niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === 'vendedor');
      const weeklyPoints = getVendedorWeeklyPoints(vendedor.id, weeks);
      const totalPoints = weeklyPoints.reduce((sum, points) => sum + points, 0);
      const metaMensal = (nivelConfig?.meta_semanal_vendedor || 7) * weeks.length;
      const achievementPercentage = metaMensal > 0 ? (totalPoints / metaMensal) * 100 : 0;
      const commissionData = await calculateTotalCommission(vendedor.id, weeks, nivelConfig);
      
      const row: any = {
        'Vendedor': vendedor.nome,
        'Nível': vendedorNivel.charAt(0).toUpperCase() + vendedorNivel.slice(1),
        'Meta Semanal': nivelConfig?.meta_semanal_vendedor || 7,
        'Comissão Semanal': DataFormattingService.formatCurrency(nivelConfig?.variavel_semanal || 0)
      };
      
      // Adicionar colunas das semanas com pontos, porcentagem, multiplicadores e valores
      for (let i = 0; i < weeklyPoints.length; i++) {
        const points = weeklyPoints[i];
        const metaSemanal = nivelConfig?.meta_semanal_vendedor || 7;
        const variavelSemanal = nivelConfig?.variavel_semanal || 0;
        const commission = await calculateWeeklyCommission(points, metaSemanal, variavelSemanal);
        const percentage = metaSemanal > 0 ? ((points / metaSemanal) * 100).toFixed(1) : '0.0';
        const valorFormatado = DataFormattingService.formatCurrency(commission.valor);
        
        row[`Semana ${weeks[i].week} (${weeks[i].label})`] = `${points.toFixed(1)}pts ${percentage}% (x${commission.multiplicador}) = ${valorFormatado}`;
      }
      
      // Adicionar colunas finais na ordem correta
      row['Total Pontos'] = totalPoints;
      row['Atingimento %'] = parseFloat(achievementPercentage.toFixed(1));
      row['Comissão Total'] = parseFloat(commissionData.total.toFixed(2));
      
      return row;
    }));

    // Dados dos SDRs - buscar apenas usuários com user_type de SDR
    const sdrsVendedores = vendedores.filter(v => {
      return v.user_type === 'sdr';
    });
    console.log('👥 SDRs encontrados:', sdrsVendedores.length, sdrsVendedores.map(s => ({ 
      name: s.name, 
      type: s.user_type, 
      nivel: s.nivel 
    })));
    console.log('📊 Níveis disponíveis para SDRs:', niveis.filter(n => n.nivel.includes('sdr')).map(n => ({
      nivel: n.nivel,
      meta_inbound: n.meta_semanal_inbound
    })));
    console.log('📅 Total de agendamentos disponíveis:', agendamentos?.length || 0);
    console.log('📋 Agendamentos com resultado:', agendamentos?.filter(a => a.resultado_reuniao).length || 0);
    
    const sdrsData = sdrsVendedores.map(sdr => {
      const sdrNivel = sdr.nivel || 'junior';
      const nivelConfig = niveis.find(n => n.tipo_usuario === 'sdr' && n.nivel === sdrNivel);
      
      // Para SDRs, usar meta_vendas_cursos como meta semanal
      const metaSemanal = nivelConfig?.meta_vendas_cursos || 8;
      
      const metaMensal = metaSemanal * weeks.length;
      
      // Calcular reuniões agendadas por semana
      const reunioesPorSemana = weeks.map(week => {
        const startDate = new Date(week.startDate);
        const endDate = new Date(week.endDate);
        
        const reunioesNaSemana = agendamentos?.filter(agendamento => {
          if (agendamento.sdr_id !== sdr.id) return false;
          
          // Contar apenas reuniões onde houve comparecimento confirmado
          const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                            agendamento.resultado_reuniao === 'comprou';
          if (!compareceu) {
            console.log(`🚫 ${sdr.name}: Rejeitado - resultado: ${agendamento.resultado_reuniao}`);
            return false;
          }
          
          const dataAgendamento = new Date(agendamento.data_agendamento);
          const dentroDaSemana = dataAgendamento >= startDate && dataAgendamento <= endDate;
          
          if (dentroDaSemana) {
            console.log(`✅ ${sdr.name} - VÁLIDO: resultado=${agendamento.resultado_reuniao}, data=${dataAgendamento.toLocaleDateString()}`);
          }
          
          return dentroDaSemana;
        }) || [];
        
        console.log(`📅 Semana ${week.week} ${sdr.name}: ${reunioesNaSemana.length} Reuniões validadas`);
        return reunioesNaSemana.length;
      });
      
      const totalReunioes = reunioesPorSemana.reduce((sum, reunioes) => sum + reunioes, 0);
      const achievementPercentage = metaMensal > 0 ? (totalReunioes / metaMensal) * 100 : 0;
      
      console.log(`📈 ${sdr.name}: Total Reuniões=${totalReunioes}, Meta mensal=${metaMensal}, Atingimento=${achievementPercentage.toFixed(1)}%`);
      
      const row: any = {
        'SDR': sdr.name,
        'Tipo': 'SDR',
        'Nível': sdrNivel.charAt(0).toUpperCase() + sdrNivel.slice(1),
        'Meta Semanal': metaSemanal,
        'Comissão Semanal': DataFormattingService.formatCurrency(nivelConfig?.variavel_semanal || 0)
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
    
    console.log('📋 Dados dos SDRs processados:', sdrsData.length);
    
    const workbook = XLSX.utils.book_new();
    
    // Adicionar aba dos Vendedores
    console.log('📊 Criando aba de vendedores com', vendedoresData.length, 'registros');
    const vendedoresWorksheet = XLSX.utils.json_to_sheet(vendedoresData);
    XLSX.utils.book_append_sheet(workbook, vendedoresWorksheet, 'Ranking Vendedores');
    
    // Adicionar aba dos SDRs
    if (sdrsData.length > 0) {
      console.log('📊 Criando aba de SDRs com', sdrsData.length, 'registros');
      const sdrsWorksheet = XLSX.utils.json_to_sheet(sdrsData);
      XLSX.utils.book_append_sheet(workbook, sdrsWorksheet, 'Ranking SDRs');
    } else {
      console.log('⚠️ Nenhum SDR encontrado, não criando aba de SDRs');
    }
    
    const fileName = `ranking-vendedores-sdrs-${mesAtualSelecionado.toLowerCase().replace(/\s+/g, '-')}.xlsx`;
    console.log('💾 Salvando arquivo:', fileName);
    XLSX.writeFile(workbook, fileName);
    console.log('✅ Exportação concluída!');
  };

  // Função para exportar a planilha detalhada como screenshot PDF
  const exportDetailedToPDF = async () => {
    console.log('🚀 Iniciando exportação PDF...');
    
    try {
      // Encontrar o elemento da planilha detalhada
      const element = document.querySelector('[data-detailed-spreadsheet]') as HTMLElement;
      
      if (!element) {
        console.error('❌ Elemento da planilha não encontrado');
        alert('Erro: Elemento da planilha não encontrado para exportação');
        return;
      }

      console.log('✅ Elemento encontrado:', element);
      console.log('📏 Dimensões do elemento:', {
        width: element.scrollWidth,
        height: element.scrollHeight,
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight
      });

      // Capturar screenshot do elemento
      console.log('📸 Capturando screenshot...');
      const canvas = await html2canvas(element, {
        scale: 2, // Melhor qualidade
        useCORS: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      console.log('✅ Screenshot capturado:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      });

      // Criar PDF com as dimensões da captura
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      console.log('📄 PDF criado com orientação:', canvas.width > canvas.height ? 'landscape' : 'portrait');

      // Adicionar a imagem ao PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

      // Salvar o PDF
      const fileName = `planilha-detalhada-${mesAtualSelecionado.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      console.log('💾 Salvando PDF:', fileName);
      pdf.save(fileName);
      
      console.log('✅ PDF exportado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error);
      alert(`Erro ao exportar PDF: ${error}`);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Filtro de Mês/Ano */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Planilha Detalhada</h2>
          <div className="flex gap-2 items-center">
            <MonthYearSelector
              selectedMonth={selectedMonthNum}
              selectedYear={selectedYearNum}
              onMonthChange={(month) => {
                // Sempre permitir alteração do filtro interno da planilha detalhada
                const currentYear = selectedMonth.split('-')[0];
                const newSelectedMonth = month === 0 
                  ? (() => {
                      const { mes, ano } = getMesAnoSemanaAtual();
                      return `${ano}-${String(mes).padStart(2, '0')}`;
                    })()
                  : `${currentYear}-${String(month).padStart(2, '0')}`;
                
                console.log('🔄 Mudando mês:', { month, newSelectedMonth, currentYear, beforeUpdate: internalSelectedMonth });
                setInternalSelectedMonth(newSelectedMonth);
                console.log('🔄 Após mudança:', { afterUpdate: newSelectedMonth });
              }}
              onYearChange={(year) => {
                // Sempre permitir alteração do filtro interno da planilha detalhada
                const currentMonth = selectedMonth.split('-')[1];
                const newSelectedMonth = `${year}-${currentMonth}`;
                
                console.log('🔄 Mudando ano:', { year, newSelectedMonth, currentMonth });
                setInternalSelectedMonth(newSelectedMonth);
              }}
              showAll={false}
            />
            <Button
              onClick={exportDetailedToPDF}
              variant="outline"
              size="sm"
              className="ml-2 bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 hover:from-red-600 hover:to-red-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Planilha Detalhada - Debug */}
        {(() => {
          console.log('🔍 DEBUG Planilha:');
          console.log('- vendedoresFiltrados.length:', vendedoresFiltrados.length);
          console.log('- vendedoresFiltrados:', vendedoresFiltrados.map(v => ({ id: v.id, name: v.name, user_type: v.user_type })));
          console.log('- SDRs count:', vendedores.filter(v => v.user_type === 'sdr').length);
          console.log('- SDRs:', vendedores.filter(v => v.user_type === 'sdr').map(v => ({ id: v.id, name: v.name, user_type: v.user_type })));
          console.log('- Condição planilha:', vendedoresFiltrados.length > 0 || vendedores.filter(v => v.user_type === 'sdr').length > 0);
          return null;
        })()}
        
        <div className="mt-8" data-detailed-spreadsheet>
          
          {/* Tabela de Vendedores */}
          {vendedoresFiltrados.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Vendedores</h3>
              <div className="overflow-x-auto bg-card/50 backdrop-blur-sm rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left font-semibold">Vendedor</th>
                      <th className="p-2 text-left font-semibold">Nível</th>
                      <th className="p-2 text-left font-semibold">Meta Semanal</th>
                      <th className="p-2 text-left font-semibold">Comissão Semanal</th>
                      {getWeeksOfMonth(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1])).map(week => (
                        <th key={week.week} className="p-2 text-left font-semibold text-xs">
                          Semana {week.week}<br />
                          <span className="text-xs opacity-70">{week.label}</span>
                        </th>
                      ))}
                      <th className="p-2 text-left font-semibold">Total Pontos</th>
                      <th className="p-2 text-left font-semibold">Atingimento %</th>
                      <th className="p-2 text-left font-semibold">Comissão Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendedoresFiltrados.map((vendedor, index) => (
                      <VendedorExportTableRow
                        key={vendedor.id}
                        vendedor={vendedor}
                        index={index}
                        vendedores={vendedores}
                        niveis={niveis}
                        selectedMonth={selectedMonth}
                        getVendedorWeeklyPoints={getVendedorWeeklyPoints}
                        getWeeksOfMonth={getWeeksOfMonth}
                        calculateWeeklyCommission={calculateWeeklyCommission}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela de SDRs */}
          {vendedores.filter(v => v.user_type === 'sdr').length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">SDRs</h3>
              <div className="overflow-x-auto bg-card/50 backdrop-blur-sm rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left font-semibold">SDR</th>
                      <th className="p-2 text-left font-semibold">Tipo</th>
                      <th className="p-2 text-left font-semibold">Nível</th>
                      <th className="p-2 text-left font-semibold">Meta Semanal</th>
                      <th className="p-2 text-left font-semibold">Comissão Semanal</th>
                      {getWeeksOfMonth(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1])).map(week => (
                        <th key={week.week} className="p-2 text-left font-semibold text-xs">
                          Semana {week.week}<br />
                          <span className="text-xs opacity-70">{week.label}</span>
                        </th>
                      ))}
                      <th className="p-2 text-left font-semibold">Total Reuniões</th>
                      <th className="p-2 text-left font-semibold">Atingimento %</th>
                      <th className="p-2 text-left font-semibold">Comissão Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendedores.filter(v => v.user_type === 'sdr').map((sdr, index) => {
                      const weeks = getWeeksOfMonth(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]));
                      const startOfMonth = weeks[0]?.startDate ? new Date(weeks[0].startDate) : null;
                      const endOfMonth = weeks[weeks.length - 1]?.endDate ? new Date(weeks[weeks.length - 1].endDate) : null;
                      
                      // Filtrar agendamentos apenas do período atual
                      const agendamentosFiltrados = agendamentos?.filter(agendamento => {
                        if (!startOfMonth || !endOfMonth) return false;
                        const dataAgendamento = new Date(agendamento.data_agendamento);
                        return dataAgendamento >= startOfMonth && dataAgendamento <= endOfMonth;
                      });
                      
                      console.log(`🔍 ${sdr.name} - Agendamentos filtrados: ${agendamentosFiltrados?.length || 0} de ${agendamentos?.length || 0} total`);
                      
                      return (
                        <SDRTableRow
                          key={sdr.id}
                          sdr={sdr}
                          index={index}
                          weeks={weeks}
                          agendamentos={agendamentosFiltrados}
                          niveis={niveis}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela de Supervisores */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Supervisores</h3>
            <div className="overflow-x-auto bg-card/50 backdrop-blur-sm rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left font-semibold">Supervisor</th>
                    <th className="p-2 text-left font-semibold">Nível</th>
                    <th className="p-2 text-left font-semibold">Meta Coletiva</th>
                    <th className="p-2 text-left font-semibold">Variável Semanal</th>
                    {getWeeksOfMonth(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1])).map(week => (
                      <th key={week.week} className="p-2 text-left font-semibold text-xs">
                        Semana {week.week}<br />
                        <span className="text-xs opacity-70">{week.label}</span>
                      </th>
                    ))}
                    <th className="p-2 text-left font-semibold">Atingimento % Médio</th>
                    <th className="p-2 text-left font-semibold">Comissão Total</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisoresFiltrados.map((supervisor, index) => {
                    const weeks = getWeeksOfMonth(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]));
                    return (
                      <SupervisorTableRow
                        key={supervisor.id}
                        supervisor={supervisor}
                        index={index}
                        weeks={weeks}
                        niveis={niveis}
                      />
                    );
                  })}
                </tbody>
              </table>
              {/* Legenda para supervisores */}
              {supervisoresFiltrados.length > 0 && <SupervisorTableLegend />}
            </div>
          </div>

          {/* Meta Coletiva - Supervisor */}
          {supervisoresFiltrados.map(supervisor => (
            <SupervisorMetaColetiva
              key={supervisor.id}
              supervisorId={supervisor.id}
              supervisorName={supervisor.name}
              selectedMonth={selectedMonth}
              getWeeksOfMonth={getWeeksOfMonth}
            />
          ))}
        </div>

      </CardContent>
    </Card>
  );
};

export default VendorsRanking;
