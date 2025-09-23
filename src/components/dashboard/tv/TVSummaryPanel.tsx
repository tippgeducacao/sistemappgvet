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
  const metrics = [
    {
      label: 'Vendas',
      weekValue: weekSummary.totalSales,
      monthValue: weekSummary.monthSales,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Reuniões',
      weekValue: weekSummary.totalMeetings,
      monthValue: weekSummary.monthMeetings,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-8 h-8" />
        <h3 className="text-2xl font-bold">Resumo Geral</h3>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="bg-white/10 rounded-lg p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className="w-5 h-5" />
                <span className="text-lg font-semibold">{metric.label}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs opacity-80 mb-1">Semana</div>
                  <div className="text-2xl font-bold">{metric.weekValue}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs opacity-80 mb-1">Mês</div>
                  <div className="text-2xl font-bold">{metric.monthValue}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
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