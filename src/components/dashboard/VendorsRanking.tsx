
import React, { useState, useMemo } from 'react';
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
import { useNiveis } from '@/hooks/useNiveis';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import VendorWeeklyGoalsModal from './VendorWeeklyGoalsModal';
import TVRankingDisplay from './TVRankingDisplay';
import TestTVButton from '../debug/TestTVButton';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  const { currentUser, profile } = useAuthStore();
  
  // Estado interno para o filtro de mês (apenas quando não há filtro externo)
  const [internalSelectedMonth, setInternalSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Hook para metas semanais
  const currentMonth = propSelectedMonth || parseInt(internalSelectedMonth?.split('-')[1] || '1');
  const currentYear = propSelectedYear || parseInt(internalSelectedMonth?.split('-')[0] || '2025');
  const { metasSemanais, loading: metasSemanaisLoading } = useMetasSemanais();

  // Estado para modal de metas semanais
  const [selectedVendedorForGoals, setSelectedVendedorForGoals] = useState<{
    id: string;
    name: string;
    photo_url?: string;
  } | null>(null);

  // Estado para modo TV
  const [isTVMode, setIsTVMode] = useState(false);
  
  console.log('🔥 VendorsRanking - isTVMode atual:', isTVMode);
  
  // Usar filtro externo se disponível, senão usar interno
  const selectedMonth = propSelectedMonth && propSelectedYear 
    ? `${propSelectedYear}-${String(propSelectedMonth).padStart(2, '0')}`
    : internalSelectedMonth;

  const isLoading = vendasLoading || vendedoresLoading || metasLoading || niveisLoading;

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

  // Filtrar vendas por período e vendedor se especificados
  const vendasFiltradas = useMemo(() => {
    return vendas.filter(venda => {
      // Filtro por vendedor
      if (selectedVendedor && selectedVendedor !== 'todos' && venda.vendedor_id !== selectedVendedor) {
        return false;
      }
      
      // Filtro por período
      if ((propSelectedMonth && propSelectedYear) || internalSelectedMonth) {
        const dataVenda = new Date(venda.enviado_em);
        
        if (propSelectedMonth && propSelectedYear) {
          // Usar filtros externos do dashboard
          if (dataVenda.getMonth() + 1 !== propSelectedMonth || dataVenda.getFullYear() !== propSelectedYear) {
            return false;
          }
        } else {
          // Usar filtro interno mensal
          const vendaMonth = `${dataVenda.getFullYear()}-${String(dataVenda.getMonth() + 1).padStart(2, '0')}`;
          if (vendaMonth !== internalSelectedMonth) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [vendas, selectedVendedor, propSelectedMonth, propSelectedYear, internalSelectedMonth]);

  // Gerar lista de meses disponíveis
  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<string>();
    
    vendas.forEach(venda => {
      const vendaDate = new Date(venda.enviado_em);
      const mesAno = `${vendaDate.getFullYear()}-${String(vendaDate.getMonth() + 1).padStart(2, '0')}`;
      meses.add(mesAno);
    });

    // Adicionar mês atual se não existir
    const mesAtual = new Date();
    const mesAtualString = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
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
  }, [vendas]);

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
      acc[vendedorId].pontuacao += venda.pontuacao_esperada || 0;
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
      
      const vendaDate = new Date(venda.enviado_em);
      return vendaDate >= startOfWeek && vendaDate <= endOfWeek;
    });

    return {
      vendas: vendasSemanaAtual.length,
      pontos: vendasSemanaAtual.reduce((sum, venda) => sum + (venda.pontuacao_esperada || 0), 0)
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
    const nivelConfig = niveis.find(n => n.nivel === vendedorNivel);
    
    // Obter progresso da semana atual
    const progressoSemanaAtual = getCurrentWeekProgress(vendedor.id);
    const metaSemanal = nivelConfig?.meta_semanal_vendedor || 6;
    
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
      diaAtualNaSemana,
      vendasSemanais: vendasAprovadas, // Usar vendas da semana atual
      progressoSemanal: metaSemanal > 0 ? (pontuacaoAtual / metaSemanal) * 100 : 0,
      progressoDiario: metaDiariaRestante > 0 ? Math.min((pontuacaoAtual / (metaSemanal - metaDiariaRestante)) * 100, 100) : 100
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

  // Função para calcular pontos por semana do vendedor
  const getVendedorWeeklyPoints = (vendedorId: string, weeks: any[]) => {
    return weeks.map((week, index) => {
      const weekPoints = vendasFiltradas
        .filter(venda => {
          if (venda.vendedor_id !== vendedorId || venda.status !== 'matriculado') return false;
          
          const vendaDate = new Date(venda.enviado_em);
          const isInRange = vendaDate >= week.startDate && vendaDate <= week.endDate;
          
          // Debug específico para semana 3 e vendedor teste
          if (week.week === 3 && vendedorId) {
            console.log(`🔍 Semana 3 Debug - Vendedor: ${vendedorId}`);
            console.log(`📅 Período da semana: ${week.startDate.toISOString()} até ${week.endDate.toISOString()}`);
            console.log(`💰 Venda: ${venda.aluno?.nome}, Data: ${vendaDate.toISOString()}, InRange: ${isInRange}, Pontos: ${venda.pontuacao_validada || venda.pontuacao_esperada || 0}`);
          }
          
          return isInRange;
        })
        .reduce((sum, venda) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
      
      // Debug total da semana 3
      if (week.week === 3 && weekPoints > 0) {
        console.log(`📊 Semana 3 - Vendedor: ${vendedorId}, Total de pontos: ${weekPoints}`);
      }
      
      return weekPoints;
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
    const metaSemanal = nivelConfig?.meta_semanal_vendedor || 6;
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
    
    // Título
    doc.setFontSize(16);
    doc.text(`Ranking de Vendedores - ${mesAtualSelecionado}`, 20, 20);
    
    // Cabeçalhos da tabela
    const headers = [
      'Vendedor',
      'Nível',
      'Meta Semanal',
      'Salário Base',
      'Variável Semanal',
      ...weeks.map(w => `Semana ${w.week}\n${w.label}`),
      'Total Pontos',
      'Atingimento %',
      'Comissão Total'
    ];
    
    // Dados da tabela
    const data = await Promise.all(ranking.map(async vendedor => {
      const vendedorNivel = vendedores.find(v => v.id === vendedor.id)?.nivel || 'junior';
      const nivelConfig = niveis.find(n => n.nivel === vendedorNivel);
      const weeklyPoints = getVendedorWeeklyPoints(vendedor.id, weeks);
      const totalPoints = weeklyPoints.reduce((sum, points) => sum + points, 0);
      const metaMensal = (nivelConfig?.meta_semanal_vendedor || 6) * weeks.length;
      const achievementPercentage = metaMensal > 0 ? (totalPoints / metaMensal) * 100 : 0;
      const commissionData = await calculateTotalCommission(vendedor.id, weeks, nivelConfig);
      
      const weeklyCommissionStrings = await Promise.all(weeklyPoints.map(async (points, index) => {
        const metaSemanal = nivelConfig?.meta_semanal_vendedor || 6;
        const variavelSemanal = nivelConfig?.variavel_semanal || 0;
        const commission = await calculateWeeklyCommission(points, metaSemanal, variavelSemanal);
        const percentage = metaSemanal > 0 ? ((points / metaSemanal) * 100).toFixed(1) : '0.0';
        const valorFormatado = DataFormattingService.formatCurrency(commission.valor);
        return `${points.toFixed(1)}pts ${percentage}% (x${commission.multiplicador}) = ${valorFormatado}`;
      }));
      
      return [
        vendedor.nome,
        vendedorNivel.charAt(0).toUpperCase() + vendedorNivel.slice(1),
        nivelConfig?.meta_semanal_vendedor || 6,
        `R$ ${(nivelConfig?.fixo_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${(nivelConfig?.variavel_semanal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        ...weeklyCommissionStrings,
        totalPoints,
        `${achievementPercentage.toFixed(1)}%`,
        `R$ ${commissionData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ];
    }));
    
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 30,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30 }, // Vendedor
      },
      didDrawCell: (data) => {
        // Destacar células onde não bateu a meta
        if (data.column.index >= 4 && data.column.index < 4 + weeks.length) {
          const cellValue = data.cell.text[0];
          if (cellValue && cellValue.includes('Não bateu a meta')) {
            data.cell.styles.fillColor = [255, 200, 200]; // Vermelho claro
          }
        }
      }
    });
    
    doc.save(`ranking-vendedores-${mesAtualSelecionado.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  // Função para exportar Excel
  const exportToExcel = async () => {
    const weeks = getWeeksOfMonth(currentYear, currentMonth);
    
    const data = await Promise.all(ranking.map(async vendedor => {
      const vendedorNivel = vendedores.find(v => v.id === vendedor.id)?.nivel || 'junior';
      const nivelConfig = niveis.find(n => n.nivel === vendedorNivel);
      const weeklyPoints = getVendedorWeeklyPoints(vendedor.id, weeks);
      const totalPoints = weeklyPoints.reduce((sum, points) => sum + points, 0);
      const metaMensal = (nivelConfig?.meta_semanal_vendedor || 6) * weeks.length;
      const achievementPercentage = metaMensal > 0 ? (totalPoints / metaMensal) * 100 : 0;
      const commissionData = await calculateTotalCommission(vendedor.id, weeks, nivelConfig);
      
      const row: any = {
        'Vendedor': vendedor.nome,
        'Nível': vendedorNivel.charAt(0).toUpperCase() + vendedorNivel.slice(1),
        'Meta Semanal': nivelConfig?.meta_semanal_vendedor || 6,
        'Salário Base': nivelConfig?.fixo_mensal || 0,
        'Variável Semanal': nivelConfig?.variavel_semanal || 0
      };
      
      // Adicionar colunas das semanas com pontos, porcentagem, multiplicadores e valores
      for (let i = 0; i < weeklyPoints.length; i++) {
        const points = weeklyPoints[i];
        const metaSemanal = nivelConfig?.meta_semanal_vendedor || 6;
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
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ranking');
    
    XLSX.writeFile(workbook, `ranking-vendedores-${mesAtualSelecionado.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
  };

  return (
    <Card>
      {/* Componente de teste */}
      <TestTVButton />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              Ranking de Vendedores
            </CardTitle>
            <CardDescription>
              Todos os {ranking.length} vendedores por pontos - {mesAtualSelecionado}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botão TV movido para fora do CardTitle */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔥🔥🔥 BOTÃO TV CLICADO!!! Estado anterior:', isTVMode);
                setIsTVMode(true);
                console.log('🔥🔥🔥 Estado setado para TRUE');
              }}
              className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105 group"
              title="Exibir em tela cheia (Modo TV)"
            >
              <Tv className="h-5 w-5 group-hover:animate-pulse" />
            </button>
            {/* Botão de Exportar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportToPDF()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToExcel()}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Planilha
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Mostrar filtro de mês apenas se não houver filtros externos */}
            {!propSelectedMonth && !propSelectedYear && (
              <>
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={internalSelectedMonth} onValueChange={setInternalSelectedMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesDisponiveis.map((mes) => (
                      <SelectItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum vendedor encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 Vendedores */}
            {top3Vendedores.length > 0 && (
              <div className="bg-gradient-to-r from-ppgvet-teal/10 to-ppgvet-magenta/10 dark:from-ppgvet-teal/20 dark:to-ppgvet-magenta/20 border-2 border-ppgvet-teal/30 dark:border-ppgvet-teal/50 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-6 w-6 text-ppgvet-teal dark:text-ppgvet-teal" />
                  <h3 className="font-bold text-xl text-foreground">Top 3 Vendedores</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {top3Vendedores.map((vendedor, index) => {
                    const icons = [Trophy, Medal, Award];
                    const IconComponent = icons[index];
                    const colors = ['text-ppgvet-teal', 'text-muted-foreground', 'text-ppgvet-magenta'];
                    const bgColors = ['bg-ppgvet-teal/20 dark:bg-ppgvet-teal/30', 'bg-muted/30 dark:bg-muted/50', 'bg-ppgvet-magenta/20 dark:bg-ppgvet-magenta/30'];
                    const positions = ['#1', '#2', '#3'];
                    
                    return (
                      <div 
                        key={vendedor.id} 
                        className="bg-card dark:bg-card border border-border cursor-pointer hover:shadow-lg dark:hover:shadow-lg transition-shadow rounded-lg p-4"
                        onClick={() => setSelectedVendedorForGoals({
                          id: vendedor.id,
                          name: vendedor.nome,
                          photo_url: vendedor.photo_url
                        })}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`flex items-center justify-center w-10 h-10 ${bgColors[index]} rounded-full`}>
                            <IconComponent className={`h-5 w-5 ${colors[index]}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-foreground">{vendedor.nome}</h4>
                              <Badge className={`${index === 0 ? 'bg-ppgvet-teal' : index === 1 ? 'bg-muted-foreground' : 'bg-ppgvet-magenta'} text-white text-xs`}>
                                {positions[index]}
                              </Badge>
                            </div>
                            <Avatar className="h-12 w-12 mt-2 border-2 border-ppgvet-teal/50">
                              <AvatarImage src={vendedor.photo_url} alt={vendedor.nome} />
                              <AvatarFallback className="text-sm">
                                {vendedor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p className="font-bold text-ppgvet-magenta text-lg">
                            {DataFormattingService.formatPoints(vendedor.pontuacao)} pts
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Posição #{index + 1}
                          </p>
                        </div>
                        
                        {/* Mini barras para o top 3 */}
                        <div className="flex gap-2 mt-3">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-muted-foreground">Meta Semana</span>
                              <span className="text-xs text-muted-foreground">{DataFormattingService.formatPoints(vendedor.pontuacao)}/{vendedor.metaSemanal} pts</span>
                            </div>
                            <Progress value={Math.min(vendedor.progressoSemanal, 100)} className="h-1.5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-muted-foreground">Meta Dia</span>
                              <span className="text-xs text-muted-foreground">{DataFormattingService.formatPoints(vendedor.metaDiariaRestante)} pts/dia</span>
                            </div>
                            <Progress value={Math.min(vendedor.progressoDiario, 100)} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista do Ranking a partir do 4º lugar */}
            {rankingSemTop3.map((vendedor, index) => (
              <div 
                key={vendedor.id} 
                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/80 transition-colors"
                onClick={() => setSelectedVendedorForGoals({
                  id: vendedor.id,
                  name: vendedor.nome,
                  photo_url: vendedor.photo_url
                })}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-ppgvet-teal text-white rounded-full font-bold">
                    {index + 4}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={vendedor.photo_url} 
                      alt={vendedor.nome}
                    />
                    <AvatarFallback>
                      {vendedor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center justify-between flex-1">
                    <div>
                      <p className="font-medium">{vendedor.nome}</p>
                      <p className="text-sm text-ppgvet-magenta font-semibold">
                        {DataFormattingService.formatPoints(vendedor.pontuacao)} pontos
                      </p>
                    </div>
                    
                     {/* Mini barras de progresso ao lado */}
                     <div className="flex gap-4 ml-4">
                       <div className="w-24">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Meta Semana</span>
                            <span className="text-xs text-muted-foreground">{DataFormattingService.formatPoints(vendedor.pontuacao)}/{vendedor.metaSemanal} pts</span>
                          </div>
                         <Progress 
                           value={Math.min(vendedor.progressoSemanal, 100)} 
                           className="h-1.5"
                         />
                       </div>
                       <div className="w-24">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-muted-foreground">Meta Dia</span>
                              <span className="text-xs text-muted-foreground">{DataFormattingService.formatPoints(vendedor.metaDiariaRestante)} pts/dia</span>
                            </div>
                         <Progress 
                           value={Math.min(vendedor.progressoDiario, 100)} 
                           className="h-1.5"
                         />
                       </div>
                     </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">#{index + 4}º lugar</p>
                    <p className="font-bold text-ppgvet-magenta text-lg">{DataFormattingService.formatPoints(vendedor.pontuacao)} pts</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Modal de Metas Semanais */}
        <VendorWeeklyGoalsModal
          vendedorId={selectedVendedorForGoals?.id}
          vendedorNome={selectedVendedorForGoals?.name}
          vendedorPhoto={selectedVendedorForGoals?.photo_url}
          selectedMonth={propSelectedMonth || parseInt(selectedMonth.split('-')[1])}
          selectedYear={propSelectedYear || parseInt(selectedMonth.split('-')[0])}
          isOpen={!!selectedVendedorForGoals}
          onClose={() => setSelectedVendedorForGoals(null)}
        />

        {/* Componente de exibição TV */}
        <TVRankingDisplay 
          isOpen={isTVMode}
          onClose={() => {
            console.log('🔥 TVRankingDisplay onClose chamado');
            setIsTVMode(false);
          }}
        />

      </CardContent>
    </Card>
  );
};

export default VendorsRanking;
