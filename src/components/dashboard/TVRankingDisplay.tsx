import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Target, Calendar, X, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
  points: number;
  isSDR: boolean;
  monthlyTotal: number;
}

interface TVRankingDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

const Podium: React.FC<{ topThree: VendedorData[] }> = ({ topThree }) => {
  const podiumHeights = [80, 100, 60];
  const positions = ['2nd', '1st', '3rd'];
  const colors = ['bg-gray-400', 'bg-yellow-500', 'bg-orange-400'];

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
              src={person?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person?.name.replace(' ', '')}`}
              alt={person?.name}
              className="w-12 h-12 rounded-full mx-auto mb-1"
            />
            <div className="text-xs font-medium text-foreground">{person?.name}</div>
            <div className="text-xs text-muted-foreground">{person?.points} pts</div>
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
  const weeklyProgress = person.weeklyTarget > 0 ? (person.weeklySales / person.weeklyTarget) * 100 : 0;
  const dailyProgress = person.dailyTarget > 0 ? (person.dailySales / person.dailyTarget) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="bg-card border border-border rounded-lg p-2 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">
            {rank}
          </div>
          <img
            src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name.replace(' ', '')}`}
            alt={person.name}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <div className="text-sm font-medium text-foreground">{person.name}</div>
            <div className="text-xs text-muted-foreground">
              {person.isSDR ? `${person.weeklySales} reuniões` : `${person.points} pts`}
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
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="w-2 h-2" />
              {person.isSDR ? 'Meta Reuniões Semanal' : 'Meta Vendas Semanal'}
            </div>
            <span className="text-xs font-medium">
              {person.isSDR ? `${person.weeklySales}/${person.weeklyTarget}` : `${person.weeklySales}/${person.weeklyTarget}`} ({weeklyProgress.toFixed(0)}%)
            </span>
          </div>
          <Progress value={Math.min(weeklyProgress, 100)} className="h-1" />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-2 h-2" />
              {person.isSDR ? 'Meta Reuniões Diária' : 'Meta Vendas Diária'}
            </div>
            <span className="text-xs font-medium">
              {person.isSDR ? `${person.dailySales}/${person.dailyTarget}` : `${person.dailySales}/${person.dailyTarget}`} ({dailyProgress.toFixed(0)}%)
            </span>
          </div>
          <Progress value={Math.min(dailyProgress, 100)} className="h-1" />
        </div>
      </div>
    </motion.div>
  );
};

const TVRankingDisplay: React.FC<TVRankingDisplayProps> = ({ isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { vendas } = useAllVendas();
  const { vendedores } = useVendedores();
  const { metasSemanais, getSemanaAtual } = useMetasSemanais();
  const { niveis } = useNiveis();
  const { currentUser } = useAuthStore();

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      // Forçar re-render para atualizar dados
      window.location.reload();
    }, 30000);

    return () => clearInterval(interval);
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

  // Calcular dados para ranking
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentWeek = getSemanaAtual();

  // Filtrar vendas da semana atual
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 4) % 7)); // Quarta-feira atual
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Terça-feira

  // Filtrar vendas do mês atual
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0);

  const vendasSemanaAtual = vendas.filter(venda => {
    const vendaDate = new Date(venda.enviado_em);
    return vendaDate >= startOfWeek && vendaDate <= endOfWeek && venda.status === 'matriculado';
  });

  const vendasMesAtual = vendas.filter(venda => {
    const vendaDate = new Date(venda.enviado_em);
    return vendaDate >= startOfMonth && vendaDate <= endOfMonth && venda.status === 'matriculado';
  });

  // Filtrar vendas do dia atual
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const vendasDiaAtual = vendas.filter(venda => {
    const vendaDate = new Date(venda.enviado_em);
    return vendaDate >= startOfDay && vendaDate <= endOfDay && venda.status === 'matriculado';
  });

  // Calcular dados dos vendedores
  const vendedoresData: VendedorData[] = vendedores.map(vendedor => {
    const isSDR = vendedor.user_type?.includes('sdr') || false;
    
    if (isSDR) {
      // Para SDRs - usar dados reais das reuniões quando disponível
      const reunioesSemana = 0; // TODO: buscar reuniões reais da semana
      const reunioesDia = 0; // TODO: buscar reuniões reais do dia
      const metaSemanalReunioes = 25; // Meta padrão
      const metaDiariaReunioes = 4; // Meta padrão

      return {
        id: vendedor.id,
        name: vendedor.name,
        weeklySales: reunioesSemana,
        weeklyTarget: metaSemanalReunioes,
        dailySales: reunioesDia,
        dailyTarget: metaDiariaReunioes,
        avatar: vendedor.photo_url || '',
        points: 0, // SDRs não têm pontuação
        isSDR: true,
        monthlyTotal: 0 // TODO: buscar reuniões reais do mês
      };
    } else {
      // Para vendedores - contar vendas e pontuação reais
      const vendasVendedorSemana = vendasSemanaAtual.filter(v => v.vendedor_id === vendedor.id);
      const vendasVendedorMes = vendasMesAtual.filter(v => v.vendedor_id === vendedor.id);
      const vendasVendedorDia = vendasDiaAtual.filter(v => v.vendedor_id === vendedor.id);
      
      const metaSemanal = metasSemanais.find(m => 
        m.vendedor_id === vendedor.id && 
        m.ano === currentYear && 
        m.semana === currentWeek
      )?.meta_vendas || 0;

      const points = vendasVendedorSemana.reduce((total, venda) => total + (venda.pontuacao_validada || 0), 0);
      const metaDiaria = Math.ceil(metaSemanal / 7);

      return {
        id: vendedor.id,
        name: vendedor.name,
        weeklySales: vendasVendedorSemana.length,
        weeklyTarget: metaSemanal,
        dailySales: vendasVendedorDia.length, // Vendas reais do dia
        dailyTarget: metaDiaria,
        avatar: vendedor.photo_url || '',
        points,
        isSDR: false,
        monthlyTotal: vendasVendedorMes.length
      };
    }
  });

  // Separar vendedores e SDRs
  const vendedoresOnly = vendedoresData.filter(v => !v.isSDR).sort((a, b) => b.points - a.points);
  const sdrsOnly = vendedoresData.filter(v => v.isSDR).sort((a, b) => b.weeklySales - a.weeklySales);

  // Combinar para o ranking final (vendedores primeiro, depois SDRs)
  const allRanking = [...vendedoresOnly, ...sdrsOnly];
  
  const topThree = vendedoresOnly.slice(0, 3);
  const remaining = allRanking.slice(3);

  const totalWeeklySales = vendedoresOnly.reduce((sum, person) => sum + person.weeklySales, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-background">
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
          <Button onClick={toggleFullscreen} variant="outline" size="sm">
            {isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}
          </Button>
          <Button onClick={onClose} variant="outline" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 p-4 min-h-[calc(100vh-80px)]">
        <div className="max-w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[calc(100vh-120px)]">
            {/* Coluna esquerda - Podium e Total */}
            <div className="lg:col-span-1 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/95 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-lg p-4 shadow-xl"
              >
                <h2 className="text-xl font-bold text-foreground mb-2">Total Semanal</h2>
                <div className="text-2xl font-bold text-primary">{totalWeeklySales} vendas</div>
              </motion.div>

              <div className="bg-card/95 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-lg p-4 shadow-xl">
                <h2 className="text-lg font-bold text-foreground mb-4 text-center">Top Vendedores</h2>
                {topThree.length >= 3 ? (
                  <Podium topThree={topThree} />
                ) : (
                  <div className="text-center text-muted-foreground">Poucos vendedores para podium</div>
                )}
              </div>
            </div>

            {/* Coluna direita - Grid de todos */}
            <div className="lg:col-span-3">
              <h2 className="text-xl font-bold text-foreground mb-4">Ranking Completo</h2>
              <div 
                className="grid grid-cols-3 gap-3 auto-rows-min"
                style={{ 
                  maxHeight: 'calc(100vh - 200px)',
                  gridTemplateRows: `repeat(${Math.ceil(allRanking.length / 3)}, minmax(auto, 1fr))`
                }}
              >
                {allRanking.map((person, index) => (
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
  );
};

export default TVRankingDisplay;