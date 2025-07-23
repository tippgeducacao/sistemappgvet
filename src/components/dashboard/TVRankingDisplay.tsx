import React, { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Award, X, Filter, Target, TrendingUp } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
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
  const { metasSemanais, loading: metasLoading } = useMetasSemanais();
  const { currentUser, profile } = useAuthStore();

  // Semana atual para mostrar metas semanais
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    return { year: currentYear, month: currentMonth, week: 1 };
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

  // Calcular estatísticas da semana atual
  const vendedoresStats = useMemo(() => {
    // Pegar início e fim da semana atual (quarta a terça)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToWednesday = dayOfWeek === 0 ? 3 : (3 - dayOfWeek + 7) % 7;
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysToWednesday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Filtrar vendas da semana
    const vendasDaSemana = vendas.filter(venda => {
      const dataVenda = new Date(venda.enviado_em);
      return dataVenda >= startOfWeek && 
             dataVenda <= endOfWeek && 
             venda.status === 'matriculado';
    });

    // Agrupar por vendedor
    const statsVendedor = vendasDaSemana.reduce((acc, venda) => {
      const vendedorId = venda.vendedor_id;
      if (!acc[vendedorId]) {
        acc[vendedorId] = {
          vendas: 0,
          pontuacao: 0
        };
      }
      acc[vendedorId].vendas++;
      acc[vendedorId].pontuacao += venda.pontuacao_esperada || 0;
      return acc;
    }, {} as Record<string, { vendas: number; pontuacao: number }>);

    return statsVendedor;
  }, [vendas]);

  // Criar ranking com dados dos vendedores
  const ranking = useMemo(() => {
    return vendedoresFiltrados.map(vendedor => {
      const stats = vendedoresStats[vendedor.id] || { vendas: 0, pontuacao: 0 };
      
      // Buscar meta semanal do vendedor
      const metaSemanal = metasSemanais.find(meta => 
        meta.vendedor_id === vendedor.id && 
        meta.ano === selectedWeek.year &&
        meta.semana === selectedWeek.week
      );
      
      const metaVendas = metaSemanal?.meta_vendas || 0;
      const percentualAtingido = metaVendas > 0 ? (stats.vendas / metaVendas) * 100 : 0;
      
      return {
        id: vendedor.id,
        nome: vendedor.name,
        photo_url: vendedor.photo_url,
        vendas: stats.vendas,
        pontuacao: stats.pontuacao,
        metaSemanal: metaVendas,
        percentualAtingido: Math.min(percentualAtingido, 100),
        percentualReal: percentualAtingido
      };
    }).sort((a, b) => {
      // Ordenar por vendas primeiro, depois por pontuação
      if (a.vendas !== b.vendas) return b.vendas - a.vendas;
      if (a.pontuacao !== b.pontuacao) return b.pontuacao - a.pontuacao;
      return a.nome.localeCompare(b.nome);
    });
  }, [vendedoresFiltrados, vendedoresStats, metasSemanais, selectedWeek]);

  // Dados para exibição
  const totalVendas = ranking.reduce((sum, v) => sum + v.vendas, 0);
  const top3 = ranking.slice(0, 3);
  const demaisVendedores = ranking.slice(3);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white z-50">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-ppgvet-teal to-blue-600 p-3 rounded-xl">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-ppgvet-teal to-blue-400 bg-clip-text text-transparent">
                RANKING DE VENDEDORES
              </h1>
              <p className="text-lg text-white/80">
                Semana Atual • {totalVendas} vendas • {ranking.length} vendedores
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-3xl text-white/60">Carregando dados...</div>
          </div>
        ) : (
          <div className="flex-1 p-6 flex gap-8 overflow-hidden">
            {/* Pódium - Lado Esquerdo */}
            <div className="flex-1 flex flex-col">
              {/* Cards de métricas no topo */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{totalVendas}</div>
                  <div className="text-blue-200 text-sm">Total de Vendas</div>
                </div>
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{ranking.filter(v => v.percentualAtingido >= 100).length}</div>
                  <div className="text-green-200 text-sm">Metas Atingidas</div>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{ranking.reduce((sum, v) => sum + v.pontuacao, 0).toFixed(1)}</div>
                  <div className="text-purple-200 text-sm">Total de Pontos</div>
                </div>
              </div>

              {/* Pódium */}
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-end gap-8 justify-center">
                  {/* 2º Lugar */}
                  {top3[1] && (
                    <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl p-6 w-64 h-80 flex flex-col items-center justify-between border-4 border-gray-300">
                      <div className="text-center">
                        <div className="bg-gray-300 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                          <Medal className="h-8 w-8 text-gray-800" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-2">2º</div>
                        <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-white">
                          <AvatarImage src={top3[1].photo_url} alt={top3[1].nome} />
                          <AvatarFallback className="text-xl bg-gray-200 text-gray-800">
                            {top3[1].nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-lg font-bold text-white mb-2" title={top3[1].nome}>
                          {top3[1].nome}
                        </h3>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="bg-white/20 rounded-lg p-2">
                          <div className="text-2xl font-bold text-white">{top3[1].vendas}</div>
                          <div className="text-sm text-gray-200">vendas</div>
                        </div>
                        <div className="text-sm text-gray-200">
                          Meta: {top3[1].metaSemanal} | {top3[1].percentualAtingido.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1º Lugar */}
                  {top3[0] && (
                    <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-6 w-72 h-96 flex flex-col items-center justify-between border-4 border-yellow-300 transform scale-110">
                      <div className="text-center">
                        <div className="bg-yellow-300 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                          <Trophy className="h-10 w-10 text-yellow-800" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-2">1º</div>
                        <Avatar className="h-24 w-24 mx-auto mb-3 border-4 border-white">
                          <AvatarImage src={top3[0].photo_url} alt={top3[0].nome} />
                          <AvatarFallback className="text-2xl bg-yellow-200 text-yellow-800">
                            {top3[0].nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold text-white mb-2" title={top3[0].nome}>
                          {top3[0].nome}
                        </h3>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="bg-white/20 rounded-lg p-3">
                          <div className="text-3xl font-bold text-white">{top3[0].vendas}</div>
                          <div className="text-sm text-yellow-200">vendas</div>
                        </div>
                        <div className="text-sm text-yellow-200">
                          Meta: {top3[0].metaSemanal} | {top3[0].percentualAtingido.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3º Lugar */}
                  {top3[2] && (
                    <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl p-6 w-64 h-80 flex flex-col items-center justify-between border-4 border-amber-400">
                      <div className="text-center">
                        <div className="bg-amber-400 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                          <Award className="h-8 w-8 text-amber-800" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-2">3º</div>
                        <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-white">
                          <AvatarImage src={top3[2].photo_url} alt={top3[2].nome} />
                          <AvatarFallback className="text-xl bg-amber-200 text-amber-800">
                            {top3[2].nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-lg font-bold text-white mb-2" title={top3[2].nome}>
                          {top3[2].nome}
                        </h3>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="bg-white/20 rounded-lg p-2">
                          <div className="text-2xl font-bold text-white">{top3[2].vendas}</div>
                          <div className="text-sm text-amber-200">vendas</div>
                        </div>
                        <div className="text-sm text-amber-200">
                          Meta: {top3[2].metaSemanal} | {top3[2].percentualAtingido.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lista Lateral - Lado Direito */}
            <div className="w-96 bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-ppgvet-teal" />
                <h3 className="text-xl font-bold text-white">Classificação</h3>
              </div>
              
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {ranking.map((vendedor, index) => (
                  <div
                    key={vendedor.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      index < 3 ? 'bg-gradient-to-r from-ppgvet-teal/20 to-blue-600/20 border border-ppgvet-teal/30' : 
                      'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {/* Posição */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-white/20 text-white'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12 border-2 border-white/30">
                      <AvatarImage src={vendedor.photo_url} alt={vendedor.nome} />
                      <AvatarFallback className="bg-white/20 text-white text-sm">
                        {vendedor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info do vendedor */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-white text-sm" title={vendedor.nome}>
                        {vendedor.nome.length > 15 ? vendedor.nome.substring(0, 15) + '...' : vendedor.nome}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-white/80">
                        <Target className="h-3 w-3" />
                        <span>Meta: {vendedor.metaSemanal}</span>
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{vendedor.vendas}</div>
                      <div className={`text-xs font-semibold ${
                        vendedor.percentualAtingido >= 100 ? 'text-green-400' :
                        vendedor.percentualAtingido >= 80 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {vendedor.percentualAtingido.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TVRankingDisplay;