import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VendedorData {
  id: string;
  name: string;
  weeklySales: number;
  weeklyTarget: number;
  avatar: string;
  points: number;
  isSDR: boolean;
  yesterdayProgress?: number;
  todayProgress?: number;
}

interface TVVendorCardProps {
  person: VendedorData;
  rank: number;
}

export const TVVendorCard: React.FC<TVVendorCardProps> = ({ person, rank }) => {
  const weeklyProgress = person.weeklyTarget > 0 ? (person.weeklySales / person.weeklyTarget) * 100 : 0;
  const progressChange = (person.todayProgress || 0) - (person.yesterdayProgress || 0);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        {/* Rank e info do vendedor */}
        <div className="flex items-center gap-4">
          {/* Número do rank */}
          <div className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full text-lg font-bold shadow-md">
            {rank}
          </div>
          
          {/* Avatar e nome */}
          <div className="flex items-center gap-3">
            <img
              src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name.replace(' ', '')}`}
              alt={person.name}
              className="w-14 h-14 rounded-full border-2 border-primary/20"
            />
            <div>
              <div className="text-xl font-bold text-foreground">{person.name}</div>
              <div className="text-lg text-primary font-semibold">{person.points.toFixed(1)} pts</div>
            </div>
          </div>
        </div>

        {/* Indicador de progresso */}
        <div className="flex flex-col items-end">
          <div className={`flex items-center gap-2 text-lg font-bold ${
            weeklyProgress >= 100 ? 'text-green-600' : 'text-red-600'
          }`}>
            {weeklyProgress >= 100 ? (
              <TrendingUp className="w-6 h-6" />
            ) : (
              <TrendingDown className="w-6 h-6" />
            )}
            {weeklyProgress.toFixed(0)}%
          </div>
          <div className="text-sm text-muted-foreground">da meta</div>
        </div>
      </div>

      {/* Progresso da meta */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Target className="w-4 h-4" />
            Meta Pontos Semanal
          </div>
          <span className="text-sm font-semibold">
            {person.weeklySales.toFixed(1)}/{person.weeklyTarget}
          </span>
        </div>
        <Progress 
          value={Math.min(weeklyProgress, 100)} 
          className="h-3"
        />
      </div>

      {/* Progresso ontem vs hoje */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Ontem</div>
          <div className="text-lg font-bold text-foreground">{person.yesterdayProgress || 0}</div>
        </div>
        
        <div className="bg-primary/10 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Hoje</div>
          <div className="text-lg font-bold text-primary">{person.todayProgress || 0}</div>
        </div>
        
        <div className={`rounded-lg p-3 ${
          progressChange >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <div className="text-xs mb-1">Variação</div>
          <div className="text-lg font-bold">
            {progressChange >= 0 ? '+' : ''}{progressChange}
          </div>
        </div>
      </div>
    </motion.div>
  );
};