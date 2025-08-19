import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, ExternalLink } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Agendamento } from '@/hooks/useAgendamentos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReunisoesCalendarioProps {
  agendamentos: Agendamento[];
  onAtualizarResultado: (id: string, resultado: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou', observacoes?: string) => Promise<boolean>;
}

const ReunisoesCalendario: React.FC<ReunisoesCalendarioProps> = ({
  agendamentos,
  onAtualizarResultado
}) => {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [observacoes, setObservacoes] = useState('');

  const mesAnterior = () => setMesAtual(subMonths(mesAtual, 1));
  const proximoMes = () => setMesAtual(addMonths(mesAtual, 1));

  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(mesAtual),
    end: endOfMonth(mesAtual)
  });

  const getAgendamentosDoDia = (dia: Date) => {
    return agendamentos.filter(agendamento => 
      isSameDay(new Date(agendamento.data_agendamento), dia)
      // Remover filtro de status para mostrar todos os agendamentos (incluindo finalizados)
    );
  };

  const getStatusColor = (agendamento: Agendamento) => {
    if (agendamento.resultado_reuniao) {
      switch (agendamento.resultado_reuniao) {
        case 'nao_compareceu':
          return 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive dark:border-destructive/40';
        case 'compareceu_nao_comprou':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/40';
        case 'comprou':
          return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40';
      }
    }
    
    const dataReuniao = new Date(agendamento.data_agendamento);
    const agora = new Date();
    
    if (dataReuniao > agora) {
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40';
    } else {
      return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleAtualizarResultado = async (resultado: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou') => {
    if (!agendamentoSelecionado) return;
    
    const sucesso = await onAtualizarResultado(agendamentoSelecionado.id, resultado, observacoes);
    if (sucesso) {
      setDialogAberto(false);
      setAgendamentoSelecionado(null);
      setObservacoes('');
    }
  };

  const abrirDialog = (agendamento: Agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setObservacoes(agendamento.observacoes_resultado || '');
    setDialogAberto(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={mesAnterior}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={proximoMes}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
              <div key={dia} className="text-center text-sm font-medium text-muted-foreground p-2">
                {dia}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {diasDoMes.map(dia => {
              const agendamentosDoDia = getAgendamentosDoDia(dia);
              const isOutsideMonth = !isSameMonth(dia, mesAtual);
              
              return (
                <div 
                  key={dia.toISOString()}
                  className={`
                    min-h-20 p-1 border rounded-lg transition-colors
                    ${isOutsideMonth ? 'bg-muted/50 text-muted-foreground' : 'bg-card'}
                    ${agendamentosDoDia.length > 0 ? 'border-primary/20' : 'border-border'}
                  `}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(dia, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {agendamentosDoDia.map(agendamento => (
                      <div
                        key={agendamento.id}
                        className={`
                          text-xs p-1 rounded border cursor-pointer transition-colors
                          ${getStatusColor(agendamento)}
                          hover:opacity-80
                        `}
                        onClick={() => !agendamento.resultado_reuniao && abrirDialog(agendamento)}
                      >
                        <div className="truncate font-medium">
                          {agendamento.lead?.nome}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(agendamento.data_agendamento), 'HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded dark:bg-blue-900/20 dark:border-blue-800/40"></div>
              <span>Agendado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted border border-border rounded"></div>
              <span>Pendente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive/10 border border-destructive/20 rounded dark:bg-destructive/20 dark:border-destructive/40"></div>
              <span>Não Compareceu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded dark:bg-yellow-900/20 dark:border-yellow-800/40"></div>
              <span>Não Comprou</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded dark:bg-green-900/20 dark:border-green-800/40"></div>
              <span>Comprou</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar Resultado da Reunião</DialogTitle>
          </DialogHeader>
          
          {agendamentoSelecionado && (
            <div className="space-y-4">
              <div className="text-sm">
                <strong>Lead:</strong> {agendamentoSelecionado.lead?.nome}
              </div>
              <div className="text-sm">
                <strong>Data:</strong> {format(new Date(agendamentoSelecionado.data_agendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
              <div className="text-sm">
                <strong>SDR:</strong> {agendamentoSelecionado.sdr?.name}
              </div>
              
              {agendamentoSelecionado.link_reuniao && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href={agendamentoSelecionado.link_reuniao.startsWith('http') 
                      ? agendamentoSelecionado.link_reuniao 
                      : `https://${agendamentoSelecionado.link_reuniao}`
                    } 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                   Acessar Reunião
                  </a>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações sobre a Reunião..."
                  className="min-h-20"
                />
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => handleAtualizarResultado('nao_compareceu')}
                  variant="destructive"
                  className="w-full"
                >
                  Lead Não Compareceu
                </Button>
                
                <Button 
                  onClick={() => handleAtualizarResultado('compareceu_nao_comprou')}
                  variant="secondary"
                  className="w-full"
                >
                  Compareceu mas Não Comprou
                </Button>
                
                <Button 
                  onClick={() => handleAtualizarResultado('comprou')}
                  variant="default"
                  className="w-full"
                >
                  Comprou
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReunisoesCalendario;