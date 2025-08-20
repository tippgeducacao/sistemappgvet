import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AgendamentoSDR } from '@/hooks/useAgendamentosSDR';
import { useAuthStore } from '@/stores/AuthStore';
import { supabase } from '@/integrations/supabase/client';

interface MeusAgendamentosCalendarioProps {
  agendamentosAtivos: AgendamentoSDR[];
}

const MeusAgendamentosCalendario: React.FC<MeusAgendamentosCalendarioProps> = ({
  agendamentosAtivos
}) => {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [historicoReunioes, setHistoricoReunioes] = useState<AgendamentoSDR[]>([]);
  const { profile } = useAuthStore();

  // Buscar histórico completo de reuniões
  useEffect(() => {
    const fetchHistorico = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('agendamentos')
          .select(`
            *,
            lead:leads!agendamentos_lead_id_fkey (
              nome,
              email,
              whatsapp
            ),
            vendedor:profiles!agendamentos_vendedor_id_fkey (
              name,
              email
            ),
            sdr:profiles!agendamentos_sdr_id_fkey (
              name,
              email
            )
          `)
          .eq('sdr_id', profile.id)
          .order('data_agendamento', { ascending: false });

        if (!error && data) {
          setHistoricoReunioes(data as AgendamentoSDR[]);
        }
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      }
    };

    fetchHistorico();
  }, [profile?.id]);

  // Combinar agendamentos ativos com histórico, removendo duplicatas
  const todosAgendamentos = [...agendamentosAtivos];
  
  // Adicionar agendamentos do histórico que não estão nos ativos
  historicoReunioes.forEach(historico => {
    if (!agendamentosAtivos.some(ativo => ativo.id === historico.id)) {
      todosAgendamentos.push(historico);
    }
  });

  const mesAnterior = () => setMesAtual(subMonths(mesAtual, 1));
  const proximoMes = () => setMesAtual(addMonths(mesAtual, 1));

  // Criar grade completa do calendário (semanas completas)
  const inicioCalendario = startOfWeek(startOfMonth(mesAtual), { weekStartsOn: 0 }); // Começar no domingo
  const fimCalendario = endOfWeek(endOfMonth(mesAtual), { weekStartsOn: 0 });
  
  const diasDoCalendario = eachDayOfInterval({
    start: inicioCalendario,
    end: fimCalendario
  });

  const getAgendamentosDoDia = (dia: Date) => {
    return todosAgendamentos.filter(agendamento => 
      isSameDay(new Date(agendamento.data_agendamento), dia)
    );
  };

  const getStatusColor = (agendamento: AgendamentoSDR) => {
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
    
    switch (agendamento.status) {
      case 'agendado':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40';
      case 'atrasado':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40';
      case 'finalizado':
      case 'finalizado_venda':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40';
      case 'cancelado':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800/40';
      case 'remarcado':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/40';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
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
          {diasDoCalendario.map(dia => {
            const agendamentosDoDia = getAgendamentosDoDia(dia);
            const isOutsideMonth = !isSameMonth(dia, mesAtual);
            
            return (
              <div 
                key={dia.toISOString()}
                className={`
                  min-h-24 p-1 border rounded-lg transition-colors
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
                        text-xs p-1 rounded border transition-colors
                        ${getStatusColor(agendamento)}
                      `}
                    >
                      <div className="truncate font-medium">
                        {agendamento.lead?.nome}
                      </div>
                      <div className="flex items-center gap-1 truncate">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        {format(new Date(agendamento.data_agendamento), 'HH:mm')}
                      </div>
                      {agendamento.vendedor?.name && (
                        <div className="flex items-center gap-1 truncate">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{agendamento.vendedor.name}</span>
                        </div>
                      )}
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
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded dark:bg-red-900/20 dark:border-red-800/40"></div>
            <span>Atrasado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded dark:bg-orange-900/20 dark:border-orange-800/40"></div>
            <span>Remarcado</span>
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
            <span>Finalizado/Comprou</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded dark:bg-gray-900/20 dark:border-gray-800/40"></div>
            <span>Cancelado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MeusAgendamentosCalendario;