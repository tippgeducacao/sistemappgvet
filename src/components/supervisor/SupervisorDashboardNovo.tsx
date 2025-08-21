
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Calendar, Target, TrendingUp } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SDRData {
  id: string;
  nome: string;
  avatarColor: string;
  reunioesRealizadas: number;
  metaSemanal: number;
  percentualAtingimento: number;
  comissao: number;
}

const SupervisorDashboard: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState(0);

  // Função para calcular a semana atual
  const getCurrentWeek = (offset: number = 0) => {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + (offset * 7));
    
    // Encontrar a quarta-feira da semana
    const diaAtual = hoje.getDay();
    const diasAteQuarta = diaAtual === 0 ? -4 : 3 - diaAtual; // 3 = quarta
    
    const quartaFeira = new Date(hoje);
    quartaFeira.setDate(hoje.getDate() + diasAteQuarta);
    
    const tercaFeira = new Date(quartaFeira);
    tercaFeira.setDate(quartaFeira.getDate() + 6);
    
    return {
      inicio: quartaFeira,
      fim: tercaFeira
    };
  };

  const { inicio: inicioSemana, fim: fimSemana } = getCurrentWeek(weekOffset);
  
  const formatarData = (date: Date) => 
    date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekOffset(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  // Dados mockados dos SDRs baseados na imagem
  const sdrsData: SDRData[] = [
    {
      id: '1',
      nome: 'Júlio',
      avatarColor: 'bg-purple-500',
      reunioesRealizadas: 18,
      metaSemanal: 55,
      percentualAtingimento: 32.7,
      comissao: 0
    },
    {
      id: '2', 
      nome: 'Regiane',
      avatarColor: 'bg-pink-500',
      reunioesRealizadas: 23,
      metaSemanal: 55,
      percentualAtingimento: 41.8,
      comissao: 0
    },
    {
      id: '3',
      nome: 'Ricael', 
      avatarColor: 'bg-blue-500',
      reunioesRealizadas: 25,
      metaSemanal: 55,
      percentualAtingimento: 45.5,
      comissao: 0
    },
    {
      id: '4',
      nome: 'Leticia Carolina',
      avatarColor: 'bg-cyan-500',
      reunioesRealizadas: 0,
      metaSemanal: 55,
      percentualAtingimento: 0.0,
      comissao: 0
    },
    {
      id: '5',
      nome: 'Debora',
      avatarColor: 'bg-indigo-500',
      reunioesRealizadas: 39,
      metaSemanal: 55,
      percentualAtingimento: 70.9,
      comissao: 0
    }
  ];

  // Calcular métricas agregadas
  const totalReunioesEquipe = sdrsData.reduce((acc, sdr) => acc + sdr.reunioesRealizadas, 0);
  const totalMetaEquipe = sdrsData.reduce((acc, sdr) => acc + sdr.metaSemanal, 0);
  const taxaAtingimentoMedia = sdrsData.reduce((acc, sdr) => acc + sdr.percentualAtingimento, 0) / sdrsData.length;
  
  // Dados do supervisor (B2B)
  const minhasReunioes = 10;
  const conversoes = 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard - Time SDR</h1>
            <p className="text-sm text-muted-foreground">Acompanhe o desempenho da sua equipe de SDRs</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Navegador da Semana */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigateWeek('prev')}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Semana</p>
              <p className="text-lg font-bold text-foreground">
                {formatarData(inicioSemana)} - {formatarData(fimSemana)}
              </p>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigateWeek('next')}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Minhas Reuniões */}
          <Card className="border border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Minhas Reuniões
                </p>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{minhasReunioes}</div>
              <p className="text-sm text-muted-foreground">reuniões realizadas esta semana</p>
            </CardContent>
          </Card>

          {/* SUA META */}
          <Card className="border border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  SUA META
                </p>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {totalReunioesEquipe}/{totalMetaEquipe}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {taxaAtingimentoMedia.toFixed(1)}% atingido
              </p>
              <Progress value={Math.min(taxaAtingimentoMedia, 100)} className="h-2" />
            </CardContent>
          </Card>

          {/* CONVERSÕES */}
          <Card className="border border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  CONVERSÕES
                </p>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{conversoes}</div>
              <p className="text-sm text-muted-foreground">conversões da equipe</p>
            </CardContent>
          </Card>
        </div>

        {/* META COLETIVA */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-foreground">META COLETIVA</CardTitle>
            <p className="text-sm text-muted-foreground">
              Desempenho individual dos SDRs da sua equipe
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {sdrsData.map((sdr) => (
              <div 
                key={sdr.id} 
                className="flex items-center justify-between p-4 bg-muted/5 dark:bg-muted/10 rounded-lg border border-border/50 hover:bg-muted/10 dark:hover:bg-muted/20 transition-colors"
              >
                {/* Avatar e Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-12 h-12 ${sdr.avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0`}>
                    {sdr.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-base text-foreground truncate">{sdr.nome}</h3>
                    <p className="text-sm text-muted-foreground">SDR</p>
                  </div>
                </div>

                {/* Métricas */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Performance */}
                  <div className="text-center min-w-[80px]">
                    <div className="font-bold text-lg text-foreground">
                      {sdr.reunioesRealizadas}/{sdr.metaSemanal}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sdr.percentualAtingimento.toFixed(1)}%
                    </div>
                  </div>
                  
                  {/* Barra de Progresso */}
                  <div className="w-20 hidden sm:block">
                    <Progress 
                      value={Math.min(sdr.percentualAtingimento, 100)} 
                      className="h-2"
                    />
                  </div>
                  
                  {/* Comissão */}
                  <div className="text-center min-w-[80px] hidden md:block">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">
                      R$ {sdr.comissao.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Comissão</div>
                  </div>
                  
                  {/* Status Button */}
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 h-8"
                  >
                    Precisa melhorar
                  </Button>
                </div>
              </div>
            ))}

            {/* Resumo da Equipe */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa média de atingimento da equipe:</span>
                <span className="font-semibold text-foreground">
                  {taxaAtingimentoMedia.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default SupervisorDashboard;
