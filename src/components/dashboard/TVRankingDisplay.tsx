import React, { useState, useMemo, useEffect } from 'react';
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
  const colors = ['bg-muted-foreground', 'bg-yellow-500', 'bg-orange-500'];

  return (
    <div className="flex items-end justify-center gap-2 mb-6">
      {[topThree[1], topThree[0], topThree[2]].map((person, index) => (
        <div
          key={person?.id || index}
          className="flex flex-col items-center"
        >
          <div className="mb-2 text-center">
            <img
              src={person?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person?.name}`}
              alt={person?.name || 'Vendedor'}
              className="w-12 h-12 rounded-full mx-auto mb-1 border-2 border-border"
            />
            <div className="text-xs font-medium text-foreground">{person?.name?.split(' ')[0] || 'N/A'}</div>
            <div className="text-xs text-primary">{person?.pontuacao?.toFixed(1) || '0.0'} pts</div>
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
        </div>
      ))}
    </div>
  );
};

const VendedorCard: React.FC<{ person: VendedorData; rank: number }> = ({ person, rank }) => {
  const weeklyProgress = person.weeklyTarget > 0 ? (person.pontuacao / person.weeklyTarget) * 100 : 0;
  const dailyProgress = person.dailyTarget > 0 ? (person.dailySales / person.dailyTarget) * 100 : 0;

  return (
    <div className="bg-card/90 border border-border rounded-lg p-4 hover:shadow-md transition-shadow backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
            {rank}
          </div>
          <img
            src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`}
            alt={person.name}
            className="w-10 h-10 rounded-full border-2 border-border"
          />
          <div>
            <div className="font-medium text-foreground flex items-center gap-2">
              {person.name.split(' ')[0]}
              {person.isSDR && (
                <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                  SDR
                </Badge>
              )}
            </div>
            <div className="text-sm text-primary">{person.pontuacao.toFixed(1)} pts • {person.weeklySales} vendas</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {weeklyProgress >= 100 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="w-3 h-3" />
              Meta Semanal
            </div>
            <span className="text-xs font-medium text-foreground">{weeklyProgress.toFixed(0)}%</span>
          </div>
          <Progress value={Math.min(weeklyProgress, 100)} className="h-2" />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              Meta Diária
            </div>
            <span className="text-xs font-medium text-foreground">{dailyProgress.toFixed(0)}%</span>
          </div>
          <Progress value={Math.min(dailyProgress, 100)} className="h-2" />
        </div>
      </div>
    </div>
  );
};

const TVRankingDisplay: React.FC<TVRankingDisplayProps> = ({ isOpen, onClose }) => {
  console.log('🔥 TVRankingDisplay renderizando - isOpen:', isOpen);
  
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

  // Calcular totais mensais também
  const totalMonthlySales = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const vendasDoMes = vendas.filter(venda => {
      const dataVenda = new Date(venda.enviado_em);
      return dataVenda >= startOfMonth && 
             dataVenda <= endOfMonth && 
             venda.status === 'matriculado';
    });
    
    return vendasDoMes.length;
  }, [vendas]);

  const totalMonthlyPoints = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const vendasDoMes = vendas.filter(venda => {
      const dataVenda = new Date(venda.enviado_em);
      return dataVenda >= startOfMonth && 
             dataVenda <= endOfMonth && 
             venda.status === 'matriculado';
    });
    
    return vendasDoMes.reduce((sum, venda) => sum + (venda.pontuacao_esperada || 0), 0);
  }, [vendas]);

  const totalWeeklySales = useMemo(() => {
    return sortedSalespeople.reduce((sum, person) => sum + person.weeklySales, 0);
  }, [sortedSalespeople]);

  const totalWeeklyPoints = useMemo(() => {
    return sortedSalespeople.reduce((sum, person) => sum + person.pontuacao, 0);
  }, [sortedSalespeople]);

  const topThree = sortedSalespeople.slice(0, 3);

  console.log('🔥 TVRankingDisplay dados:', {
    isOpen,
    isLoading,
    sortedSalespeopleLenght: sortedSalespeople.length,
    topThreeLength: topThree.length
  });

  if (!isOpen) {
    console.log('🔥 TVRankingDisplay não está aberto, retornando null');
    return null;
  }
  
  console.log('🔥 TVRankingDisplay RENDERIZANDO TELA!!');

  return (
    <div className="fixed inset-0 bg-background relative overflow-hidden z-50">
      {/* Background with gradient and animated elements - same as login */}
      <div className="absolute inset-0 bg-gradient-to-br from-ppgvet-teal/20 via-ppgvet-magenta/10 to-ppgvet-teal/30 dark:from-ppgvet-teal/10 dark:via-ppgvet-magenta/5 dark:to-ppgvet-teal/15">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ppgvet-teal/30 dark:bg-ppgvet-teal/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-ppgvet-magenta/20 dark:bg-ppgvet-magenta/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-ppgvet-teal/20 dark:bg-ppgvet-teal/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header - Menor conforme solicitado */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-border/50 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-2 rounded-lg">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Ranking de Vendedores
              </h1>
              <p className="text-sm text-muted-foreground">
                Semanal • {totalWeeklySales} vendas • {totalWeeklyPoints.toFixed(1)} pts
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-2xl text-muted-foreground">Carregando dados...</div>
          </div>
        ) : (
          <div className="p-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
                {/* Coluna Esquerda - Pódio e Totais */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="backdrop-blur-lg bg-card/95 border border-border rounded-lg p-4">
                    <h2 className="text-lg font-bold text-foreground mb-3">Total Semanal</h2>
                    <div className="text-2xl font-bold text-primary">{totalWeeklySales} vendas</div>
                    <div className="text-lg font-bold text-secondary">{totalWeeklyPoints.toFixed(1)} pontos</div>
                  </div>

                  <div className="backdrop-blur-lg bg-card/95 border border-border rounded-lg p-4">
                    <h2 className="text-lg font-bold text-foreground mb-3">Total Mensal</h2>
                    <div className="text-2xl font-bold text-primary">{totalMonthlySales} vendas</div>
                    <div className="text-lg font-bold text-secondary">{totalMonthlyPoints.toFixed(1)} pontos</div>
                  </div>

                  <div className="backdrop-blur-lg bg-card/95 border border-border rounded-lg p-4">
                    <h2 className="text-lg font-bold text-foreground mb-4 text-center">Top Performers</h2>
                    <Podium topThree={topThree} />
                  </div>
                </div>

                {/* Coluna Direita - Grid de Vendedores */}
                <div className="lg:col-span-3">
                  <div className="h-full overflow-hidden">
                    <h2 className="text-xl font-bold text-foreground mb-4">Ranking Completo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 h-[calc(100vh-180px)] overflow-y-auto pr-2">
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