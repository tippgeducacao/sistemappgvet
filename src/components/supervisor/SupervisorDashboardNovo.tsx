import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Target, TrendingUp } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SDRData {
  id: string;
  nome: string;
  reunioesRealizadas: number;
  metaSemanal: number;
  percentualAtingimento: number;
  comissao: number;
}

const SupervisorDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'Semana' | 'Mês'>('Semana');

  // Dados da semana atual dos SDRs (quarta a terça)
  const sdrsData: SDRData[] = [
    {
      id: '1',
      nome: 'Júlio',
      reunioesRealizadas: 18,
      metaSemanal: 55,
      percentualAtingimento: 32.7,
      comissao: 0
    },
    {
      id: '2', 
      nome: 'Regiane',
      reunioesRealizadas: 23,
      metaSemanal: 55,
      percentualAtingimento: 41.8,
      comissao: 0
    },
    {
      id: '3',
      nome: 'Ricael',
      reunioesRealizadas: 25,
      metaSemanal: 55,
      percentualAtingimento: 45.5,
      comissao: 0
    },
    {
      id: '4',
      nome: 'Leticia Carolina',
      reunioesRealizadas: 0,
      metaSemanal: 55,
      percentualAtingimento: 0.0,
      comissao: 0
    },
    {
      id: '5',
      nome: 'Debora',
      reunioesRealizadas: 39,
      metaSemanal: 55,
      percentualAtingimento: 70.9,
      comissao: 0
    }
  ];

  // Métricas do supervisor (B2B)
  const minhasReunioes = 10;
  const totalReunioesEquipe = sdrsData.reduce((acc, sdr) => acc + sdr.reunioesRealizadas, 0);
  const totalMetaEquipe = sdrsData.reduce((acc, sdr) => acc + sdr.metaSemanal, 0);
  const taxaAtingimentoMedia = (totalReunioesEquipe / totalMetaEquipe) * 100;
  const conversoes = 0;

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
              
              <Select value="8" disabled>
                <SelectTrigger className="w-32 bg-background">
                  <SelectValue placeholder="Agosto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">Agosto</SelectItem>
                </SelectContent>
              </Select>

              <Select value="2025" disabled>
                <SelectTrigger className="w-24 bg-background">
                  <SelectValue placeholder="2025" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === 'Semana' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('Semana')}
                className="bg-primary text-primary-foreground"
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
              <div className="text-3xl font-bold text-foreground">{totalReunioesEquipe}/{totalMetaEquipe}</div>
              <p className="text-sm text-muted-foreground">{taxaAtingimentoMedia.toFixed(1)}% atingido</p>
              <Progress 
                value={Math.min(taxaAtingimentoMedia, 100)} 
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

        {/* META COLETIVA - Dados Semanais */}
        <Card className="border border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-foreground">META COLETIVA</CardTitle>
            <p className="text-sm text-muted-foreground">Desempenho individual dos SDRs da sua equipe</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {sdrsData.map((sdr) => (
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

                {/* Métricas Semanais */}
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
                    <div className="text-sm font-medium text-green-600">R$ {sdr.comissao.toFixed(2)}</div>
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