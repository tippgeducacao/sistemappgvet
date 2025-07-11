import React, { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Award, X, Filter } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetas } from '@/hooks/useMetas';
import { useAuthStore } from '@/stores/AuthStore';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TVRankingDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

const TVRankingDisplay: React.FC<TVRankingDisplayProps> = ({ isOpen, onClose }) => {
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { vendedores, loading: vendedoresLoading } = useVendedores();
  const { metas, loading: metasLoading } = useMetas();
  const { currentUser, profile } = useAuthStore();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Auto refresh a cada 30 segundos
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      window.location.reload();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const isLoading = vendasLoading || vendedoresLoading || metasLoading;

  // Filtrar vendedores
  const vendedoresFiltrados = useMemo(() => {
    const userEmail = profile?.email || currentUser?.email;
    const isSpecificAdmin = userEmail === 'wallasmonteiro019@gmail.com';
    
    return vendedores.filter(vendedor => {
      if (isSpecificAdmin) return true;
      return vendedor.name !== 'Vendedor teste';
    });
  }, [vendedores, profile?.email, currentUser?.email]);

  // Filtrar vendas por período
  const vendasFiltradas = useMemo(() => {
    return vendas.filter(venda => {
      const dataVenda = new Date(venda.enviado_em);
      const vendaMonth = `${dataVenda.getFullYear()}-${String(dataVenda.getMonth() + 1).padStart(2, '0')}`;
      return vendaMonth === selectedMonth;
    });
  }, [vendas, selectedMonth]);

  // Gerar lista de meses disponíveis
  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<string>();
    
    vendas.forEach(venda => {
      const vendaDate = new Date(venda.enviado_em);
      const mesAno = `${vendaDate.getFullYear()}-${String(vendaDate.getMonth() + 1).padStart(2, '0')}`;
      meses.add(mesAno);
    });

    const mesAtual = new Date();
    const mesAtualString = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
    meses.add(mesAtualString);

    return Array.from(meses)
      .sort((a, b) => b.localeCompare(a))
      .map(mesAno => {
        const [ano, mes] = mesAno.split('-');
        const mesNome = new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        });
        return { value: mesAno, label: mesNome.charAt(0).toUpperCase() + mesNome.slice(1) };
      });
  }, [vendas]);

  // Calcular estatísticas por vendedor
  const vendedoresStats = vendasFiltradas.reduce((acc, venda) => {
    const vendedorId = venda.vendedor_id;
    const vendedorNome = venda.vendedor?.name || 'Vendedor não identificado';
    const vendedorPhoto = venda.vendedor?.photo_url || undefined;
    
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

  // Incluir todos os vendedores
  const todosVendedoresStats = vendedoresFiltrados.map(vendedor => {
    const statsExistentes = vendedoresStats[vendedor.id];
    const [year, monthStr] = selectedMonth.split('-');
    const currentYear = parseInt(year);
    const currentMonth = parseInt(monthStr);
    
    const metaVendedor = metas.find(meta => 
      meta.vendedor_id === vendedor.id && 
      meta.ano === currentYear && 
      meta.mes === currentMonth
    );
    
    const vendasAprovadas = statsExistentes?.vendas || 0;
    const metaMensal = metaVendedor?.meta_vendas || 0;
    
    return {
      id: vendedor.id,
      nome: vendedor.name,
      photo_url: vendedor.photo_url,
      vendas: vendasAprovadas,
      pontuacao: statsExistentes?.pontuacao || 0,
      metaMensal,
      progressoMensal: metaMensal > 0 ? (vendasAprovadas / metaMensal) * 100 : 0
    };
  });

  // Ranking ordenado
  const ranking = todosVendedoresStats
    .sort((a, b) => {
      if (a.vendas !== b.vendas) return b.vendas - a.vendas;
      if (a.pontuacao !== b.pontuacao) return b.pontuacao - a.pontuacao;
      return a.nome.localeCompare(b.nome);
    });

  const mesAtualSelecionado = mesesDisponiveis.find(m => m.value === selectedMonth)?.label || 'Mês atual';
  const totalVendas = ranking.reduce((sum, v) => sum + v.vendas, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white z-50 overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-8 border-b border-white/20">
        <div className="flex items-center gap-6">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-xl">
            <Trophy className="h-12 w-12 text-white" />
          </div>
          <div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              RANKING DE VENDEDORES
            </h1>
            <p className="text-2xl text-white/80 mt-2">
              {mesAtualSelecionado} • {totalVendas} vendas • {ranking.length} vendedores
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Filter className="h-6 w-6 text-white/60" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-64 h-12 text-lg bg-white/10 border-white/20 text-white">
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
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-4xl text-white/60">Carregando dados...</div>
        </div>
      ) : (
        <div className="p-8">
          {/* Ranking Completo - Layout Compacto */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 max-w-full mx-auto">
            {ranking.map((vendedor, index) => {
              const isTop3 = index < 3;
              const icons = [Trophy, Medal, Award];
              const IconComponent = icons[index];
              const colors = ['from-yellow-400 to-yellow-600', 'from-gray-300 to-gray-500', 'from-amber-400 to-amber-600'];
              const positions = ['1º', '2º', '3º'];
              
              return (
                <div 
                  key={vendedor.id} 
                  className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 ${
                    isTop3 ? 'ring-2 ring-yellow-400/50' : ''
                  }`}
                >
                  <div className="text-center">
                    {/* Position */}
                    <div className={`inline-flex items-center justify-center w-10 h-10 ${
                      isTop3 
                        ? `bg-gradient-to-r ${colors[index]}` 
                        : 'bg-gradient-to-r from-teal-400 to-blue-500'
                    } rounded-full mb-3 text-white font-bold text-lg`}>
                      {isTop3 ? <IconComponent className="h-5 w-5 text-white" /> : index + 1}
                    </div>
                    
                    {/* Position Badge for Top 3 */}
                    {isTop3 && (
                      <Badge className={`bg-gradient-to-r ${colors[index]} text-white text-xs px-2 py-1 mb-3`}>
                        {positions[index]}
                      </Badge>
                    )}
                    
                    {/* Avatar */}
                    <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-white/30">
                      <AvatarImage src={vendedor.photo_url} alt={vendedor.nome} />
                      <AvatarFallback className="text-sm bg-white/20 text-white">
                        {vendedor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Nome */}
                    <h4 className="text-lg font-bold mb-2 text-white leading-tight" title={vendedor.nome}>
                      {vendedor.nome.length > 15 ? vendedor.nome.substring(0, 15) + '...' : vendedor.nome}
                    </h4>
                    
                    {/* Stats Compactas */}
                    <div className="space-y-2">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className={`text-xl font-bold ${isTop3 ? 'text-yellow-300' : 'text-white'}`}>
                          {vendedor.vendas}
                        </div>
                        <div className="text-xs text-white/60">
                          {vendedor.vendas === 1 ? 'venda' : 'vendas'}
                        </div>
                      </div>
                      
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-sm font-semibold text-yellow-400">
                          {DataFormattingService.formatPoints(vendedor.pontuacao)}
                        </div>
                        <div className="text-xs text-white/60">pontos</div>
                      </div>
                      
                      {/* Mini progress */}
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Meta</span>
                          <span>{vendedor.vendas}/{vendedor.metaMensal}</span>
                        </div>
                        <Progress 
                          value={Math.min(vendedor.progressoMensal, 100)} 
                          className="h-1.5"
                        />
                        <div className="text-xs text-white/50 mt-1">
                          {vendedor.progressoMensal.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TVRankingDisplay;