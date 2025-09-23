import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VendedorData {
  id: string;
  name: string;
  weeklySales: number;
  weeklyTarget: number;
  avatar: string;
  points: number;
  isSDR: boolean;
  reunioesSemana?: number;
  metaReunioesSemanais?: number;
  taxaConversaoSemanal?: number;
}

interface TVSDRSectionProps {
  sdrData: VendedorData[];
}

export const TVSDRSection: React.FC<TVSDRSectionProps> = ({ sdrData }) => {
  if (sdrData.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-center gap-3 mb-6">
        <h2 className="text-3xl font-bold text-white">SDR</h2>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {sdrData.slice(0, 5).map((sdr, index) => {
          const vendasProgress = sdr.weeklyTarget > 0 ? (sdr.weeklySales / sdr.weeklyTarget) * 100 : 0;
          const reunioesProgress = sdr.metaReunioesSemanais ? (sdr.reunioesSemana! / sdr.metaReunioesSemanais) * 100 : 0;
          const sdrRank = index + 7; // SDRs começam na posição 7

          return (
            <motion.div
              key={sdr.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg"
            >
              {/* Header com posição e avatar */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-600 text-white font-bold text-sm">
                  {sdrRank}
                </div>
                <img
                  src={sdr.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sdr.name.replace(' ', '')}`}
                  alt={sdr.name}
                  className="w-10 h-10 rounded-full border-2 border-white/20"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate">{sdr.name}</div>
                  <div className="flex items-center gap-1 text-xs text-white/70">
                    <div className={`w-2 h-2 rounded-full ${vendasProgress > 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    {vendasProgress.toFixed(0)}%
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/70">
                  <div className={`w-2 h-2 rounded-full ${reunioesProgress > 50 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  {reunioesProgress.toFixed(0)}%
                </div>
              </div>

              {/* Vendas cursos */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-blue-400 text-xs">vendas cursos</span>
                  <span className="text-white text-sm font-semibold">
                    {sdr.weeklySales}/{sdr.weeklyTarget}
                  </span>
                </div>
              </div>

              {/* Reuniões com barra de progresso */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400 text-xs">reuniões</span>
                  <span className="text-white text-sm font-semibold">
                    {sdr.reunioesSemana || 0}/{sdr.metaReunioesSemanais || 40}
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(reunioesProgress, 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};