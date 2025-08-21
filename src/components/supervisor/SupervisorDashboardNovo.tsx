import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SDRMember {
  id: string;
  nome: string;
  inicial: string;
  colorClass: string;
  reunioes: number;
  meta: number;
  comissao: number;
}

const SupervisorDashboard: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState(0);

  // Calcular período da semana (quarta a terça)
  const getWeekPeriod = () => {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + (weekOffset * 7));
    
    const diaSemana = hoje.getDay();
    const diasParaQuarta = diaSemana <= 3 ? 3 - diaSemana : 10 - diaSemana;
    
    const quarta = new Date(hoje);
    quarta.setDate(hoje.getDate() - diasParaQuarta);
    
    const terca = new Date(quarta);
    terca.setDate(quarta.getDate() + 6);
    
    return `${quarta.getDate().toString().padStart(2, '0')}/${(quarta.getMonth() + 1).toString().padStart(2, '0')} - ${terca.getDate().toString().padStart(2, '0')}/${(terca.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const periodo = getWeekPeriod();

  const teamMembers: SDRMember[] = [
    { id: '1', nome: 'Júlio', inicial: 'J', colorClass: 'bg-purple-600', reunioes: 18, meta: 55, comissao: 0 },
    { id: '2', nome: 'Regiane', inicial: 'R', colorClass: 'bg-pink-600', reunioes: 23, meta: 55, comissao: 0 },
    { id: '3', nome: 'Ricael', inicial: 'R', colorClass: 'bg-blue-600', reunioes: 25, meta: 55, comissao: 0 },
    { id: '4', nome: 'Leticia Carolina', inicial: 'L', colorClass: 'bg-cyan-600', reunioes: 0, meta: 55, comissao: 0 },
    { id: '5', nome: 'Debora', inicial: 'D', colorClass: 'bg-indigo-600', reunioes: 39, meta: 55, comissao: 0 }
  ];

  const supervisorMeetings = 10;
  const totalTeamMeetings = teamMembers.reduce((sum, member) => sum + member.reunioes, 0);
  const totalTeamGoal = teamMembers.reduce((sum, member) => sum + member.meta, 0);
  const teamPerformance = (totalTeamMeetings / totalTeamGoal) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      {/* Header Simples */}
      <header className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Time SDR
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Supervisão e acompanhamento semanal
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Controle de Navegação da Semana */}
      <div className="flex justify-center mb-12">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 flex items-center gap-6 border border-slate-200 dark:border-slate-700">
          <Button
            variant="ghost"
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center px-6">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Período
            </div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">
              {periodo}
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Dashboard Principal - Layout em Coluna */}
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Seção Superior - Métricas do Supervisor */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            Minhas Atividades B2B
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {supervisorMeetings}
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">
                Reuniões realizadas
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {teamPerformance.toFixed(0)}%
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">
                Performance da equipe
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                0
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">
                Conversões da semana
              </div>
            </div>
          </div>
        </div>

        {/* Seção da Equipe SDR */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-8 flex items-center gap-3">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            Performance Individual - SDRs
          </h2>
          
          <div className="space-y-6">
            {teamMembers.map((member) => {
              const percentage = (member.reunioes / member.meta) * 100;
              return (
                <div key={member.id} className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  
                  {/* Avatar e Nome */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`w-14 h-14 ${member.colorClass} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {member.inicial}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                        {member.nome}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        SDR
                      </div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        {member.reunioes}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        de {member.meta}
                      </div>
                    </div>

                    <div className="w-32 h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    <div className="text-center min-w-[60px]">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>

                    <div className="text-center min-w-[80px]">
                      <div className="font-bold text-green-600 dark:text-green-400">
                        R$ {member.comissao.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        comissão
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className={`px-4 py-2 text-xs font-medium rounded-full ${
                        percentage >= 80 
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : percentage >= 50
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'  
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {percentage >= 80 ? 'Excelente' : percentage >= 50 ? 'Na média' : 'Precisa melhorar'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo da Equipe */}
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-600">
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                Total da Equipe:
              </span>
              <div className="flex gap-8">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {totalTeamMeetings}/{totalTeamGoal} reuniões
                </span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {teamPerformance.toFixed(1)}% de atingimento
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;