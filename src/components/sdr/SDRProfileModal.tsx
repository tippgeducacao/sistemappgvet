import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Target, Users, User } from 'lucide-react';
import { useNiveis } from '@/hooks/useNiveis';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import VendasFilter from '@/components/vendas/VendasFilter';

interface SDRProfileModalProps {
  sdrId?: string;
  sdrNome?: string;
  sdrPhoto?: string;
  sdrNivel?: string;
  sdrUserType?: string;
  selectedMonth: number;
  selectedYear: number;
  isOpen: boolean;
  onClose: () => void;
}

const SDRProfileModal: React.FC<SDRProfileModalProps> = ({
  sdrId,
  sdrNome,
  sdrPhoto,
  sdrNivel,
  sdrUserType,
  selectedMonth,
  selectedYear,
  isOpen,
  onClose
}) => {
  const { niveis } = useNiveis();
  const { metasSemanais } = useMetasSemanais();
  const [filtroMes, setFiltroMes] = useState(selectedMonth);
  const [filtroAno, setFiltroAno] = useState(selectedYear);

  if (!sdrId || !sdrNome) return null;

  // Encontrar configuração do nível do SDR
  const nivelConfig = niveis.find(n => n.nivel === sdrNivel && n.tipo_usuario === 'sdr');
  
  // Meta semanal de reuniões baseada no nível e tipo de SDR
  const metaReunioesSemanal = sdrUserType === 'sdr_inbound' 
    ? nivelConfig?.meta_semanal_inbound || 0
    : nivelConfig?.meta_semanal_outbound || 0;

  // Função para calcular as semanas que terminam no mês (quarta a terça)
  const getWeeksInMonth = (year: number, month: number) => {
    const weeks = [];
    
    // Encontrar a primeira terça-feira do mês
    const firstDayOfMonth = new Date(year, month - 1, 1);
    let firstTuesday = new Date(firstDayOfMonth);
    
    // Ajustar para a primeira terça-feira
    while (firstTuesday.getDay() !== 2) { // 2 = Tuesday
      firstTuesday.setDate(firstTuesday.getDate() + 1);
    }
    
    // Se a primeira terça-feira é muito tarde no mês (depois do dia 7),
    // verificar se existe uma semana anterior que termina neste mês
    if (firstTuesday.getDate() > 7) {
      firstTuesday.setDate(firstTuesday.getDate() - 7);
    }
    
    const lastDayOfMonth = new Date(year, month, 0);
    let currentTuesday = new Date(firstTuesday);
    
    // Contar todas as terças-feiras que estão no mês especificado
    while (currentTuesday.getMonth() === month - 1 && currentTuesday.getFullYear() === year) {
      const weekStart = new Date(currentTuesday);
      weekStart.setDate(weekStart.getDate() - 6); // Quarta-feira anterior (início da semana)
      
      weeks.push({
        start: weekStart,
        end: new Date(currentTuesday)
      });
      
      currentTuesday.setDate(currentTuesday.getDate() + 7);
    }
    
    return weeks;
  };

  // Função para calcular progresso semanal de reuniões (mock por enquanto)
  const getWeeklyProgress = (sdrId: string, year: number, month: number) => {
    const weeks = getWeeksInMonth(year, month);
    const currentDate = new Date();
    const currentWeekIndex = weeks.findIndex(week => 
      currentDate >= week.start && currentDate <= week.end
    );
    
    return weeks.map((week, index) => {
      // TODO: Implementar busca real de reuniões quando o sistema estiver pronto
      const reunioes = 0; // Por enquanto sempre 0
      
      return {
        week: index + 1,
        reunioes: reunioes,
        isCurrentWeek: index === currentWeekIndex,
        isPastWeek: index < currentWeekIndex,
        period: `${week.start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${week.end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
      };
    });
  };

  const weeks = getWeeksInMonth(filtroAno, filtroMes);
  const metaMensalReunioes = metaReunioesSemanal * weeks.length;
  const weeklyProgress = getWeeklyProgress(sdrId, filtroAno, filtroMes);
  
  // Calcular total de reuniões (mock)
  const totalReunioes = 0; // TODO: Implementar quando sistema de reuniões estiver pronto
  const progressPercentage = metaMensalReunioes > 0 ? (totalReunioes / metaMensalReunioes) * 100 : 0;

  const mesNome = new Date(filtroAno, filtroMes - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  const getSDRTypeLabel = (userType: string) => {
    switch (userType) {
      case 'sdr_inbound':
        return 'SDR Inbound';
      case 'sdr_outbound':
        return 'SDR Outbound';
      default:
        return 'SDR';
    }
  };

  const getNivelLabel = (nivel: string) => {
    if (nivel?.includes('junior')) return 'Júnior';
    if (nivel?.includes('pleno')) return 'Pleno';
    if (nivel?.includes('senior')) return 'Sênior';
    return nivel;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={sdrPhoto} alt={sdrNome} />
              <AvatarFallback>
                {sdrNome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{sdrNome}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {getSDRTypeLabel(sdrUserType || '')} - {getNivelLabel(sdrNivel || '')}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <div className={`w-2 h-2 rounded-full ${totalReunioes >= metaReunioesSemanal ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  Total: {totalReunioes} reuniões marcadas
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Visualizando: {mesNome}
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="metas" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metas" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Metas
            </TabsTrigger>
            <TabsTrigger value="reunioes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Reuniões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metas" className="space-y-4">
            <div className="flex gap-4 mb-4">
              <VendasFilter
                selectedMonth={filtroMes}
                selectedYear={filtroAno}
                onMonthChange={setFiltroMes}
                onYearChange={setFiltroAno}
              />
            </div>

            {nivelConfig ? (
              <>
                {/* Progresso geral */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Progresso Mensal - Reuniões
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Meta: {metaMensalReunioes} reuniões</span>
                        <span>{totalReunioes} / {metaMensalReunioes} ({Math.round(progressPercentage)}%)</span>
                      </div>
                      <Progress value={progressPercentage} className="h-3" />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Progresso semanal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Progresso Semanal (Meta: {metaReunioesSemanal} reuniões/semana)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {weeklyProgress.map((week) => (
                        <div key={week.week} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">
                                Semana {week.week}
                                {week.isCurrentWeek && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                                    Atual
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {week.period}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={metaReunioesSemanal > 0 ? (week.reunioes / metaReunioesSemanal) * 100 : 0} 
                                className="flex-1 h-2" 
                              />
                              <span className="text-xs font-medium min-w-fit">
                                {week.reunioes}/{metaReunioesSemanal}
                              </span>
                            </div>
                          </div>
                          {week.reunioes >= metaReunioesSemanal && (
                            <Target className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Informações do nível */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informações do Nível
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Fixo Mensal</span>
                        <p className="font-semibold">R$ {nivelConfig.fixo_mensal?.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Vale</span>
                        <p className="font-semibold">R$ {nivelConfig.vale?.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Variável Semanal</span>
                        <p className="font-semibold">R$ {nivelConfig.variavel_semanal?.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Meta Semanal</span>
                        <p className="font-semibold">{metaReunioesSemanal} reuniões</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">Configuração de nível não encontrada</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reunioes" className="space-y-4">
            <div className="flex gap-4 mb-4">
              <VendasFilter
                selectedMonth={filtroMes}
                selectedYear={filtroAno}
                onMonthChange={setFiltroMes}
                onYearChange={setFiltroAno}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Reuniões do Período
                  </span>
                  <Badge variant="outline">{totalReunioes} reuniões</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground mb-2">Sistema de reuniões em desenvolvimento</p>
                  <p className="text-sm text-muted-foreground">
                    Esta aba será configurada quando o sistema de reuniões estiver implementado.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SDRProfileModal;