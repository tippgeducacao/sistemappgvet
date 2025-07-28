import { useState, useMemo } from 'react';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';

export interface SDRHistoryData {
  sdrId: string;
  sdrName: string;
  periodo: string; // "2025-01" para mês, "2025-W01" para semana, "2025" para ano
  pontosVendas: number;
  vendas: Array<{
    id: string;
    alunoNome: string;
    curso: string;
    data: string;
    pontos: number;
  }>;
}

export const useSDRHistory = () => {
  const { vendas } = useAllVendas();
  const { vendedores } = useVendedores();
  const [selectedSDR, setSelectedSDR] = useState<string>('');
  const [selectedPeriodType, setSelectedPeriodType] = useState<'semana' | 'mes' | 'ano'>('mes');

  // Filtrar apenas SDRs
  const sdrs = useMemo(() => {
    return vendedores.filter(v => 
      (v.user_type === 'sdr_inbound' || v.user_type === 'sdr_outbound') && 
      v.ativo
    );
  }, [vendedores]);

  // Função para obter o número da semana do ano
  const getWeekOfYear = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  };

  // Função para formatar período baseado no tipo
  const formatPeriod = (date: Date, type: 'semana' | 'mes' | 'ano') => {
    switch (type) {
      case 'semana':
        const week = getWeekOfYear(date);
        return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
      case 'mes':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'ano':
        return date.getFullYear().toString();
      default:
        return date.toISOString().slice(0, 7);
    }
  };

  // Função para formatar período para exibição
  const formatPeriodLabel = (periodo: string, type: 'semana' | 'mes' | 'ano') => {
    switch (type) {
      case 'semana':
        const [year, week] = periodo.split('-W');
        return `Semana ${week}/${year}`;
      case 'mes':
        const [yearStr, monthStr] = periodo.split('-');
        const monthNames = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return `${monthNames[parseInt(monthStr) - 1]} ${yearStr}`;
      case 'ano':
        return periodo;
      default:
        return periodo;
    }
  };

  // Calcular histórico de pontuação
  const historyData = useMemo(() => {
    if (!selectedSDR) return [];

    // Filtrar vendas do SDR selecionado (apenas cursos matriculados)
    const sdrVendas = vendas.filter(v => 
      v.vendedor_id === selectedSDR && 
      v.status === 'matriculado'
    );

    // Agrupar por período
    const groupedByPeriod = sdrVendas.reduce((acc, venda) => {
      const dataVenda = new Date(venda.enviado_em);
      const periodo = formatPeriod(dataVenda, selectedPeriodType);

      if (!acc[periodo]) {
        acc[periodo] = [];
      }

      acc[periodo].push({
        id: venda.id,
        alunoNome: venda.aluno?.nome || 'Nome não informado',
        curso: venda.curso?.nome || 'Curso não informado',
        data: venda.enviado_em,
        pontos: 1 // Cada curso = 1 ponto para SDR
      });

      return acc;
    }, {} as Record<string, any[]>);

    // Converter para array e ordenar por período (mais recente primeiro)
    const sdr = sdrs.find(s => s.id === selectedSDR);
    const sdrName = sdr?.name || 'SDR não encontrado';

    return Object.entries(groupedByPeriod)
      .map(([periodo, vendasDoPeriodo]) => ({
        sdrId: selectedSDR,
        sdrName,
        periodo,
        pontosVendas: vendasDoPeriodo.length, // Total de vendas = total de pontos
        vendas: vendasDoPeriodo.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      }))
      .sort((a, b) => b.periodo.localeCompare(a.periodo));
  }, [selectedSDR, selectedPeriodType, vendas, sdrs]);

  // Estatísticas gerais
  const statistics = useMemo(() => {
    if (!historyData.length) return null;

    const totalPontos = historyData.reduce((sum, period) => sum + period.pontosVendas, 0);
    const mediaPorPeriodo = totalPontos / historyData.length;
    const melhorPeriodo = historyData.reduce((best, current) => 
      current.pontosVendas > best.pontosVendas ? current : best
    );

    return {
      totalPontos,
      mediaPorPeriodo: Math.round(mediaPorPeriodo * 100) / 100,
      melhorPeriodo: {
        periodo: formatPeriodLabel(melhorPeriodo.periodo, selectedPeriodType),
        pontos: melhorPeriodo.pontosVendas
      },
      totalPeriodos: historyData.length
    };
  }, [historyData, selectedPeriodType]);

  return {
    sdrs,
    selectedSDR,
    setSelectedSDR,
    selectedPeriodType,
    setSelectedPeriodType,
    historyData,
    statistics,
    formatPeriodLabel
  };
};