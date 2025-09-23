import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Target, Users, Wifi } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useOptimizedTVRankingData } from '@/hooks/useOptimizedTVRankingData';

interface VendedorData {
  id: string;
  name: string;
  weeklySales: number;
  weeklyTarget: number;
  avatar: string;
  points: number;
  isSDR: boolean;
  nivel?: string;
  reunioesSemana?: number;
  metaReunioesSemanais?: number;
  taxaConversaoSemanal?: number;
}

const VendedorCard: React.FC<{ person: VendedorData; rank: number; isTopThree?: boolean }> = ({ 
  person, 
  rank, 
  isTopThree = false 
}) => {
  const weeklyProgress = person.weeklyTarget > 0 ? (person.weeklySales / person.weeklyTarget) * 100 : 0;
  const reunioesWeeklyProgress = person.isSDR && person.metaReunioesSemanais ? 
    (person.reunioesSemana! / person.metaReunioesSemanais) * 100 : 0;

  const getCardStyle = () => {
    if (person.isSDR) {
      return weeklyProgress >= 71 
        ? 'bg-card border-green-500 border-2 shadow-lg' 
        : 'bg-card border-red-500 border-2 shadow-lg';
    }
    
    if (!isTopThree) return 'bg-card border-border';
    
    switch (rank) {
      case 1: return 'bg-card border-yellow-500 border-2 shadow-lg shadow-yellow-500/20';
      case 2: return 'bg-card border-gray-400 border-2 shadow-lg shadow-gray-500/20';
      case 3: return 'bg-card border-orange-500 border-2 shadow-lg shadow-orange-500/20';
      default: return 'bg-card border-border';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`relative border rounded-lg p-3 hover:shadow-md transition-shadow ${getCardStyle()}`}
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
              {person.isSDR && person.taxaConversaoSemanal !== undefined && (
                <>
                  <div className={`w-1.5 h-1.5 rounded-full ml-2 ${
                    person.taxaConversaoSemanal >= 50 ? 'bg-emerald-500' : 
                    person.taxaConversaoSemanal >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
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
            <Target className="w-3 h-3 text-red-500" />
          ))}
        </div>
      </div>
      
      <div className="space-y-1">
        {person.isSDR ? (
          <>
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
              <Progress value={Math.min(reunioesWeeklyProgress, 100)} className="h-2 bg-muted/20">
                <div 
                  className="h-full bg-ppgvet-magenta transition-all duration-300 ease-in-out" 
                  style={{ width: `${Math.min(reunioesWeeklyProgress, 100)}%` }}
                />
              </Progress>
            </div>
          </>
        ) : (
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
        )}
      </div>
    </motion.div>
  );
};

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
            <div className="text-xs text-muted-foreground">{person?.weeklySales?.toFixed(1) || '0.0'} pts</div>
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

const PublicTVRanking: React.FC = () => {
  const { vendedoresData, isLoading, error, lastUpdated } = useOptimizedTVRankingData();

  const sortedVendedores = useMemo(() => 
    vendedoresData.sort((a, b) => b.weeklySales - a.weeklySales),
    [vendedoresData]
  );

  const topThree = sortedVendedores.slice(0, 3);
  const restOfList = sortedVendedores.slice(3, 15); // Mostrar só top 15 para TV pública

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-destructive mb-4">Erro ao carregar dados</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🏆 RANKING DE VENDAS
          </motion.h1>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Wifi className="w-4 h-4 text-green-500" />
            <span>Atualizado: {lastUpdated}</span>
          </div>
        </div>

        {topThree.length >= 3 && (
          <div className="mb-8">
            <Podium topThree={topThree} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restOfList.map((person, index) => (
            <VendedorCard
              key={person.id}
              person={person}
              rank={index + 4}
              isTopThree={false}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-4 text-sm text-muted-foreground bg-card px-6 py-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Meta atingida</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Abaixo da meta</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>SDR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicTVRanking;