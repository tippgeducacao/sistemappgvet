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
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="bg-slate-800 rounded-xl p-6 border-2 border-slate-600 shadow-lg"
    >
      {/* Header com posição e avatar */}
      <div className="flex items-center gap-4 mb-4">
        {/* Número da posição */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-600 text-white font-bold text-lg">
          {rank}
        </div>
        
        {/* Avatar e nome */}
        <div className="flex items-center gap-3">
          <img
            src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name.replace(' ', '')}`}
            alt={person.name}
            className="w-12 h-12 rounded-full border-2 border-white/20"
          />
          <div>
            <div className="text-white font-bold text-lg">{person.name}</div>
            <div className="text-white/80 text-sm">{person.points.toFixed(0)} pts</div>
          </div>
        </div>
        
        {/* Porcentagem */}
        <div className="ml-auto">
          <div className={`text-2xl font-bold ${
            weeklyProgress >= 100 ? 'text-green-400' : 'text-red-400'
          }`}>
            {weeklyProgress.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Meta Pontos Semanal */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-blue-400 text-sm">Meta Pontos Semanal</span>
          <span className="text-white font-semibold">
            {person.weeklySales.toFixed(1)}/{person.weeklyTarget} ({weeklyProgress.toFixed(0)}%)
          </span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div 
            className="h-full bg-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
          />
        </div>
      </div>

      {/* Ontem e Hoje */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-blue-400 text-sm mb-1">Ontem</div>
          <div className="text-white font-bold text-lg">{person.yesterdayProgress || 0}.0 pts</div>
        </div>
        <div>
          <div className="text-blue-400 text-sm mb-1">Hoje</div>
          <div className="text-white font-bold text-lg">{person.todayProgress || 0}.0 pts</div>
        </div>
      </div>
    </motion.div>
  );
};