
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Target, TrendingUp } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const SupervisorDashboard: React.FC = () => {
  // Estados para filtros
  const [selectedMonth, setSelectedMonth] = useState<string>('8'); // Agosto
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedPeriod, setSelectedPeriod] = useState<'Semana' | 'Mês'>('Semana');

  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  // Dados mockados para teste
  const minhasReunioes = 10;
  const totalReunioesRealizadas = 46;
  const totalMeta = 120;
  const percentualAtingimento = 8.3;
  const conversoes = 0;

  const sdrsDetalhes = [
    { 
      id: '1', 
      nome: 'Júlio', 
      reunioesRealizadas: 18, 
      metaSemanal: 55, 
      percentualAtingimento: 32.7
    },
    { 
      id: '2', 
      nome: 'Regiane', 
      reunioesRealizadas: 23, 
      metaSemanal: 55, 
      percentualAtingimento: 41.8
    },
    { 
      id: '3', 
      nome: 'Ricael', 
      reunioesRealizadas: 25, 
      metaSemanal: 55, 
      percentualAtingimento: 45.5
    },
    { 
      id: '4', 
      nome: 'Leticia Carolina', 
      reunioesRealizadas: 0, 
      metaSemanal: 55, 
      percentualAtingimento: 0.0
    },
    { 
      id: '5', 
      nome: 'Debora', 
      reunioesRealizadas: 39, 
      metaSemanal: 55, 
      percentualAtingimento: 70.9
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard - Time SDR</h1>
            <p className="text-muted-foreground text-sm">Acompanhe o desempenho da sua equipe de SDRs</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Filtros */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Filtrar por período:</span>
              
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === 'Semana' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('Semana')}
              >
                Semana
              </Button>
              <Button
                variant={selectedPeriod === 'Mês' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('Mês')}
              >
                Mês
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Minhas Reuniões */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase">Minhas Reuniões</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{minhasReunioes}</div>
              <p className="text-sm text-muted-foreground">reuniões realizadas esta semana</p>
            </CardContent>
          </Card>

          {/* SUA META */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase">SUA META</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{totalReunioesRealizadas}/{totalMeta}</div>
              <p className="text-sm text-muted-foreground">{percentualAtingimento}% atingido</p>
              <Progress 
                value={Math.min(percentualAtingimento, 100)} 
                className="h-2 mt-2"
              />
            </CardContent>
          </Card>

          {/* CONVERSÕES */}
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase">CONVERSÕES</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{conversoes}</div>
              <p className="text-sm text-muted-foreground">conversões da equipe</p>
            </CardContent>
          </Card>
        </div>

        {/* META COLETIVA */}
        <Card className="border border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-foreground">META COLETIVA</CardTitle>
            <p className="text-sm text-muted-foreground">Desempenho individual dos SDRs da sua equipe</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {sdrsDetalhes.map((sdr) => (
              <div key={sdr.id} className="flex items-center justify-between p-4 bg-muted/10 rounded-lg border border-border/50">
                {/* Avatar e Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg">
                    <span>{sdr.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-base text-foreground">{sdr.nome}</h3>
                    <p className="text-sm text-muted-foreground">SDR</p>
                  </div>
                </div>

                {/* Métricas */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="font-bold text-lg text-foreground">
                      {sdr.reunioesRealizadas}/{sdr.metaSemanal}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sdr.percentualAtingimento.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="w-24">
                    <Progress 
                      value={Math.min(sdr.percentualAtingimento, 100)} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="text-center min-w-[80px]">
                    <div className="text-sm font-medium text-green-600">R$ 0,00</div>
                    <div className="text-xs text-muted-foreground">Comissão</div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Precisa melhorar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
