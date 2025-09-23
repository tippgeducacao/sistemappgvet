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

  // Reordenar para layout de pódium (2º, 1º, 3º)
  const podiumOrder = [topThree[1], topThree[0], topThree[2]];
  const podiumHeights = ['h-32', 'h-40', 'h-24']; // 2º, 1º, 3º
  const podiumColors = [
    'bg-gradient-to-t from-slate-400 to-slate-300', // Prata
    'bg-gradient-to-t from-yellow-500 to-yellow-400', // Ouro
    'bg-gradient-to-t from-orange-600 to-orange-500'  // Bronze
  ];
  const podiumIcons = [Medal, Trophy, Award];
  const podiumLabels = ['2º', '1º', '3º'];
  const podiumPositions = [2, 1, 3];

  return (
    <div className="flex items-end justify-center gap-4 mb-8">
      {podiumOrder.map((person, index) => {
        if (!person) return null;

        const Icon = podiumIcons[index];
        const weeklyProgress = person.weeklyTarget > 0 ? (person.weeklySales / person.weeklyTarget) * 100 : 0;
        const position = podiumPositions[index];

        return (
          <motion.div
            key={person.id}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.3, type: "spring", stiffness: 100 }}
            className="flex flex-col items-center"
          >
            {/* Informações do vendedor */}
            <div className="mb-4 text-center bg-card rounded-lg p-4 border-2 border-primary/20 shadow-lg min-w-[200px]">
              {/* Avatar */}
              <div className="relative mb-3">
                <img
                  src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name.replace(' ', '')}`}
                  alt={person.name}
                  className="w-16 h-16 rounded-full mx-auto border-4 border-primary/30"
                />
                {/* Ícone de posição */}
                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${
                  position === 1 ? 'bg-yellow-500' : position === 2 ? 'bg-slate-400' : 'bg-orange-500'
                }`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              
              {/* Nome */}
              <div className="text-lg font-bold text-foreground mb-1">
                {person.name}
              </div>
              
              {/* Pontuação */}
              <div className="text-2xl font-bold text-primary mb-2">
                {person.points.toFixed(1)} pts
              </div>
              
              {/* Progresso da meta */}
              <div className="text-sm text-muted-foreground mb-2">
                {weeklyProgress.toFixed(0)}% da meta
              </div>
              
              {/* Progresso ontem/hoje */}
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="text-center">
                  <div className="text-muted-foreground">Ontem</div>
                  <div className="font-semibold text-foreground">{person.yesterdayProgress || 0}</div>
                </div>
                <div className="w-px h-4 bg-border"></div>
                <div className="text-center">
                  <div className="text-muted-foreground">Hoje</div>
                  <div className="font-semibold text-primary">{person.todayProgress || 0}</div>
                </div>
              </div>
              
              {/* Barra de progresso */}
              <div className="w-full bg-muted rounded-full h-2 mt-3">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    position === 1 ? 'bg-yellow-500' : 
                    position === 2 ? 'bg-slate-400' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
                />
              </div>
            </div>

            {/* Base do pódium */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              transition={{ delay: (index * 0.3) + 0.5, duration: 0.5 }}
              className={`${podiumHeights[index]} ${podiumColors[index]} rounded-t-lg flex flex-col items-center justify-between text-white font-bold shadow-lg border-t-4 border-white/30`}
              style={{ width: '180px' }}
            >
              {/* Label da posição */}
              <div className="mt-4 text-lg font-black drop-shadow-md">
                {podiumLabels[index]}
              </div>
              
              {/* Pontuação na base */}
              <div className="mb-4 text-center">
                <div className="text-sm opacity-90">Pontos</div>
                <div className="text-xl font-black">{person.points.toFixed(0)}</div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};