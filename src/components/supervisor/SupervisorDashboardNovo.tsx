import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SDRMember {
  id: string;
  nome: string;
  avatar: string;
  reunioesRealizadas: number;
  metaSemanal: number;
  percentual: number;
  comissao: number;
}

const SupervisorDashboard: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(0);

  // Calcular semana atual (quarta a terça)
  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    
    // Calcular quantos dias até a quarta-feira mais próxima (passada ou atual)
    let daysToWed = currentDay === 0 ? -4 : 3 - currentDay; // 0=domingo, 3=quarta
    if (currentDay < 3) daysToWed -= 7; // Se ainda não chegou na quarta desta semana
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + daysToWed + (weekOffset * 7));
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return {
      start: startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      end: endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    };
  };

  const weekDates = getWeekDates(currentWeek);

  // Dados dos SDRs do grupo
  const sdrs: SDRMember[] = [
    {
      id: '1',
      nome: 'Júlio',
      avatar: '👨‍💼',
      reunioesRealizadas: 18,
      metaSemanal: 55,
      percentual: 32.7,
      comissao: 0
    },
    {
      id: '2',
      nome: 'Regiane', 
      avatar: '👩‍💼',
      reunioesRealizadas: 23,
      metaSemanal: 55,
      percentual: 41.8,
      comissao: 0
    },
    {
      id: '3',
      nome: 'Ricael',
      avatar: '👨‍💻',
      reunioesRealizadas: 25,
      metaSemanal: 55,
      percentual: 45.5,
      comissao: 0
    },
    {
      id: '4', 
      nome: 'Leticia Carolina',
      avatar: '👩‍💻',
      reunioesRealizadas: 0,
      metaSemanal: 55,
      percentual: 0,
      comissao: 0
    },
    {
      id: '5',
      nome: 'Debora',
      avatar: '👩‍🎯',
      reunioesRealizadas: 39,
      metaSemanal: 55, 
      percentual: 70.9,
      comissao: 0
    }
  ];

  // Calcular métricas
  const minhasReunioes = 10;
  const totalReunioesEquipe = sdrs.reduce((acc, sdr) => acc + sdr.reunioesRealizadas, 0);
  const totalMetaEquipe = sdrs.reduce((acc, sdr) => acc + sdr.metaSemanal, 0);
  const taxaAtingimento = (totalReunioesEquipe / totalMetaEquipe) * 100;
  const conversoes = 0;

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard - Time SDR</h1>
          <p className="text-muted-foreground mt-1">Acompanhe o desempenho da sua equipe de SDRs</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Navegação da Semana - Centralizada */}
      <div className="flex justify-center">
        <div className="flex items-center gap-4 bg-card rounded-xl px-6 py-4 border border-border shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentWeek(prev => prev - 1)}
            className="h-8 w-8 p-0 hover:bg-muted rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center px-4">
            <div className="text-sm text-muted-foreground font-medium">Semana</div>
            <div className="text-lg font-bold text-foreground">
              {weekDates.start} - {weekDates.end}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentWeek(prev => prev + 1)}
            className="h-8 w-8 p-0 hover:bg-muted rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cards de Métricas - Layout Horizontal Simples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Minhas Reuniões B2B */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">📅</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Minhas Reuniões
            </div>
          </div>
          <div className="text-4xl font-bold text-foreground mb-1">{minhasReunioes}</div>
          <div className="text-sm text-muted-foreground">reuniões realizadas esta semana</div>
        </div>

        {/* SUA META (Taxa de Atingimento) */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">🎯</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              SUA META
            </div>
          </div>
          <div className="text-4xl font-bold text-foreground mb-1">
            {totalReunioesEquipe}/{totalMetaEquipe}
          </div>
          <div className="text-sm text-muted-foreground">{taxaAtingimento.toFixed(1)}% atingido</div>
          {/* Barra de progresso simples */}
          <div className="w-full bg-muted rounded-full h-2 mt-3">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(taxaAtingimento, 100)}%` }}
            />
          </div>
        </div>

        {/* CONVERSÕES */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">📈</div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              CONVERSÕES
            </div>
          </div>
          <div className="text-4xl font-bold text-foreground mb-1">{conversoes}</div>
          <div className="text-sm text-muted-foreground">conversões da equipe</div>
        </div>
      </div>

      {/* META COLETIVA - Lista dos SDRs */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">META COLETIVA</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Desempenho individual dos SDRs da sua equipe
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          {sdrs.map((sdr) => (
            <div key={sdr.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
              {/* SDR Info */}
              <div className="flex items-center gap-4">
                <div className="text-2xl w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {sdr.nome.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{sdr.nome}</div>
                  <div className="text-sm text-muted-foreground">SDR</div>
                </div>
              </div>

              {/* Performance */}
              <div className="flex items-center gap-8">
                {/* Números */}
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    {sdr.reunioesRealizadas}/{sdr.metaSemanal}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {sdr.percentual.toFixed(1)}%
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(sdr.percentual, 100)}%` }}
                  />
                </div>

                {/* Comissão */}
                <div className="text-center min-w-[80px]">
                  <div className="text-sm font-semibold text-green-600">
                    R$ {sdr.comissao.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Comissão</div>
                </div>

                {/* Status */}
                <Button
                  size="sm"
                  variant="destructive" 
                  className="text-xs px-4 py-1 h-8 bg-red-500 hover:bg-red-600"
                >
                  Precisa melhorar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;