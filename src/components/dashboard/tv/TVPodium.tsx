import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

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

interface TVPodiumProps {
  topThree: VendedorData[];
}

export const TVPodium: React.FC<TVPodiumProps> = ({ topThree }) => {
  if (topThree.length < 3) return null;

  // Layout horizontal para as 3 primeiras posições
  const borderColors = [
    'border-yellow-500', // 1º lugar - dourado
    'border-blue-500',   // 2º lugar - azul
    'border-orange-500'  // 3º lugar - laranja
  ];

  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      {topThree.map((person, index) => {
        const weeklyProgress = person.weeklyTarget > 0 ? (person.weeklySales / person.weeklyTarget) * 100 : 0;
        const position = index + 1;

        return (
          <motion.div
            key={person.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-slate-800 rounded-xl p-6 border-2 ${borderColors[index]} shadow-lg`}
          >
            {/* Header com posição e avatar */}
            <div className="flex items-center gap-4 mb-4">
              {/* Número da posição */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                position === 1 ? 'bg-yellow-500' : 
                position === 2 ? 'bg-blue-500' : 'bg-orange-500'
              }`}>
                {position}
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
      })}
    </div>
  );
};