import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Target, Calendar } from 'lucide-react';

interface WeekSummary {
  totalSales: number;
  totalMeetings: number;
  monthSales: number;
  monthMeetings: number;
}

interface TVSummaryPanelProps {
  weekSummary: WeekSummary;
  currentWeekText: string;
}

export const TVSummaryPanel: React.FC<TVSummaryPanelProps> = ({ 
  weekSummary, 
  currentWeekText 
}) => {
  return (
    <div className="bg-blue-600 text-white rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-8 h-8" />
        <h3 className="text-2xl font-bold">Resumo Geral</h3>
      </div>

      <div className="space-y-6">
        {/* Vendas */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-5 h-5" />
            <span className="text-lg font-semibold">Vendas</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xs opacity-80 mb-1">Semana:</div>
              <div className="text-3xl font-bold">{weekSummary.totalSales}</div>
            </div>
            
            <div className="text-center">
              <div className="text-xs opacity-80 mb-1">Mês:</div>
              <div className="text-3xl font-bold">{weekSummary.monthSales}</div>
            </div>
          </div>
        </div>

        {/* Reuniões */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5" />
            <span className="text-lg font-semibold">Reuniões</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xs opacity-80 mb-1">Semana:</div>
              <div className="text-3xl font-bold">{weekSummary.totalMeetings}</div>
            </div>
            
            <div className="text-center">
              <div className="text-xs opacity-80 mb-1">Mês:</div>
              <div className="text-3xl font-bold">{weekSummary.monthMeetings}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Informação da semana atual */}
      <div className="mt-6 pt-4 border-t border-white/20">
        <div className="flex items-center gap-2 text-sm opacity-90">
          <Calendar className="w-4 h-4" />
          <span>{currentWeekText}</span>
        </div>
        <div className="text-xs opacity-70 mt-1">
          Dados atualizados automaticamente
        </div>
      </div>
    </div>
  );
};