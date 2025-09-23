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
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-foreground">SDRs - Sales Development</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sdrData.map((sdr, index) => {
          const vendasProgress = sdr.weeklyTarget > 0 ? (sdr.weeklySales / sdr.weeklyTarget) * 100 : 0;
          const reunioesProgress = sdr.metaReunioesSemanais ? (sdr.reunioesSemana! / sdr.metaReunioesSemanais) * 100 : 0;
          const isPerformingWell = vendasProgress >= 50 || reunioesProgress >= 75;

          return (
            <motion.div
              key={sdr.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-card border-2 rounded-xl p-6 transition-all duration-300 ${
                isPerformingWell 
                  ? 'border-green-500 shadow-lg shadow-green-500/20' 
                  : 'border-red-500 shadow-lg shadow-red-500/20'
              }`}
            >
              {/* Header do SDR */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={sdr.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sdr.name.replace(' ', '')}`}
                    alt={sdr.name}
                    className="w-12 h-12 rounded-full border-2 border-blue-500/30"
                  />
                  <div>
                    <div className="text-lg font-bold text-foreground">{sdr.name}</div>
                    <div className="text-sm text-blue-600 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      SDR
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Taxa Conversão</div>
                  <div className="text-lg font-bold text-blue-600">
                    {sdr.taxaConversaoSemanal?.toFixed(1) || 0}%
                  </div>
                </div>
              </div>

              {/* Progresso de Vendas */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <Target className="w-4 h-4" />
                    Vendas Cursos
                  </div>
                  <span className="text-sm font-bold text-blue-700">
                    {sdr.weeklySales}/{sdr.weeklyTarget}
                  </span>
                </div>
                <div className="relative">
                  <Progress value={Math.min(vendasProgress, 100)} className="h-4" />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                    {vendasProgress.toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Progresso de Reuniões */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                    <Users className="w-4 h-4" />
                    Reuniões
                  </div>
                  <span className="text-sm font-bold text-purple-700">
                    {sdr.reunioesSemana}/{sdr.metaReunioesSemanais}
                  </span>
                </div>
                <div className="relative">
                  <Progress value={Math.min(reunioesProgress, 100)} className="h-4" />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                    {reunioesProgress.toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Status geral */}
              <div className={`text-center py-2 rounded-lg text-sm font-bold ${
                isPerformingWell 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isPerformingWell ? (
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Performance Excelente
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Target className="w-4 h-4" />
                    Atenção à Meta
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};