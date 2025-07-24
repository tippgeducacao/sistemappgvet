import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Target, Calendar, X, Maximize2, Minimize2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useNiveis } from '@/hooks/useNiveis';
import { useAuthStore } from '@/stores/AuthStore';

interface VendedorData {
  id: string;
  name: string;
  weeklySales: number;
  weeklyTarget: number;
  dailySales: number;
  dailyTarget: number;
  avatar: string;
  pontuacao: number;
  isSDR: boolean;
}

interface TVRankingDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

const Podium: React.FC<{ topThree: VendedorData[] }> = ({ topThree }) => {
  const podiumHeights = [80, 100, 60];
  const positions = ['2º', '1º', '3º'];
  const colors = ['bg-slate-500', 'bg-yellow-500', 'bg-orange-500'];

  return (
    <div className="flex items-end justify-center gap-2 mb-6">
      {[topThree[1], topThree[0], topThree[2]].map((person, index) => (
        <motion.div
          key={person?.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.2 }}
          className="flex flex-col items-center"
        >
          <div className="mb-2 text-center">
            <img
              src={person?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person?.name}`}
              alt={person?.name}
              className="w-12 h-12 rounded-full mx-auto mb-1 border-2 border-white/20"
            />
            <div className="text-xs font-medium text-white">{person?.name.split(' ')[0]}</div>
            <div className="text-xs text-teal-400">{person?.pontuacao.toFixed(1)} pts</div>
            {person?.isSDR && (
              <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30 mt-1">
                SDR
              </Badge>
            )}
          </div>
          <div
            className={`${colors[index]} rounded-t-lg flex items-end justify-center text-white font-bold text-sm relative`}
            style={{ height: `${podiumHeights[index]}px`, width: '80px' }}
          >
            <div className="absolute top-2">
              {index === 1 && <Trophy className="w-6 h-6" />}
              {index !== 1 && <span>{positions[index]}</span>}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const VendedorCard: React.FC<{ person: VendedorData; rank: number }> = ({ person, rank }) => {
  const weeklyProgress = person.weeklyTarget > 0 ? (person.pontuacao / person.weeklyTarget) * 100 : 0;
  const dailyProgress = person.dailyTarget > 0 ? (person.dailySales / person.dailyTarget) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-teal-500 text-white rounded-full text-sm font-bold">
            {rank}
          </div>
          <img
            src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`}
            alt={person.name}
            className="w-10 h-10 rounded-full border-2 border-white/20"
          />
          <div>
            <div className="font-medium text-white flex items-center gap-2">
              {person.name.split(' ')[0]}
              {person.isSDR && (
                <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                  SDR
                </Badge>
              )}
            </div>
            <div className="text-sm text-teal-400">{person.pontuacao.toFixed(1)} pts • {person.weeklySales} vendas</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {weeklyProgress >= 100 ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-white/70">
              <Target className="w-3 h-3" />
              Meta Semanal
            </div>
            <span className="text-xs font-medium text-white">{weeklyProgress.toFixed(0)}%</span>
          </div>
          <Progress value={Math.min(weeklyProgress, 100)} className="h-2" />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-white/70">
              <Calendar className="w-3 h-3" />
              Meta Diária
            </div>
            <span className="text-xs font-medium text-white">{person.dailyTarget.toFixed(1)} pts</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TVRankingDisplay: React.FC<TVRankingDisplayProps> = ({ isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { vendedores, loading: vendedoresLoading } = useVendedores();
  const { metasSemanais, loading: metasLoading } = useMetasSemanais();
  const { niveis, loading: niveisLoading } = useNiveis();
  const { currentUser, profile } = useAuthStore();

  // Auto refresh a cada 30 segundos
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      window.location.reload();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Gerenciar tela cheia
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const isLoading = vendasLoading || vendedoresLoading || metasLoading || niveisLoading;

  // Filtrar vendedores (incluir todos vendedores e SDRs ativos)
  const vendedoresFiltrados = useMemo(() => {
    const userEmail = profile?.email || currentUser?.email;
    const isSpecificAdmin = userEmail === 'wallasmonteiro019@gmail.com';
    
    return vendedores.filter(vendedor => {
      if (!vendedor.ativo) return false;
      
      const isVendedorOrSDR = vendedor.user_type === 'vendedor' || 
                             vendedor.user_type?.includes('sdr');
      
      if (!isVendedorOrSDR) return false;
      
      if (!isSpecificAdmin && vendedor.name === 'Vendedor teste') {
        return false;
      }
      
      return true;
    });
  }, [vendedores, profile?.email, currentUser?.email]);

  // Calcular estatísticas da semana atual (quarta a terça)
  const vendedoresStats = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToWednesday = dayOfWeek === 0 ? 3 : (3 - dayOfWeek + 7) % 7;
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysToWednesday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const vendasDaSemana = vendas.filter(venda => {
      const dataVenda = new Date(venda.enviado_em);
      return dataVenda >= startOfWeek && 
             dataVenda <= endOfWeek && 
             venda.status === 'matriculado';
    });

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

  const calculateDynamicDailyGoal = (metaSemanal: number, pontosAtual: number) => {
    if (pontosAtual >= metaSemanal) return 0;
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    let diaAtual = 1;
    if (dayOfWeek === 3) diaAtual = 1;
    else if (dayOfWeek === 4) diaAtual = 2;
    else if (dayOfWeek === 5) diaAtual = 3;
    else if (dayOfWeek === 6) diaAtual = 4;
    else if (dayOfWeek === 0) diaAtual = 5;
    else if (dayOfWeek === 1) diaAtual = 6;
    else if (dayOfWeek === 2) diaAtual = 7;
    
    const pontosRestantes = Math.max(0, metaSemanal - pontosAtual);
    const diasRestantes = Math.max(1, 8 - diaAtual);
    
    return pontosRestantes / diasRestantes;
  };

  const salespeople: VendedorData[] = useMemo(() => {
    return vendedoresFiltrados.map(vendedor => {
      const stats = vendedoresStats[vendedor.id] || { vendas: 0, pontuacao: 0 };
      
      const vendedorNivel = vendedor.nivel || 'junior';
      const nivelConfig = niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === vendedor.user_type) ||
                         niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === 'vendedor');
      
      const metaSemanal = nivelConfig?.meta_semanal_vendedor || 6;
      const metaDiaria = calculateDynamicDailyGoal(metaSemanal, stats.pontuacao);
      
      return {
        id: vendedor.id,
        name: vendedor.name,
        weeklySales: stats.vendas,
        weeklyTarget: metaSemanal,
        dailySales: stats.pontuacao,
        dailyTarget: metaDiaria,
        avatar: vendedor.photo_url || '',
        pontuacao: stats.pontuacao,
        isSDR: vendedor.user_type?.includes('sdr') || false
      };
    });
  }, [vendedoresFiltrados, vendedoresStats, niveis]);

  const sortedSalespeople = useMemo(() => {
    return [...salespeople].sort((a, b) => {
      if (a.pontuacao !== b.pontuacao) return b.pontuacao - a.pontuacao;
      if (a.weeklySales !== b.weeklySales) return b.weeklySales - a.weeklySales;
      return a.name.localeCompare(b.name);
    });
  }, [salespeople]);

  const totalWeeklySales = useMemo(() => {
    return sortedSalespeople.reduce((sum, person) => sum + person.weeklySales, 0);
  }, [sortedSalespeople]);

  const totalWeeklyPoints = useMemo(() => {
    return sortedSalespeople.reduce((sum, person) => sum + person.pontuacao, 0);
  }, [sortedSalespeople]);

  const topThree = sortedSalespeople.slice(0, 3);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white z-50">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-teal-500/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-3 rounded-xl">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Ranking de Vendedores
              </h1>
              <p className="text-lg text-white/80">
                Semanal • {totalWeeklySales} vendas • {totalWeeklyPoints.toFixed(1)} pts
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
            </button>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-4xl text-white/60">Carregando dados...</div>
          </div>
        ) : (
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-150px)]">
                {/* Coluna Esquerda - Pódio e Total */}
                <div className="lg:col-span-1 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm"
                  >
                    <h2 className="text-2xl font-bold text-white mb-2">Total Semanal</h2>
                    <div className="text-3xl font-bold text-teal-400">{totalWeeklySales} vendas</div>
                    <div className="text-xl font-bold text-cyan-400">{totalWeeklyPoints.toFixed(1)} pontos</div>
                  </motion.div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-white mb-4 text-center">Top Performers</h2>
                    <Podium topThree={topThree} />
                  </div>
                </div>

                {/* Coluna Direita - Grid de Vendedores */}
                <div className="lg:col-span-3">
                  <div className="h-full overflow-hidden">
                    <h2 className="text-2xl font-bold text-white mb-6">Ranking Completo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-[calc(100vh-250px)] overflow-y-auto pr-2">
                      {sortedSalespeople.map((person, index) => (
                        <VendedorCard
                          key={person.id}
                          person={person}
                          rank={index + 1}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TVRankingDisplay;