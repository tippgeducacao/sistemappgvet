import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, CalendarDays, Trash2, Clock, Users, MapPin, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/stores/AuthStore';
import { AgendamentoSDR } from '@/hooks/useAgendamentosSDR';
import { AgendamentosService } from '@/services/agendamentos/AgendamentosService';

interface MeusAgendamentosTabProps {
  agendamentos: AgendamentoSDR[];
  onRefresh: () => void;
}

const MeusAgendamentosTab: React.FC<MeusAgendamentosTabProps> = ({ agendamentos, onRefresh }) => {
  const { profile } = useAuthStore();
  const [reagendandoAgendamento, setReagendandoAgendamento] = useState<AgendamentoSDR | null>(null);
  const [dadosReagendamento, setDadosReagendamento] = useState({
    data_agendamento: '',
    data_fim_agendamento: ''
  });
  const [salvando, setSalvando] = useState(false);
  const [forcarAgendamento, setForcarAgendamento] = useState(false);
  const [conflitos, setConflitos] = useState<string[]>([]);


  // Filtrar apenas os agendamentos do SDR logado
  const meusAgendamentos = agendamentos.filter(ag => ag.sdr_id === profile?.id);

  const iniciarReagendamento = (agendamento: AgendamentoSDR) => {
    setReagendandoAgendamento(agendamento);
    setConflitos([]);
    setForcarAgendamento(false);
    
    const dataInicio = new Date(agendamento.data_agendamento);
    const dataFim = agendamento.data_fim_agendamento ? new Date(agendamento.data_fim_agendamento) : null;
    
    setDadosReagendamento({
      data_agendamento: format(dataInicio, "yyyy-MM-dd'T'HH:mm"),
      data_fim_agendamento: dataFim ? format(dataFim, "yyyy-MM-dd'T'HH:mm") : ''
    });
  };

  const verificarDisponibilidade = async () => {
    if (!reagendandoAgendamento || !dadosReagendamento.data_agendamento) return;

    try {
      const conflitosEncontrados: string[] = [];

      // Verificar horário de trabalho
      const horarioValido = await AgendamentosService.verificarHorarioTrabalho(
        reagendandoAgendamento.vendedor_id,
        dadosReagendamento.data_agendamento,
        dadosReagendamento.data_fim_agendamento
      );

      if (!horarioValido.valido) {
        conflitosEncontrados.push(horarioValido.motivo || 'Horário fora do expediente');
      }

      // Verificar conflitos de agenda (excluindo o próprio agendamento)
      const temConflito = await AgendamentosService.verificarConflitosAgenda(
        reagendandoAgendamento.vendedor_id,
        dadosReagendamento.data_agendamento
      );

      if (temConflito) {
        conflitosEncontrados.push('Conflito com outro agendamento existente');
      }

      setConflitos(conflitosEncontrados);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      toast.error('Erro ao verificar disponibilidade');
    }
  };

  // Verificar disponibilidade quando a data muda
  useEffect(() => {
    if (dadosReagendamento.data_agendamento) {
      verificarDisponibilidade();
    }
  }, [dadosReagendamento.data_agendamento, dadosReagendamento.data_fim_agendamento]);

  const salvarReagendamento = async () => {
    if (!reagendandoAgendamento) return;

    // Verificar se há conflitos e se não está forçando
    if (conflitos.length > 0 && !forcarAgendamento) {
      toast.error('Existem conflitos de agenda. Marque "Forçar agendamento" para prosseguir.');
      return;
    }

    setSalvando(true);
    try {
      const dadosAtualizacao: any = {
        data_agendamento: dadosReagendamento.data_agendamento
      };

      if (dadosReagendamento.data_fim_agendamento) {
        dadosAtualizacao.data_fim_agendamento = dadosReagendamento.data_fim_agendamento;
      }

      const { error } = await supabase
        .from('agendamentos')
        .update(dadosAtualizacao)
        .eq('id', reagendandoAgendamento.id)
        .eq('sdr_id', profile?.id);

      if (error) throw error;

      toast.success('Agendamento reagendado com sucesso!');
      setReagendandoAgendamento(null);
      onRefresh();
    } catch (error) {
      console.error('Erro ao reagendar agendamento:', error);
      toast.error('Erro ao reagendar agendamento');
    } finally {
      setSalvando(false);
    }
  };

  const cancelarAgendamento = async (agendamentoId: string) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          status: 'cancelado',
          observacoes: 'Cancelado pelo SDR'
        })
        .eq('id', agendamentoId)
        .eq('sdr_id', profile?.id); // Garantir que só pode cancelar seus próprios

      if (error) throw error;

      toast.success('Agendamento cancelado com sucesso!');
      onRefresh();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error('Erro ao cancelar agendamento');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'atrasado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'finalizado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'finalizado_venda': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'agendado': return 'Agendado';
      case 'atrasado': return 'Atrasado';
      case 'finalizado': return 'Finalizado';
      case 'finalizado_venda': return 'Finalizado - Venda';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Meus Agendamentos</h3>
          <p className="text-sm text-muted-foreground">
            Agendamentos que você criou - você pode reagendar e cancelar
          </p>
        </div>
        <Badge variant="outline">
          {meusAgendamentos.length} agendamento(s)
        </Badge>
      </div>

      {meusAgendamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Você ainda não criou nenhum agendamento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {meusAgendamentos.map((agendamento) => (
            <Card key={agendamento.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(agendamento.status)}>
                        {getStatusText(agendamento.status)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {agendamento.data_fim_agendamento && 
                          ` - ${format(new Date(agendamento.data_fim_agendamento), 'HH:mm')}`
                        }
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{agendamento.lead?.nome}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{agendamento.pos_graduacao_interesse}</span>
                      </div>

                      {agendamento.vendedor?.name && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Vendedor: {agendamento.vendedor.name}</span>
                        </div>
                      )}

                      {agendamento.observacoes && (
                        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {agendamento.observacoes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => iniciarReagendamento(agendamento)}
                      disabled={agendamento.status === 'cancelado'}
                    >
                      <CalendarDays className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelarAgendamento(agendamento.id)}
                      disabled={agendamento.status === 'cancelado'}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Reagendamento */}
      <Dialog open={!!reagendandoAgendamento} onOpenChange={() => setReagendandoAgendamento(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reagendar Agendamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nova Data e Hora de Início</label>
              <Input
                type="datetime-local"
                value={dadosReagendamento.data_agendamento}
                onChange={(e) => setDadosReagendamento(prev => ({ ...prev, data_agendamento: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Nova Data e Hora de Fim (opcional)</label>
              <Input
                type="datetime-local"
                value={dadosReagendamento.data_fim_agendamento}
                onChange={(e) => setDadosReagendamento(prev => ({ ...prev, data_fim_agendamento: e.target.value }))}
              />
            </div>

            {/* Mostrar conflitos encontrados */}
            {conflitos.length > 0 && (
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    Conflitos encontrados:
                  </span>
                </div>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {conflitos.map((conflito, index) => (
                    <li key={index}>• {conflito}</li>
                  ))}
                </ul>
                
                <div className="flex items-center gap-2 mt-3">
                  <Checkbox
                    id="forcar-agendamento"
                    checked={forcarAgendamento}
                    onCheckedChange={(checked) => setForcarAgendamento(checked === true)}
                  />
                  <label 
                    htmlFor="forcar-agendamento" 
                    className="text-sm font-medium text-yellow-800 dark:text-yellow-200"
                  >
                    Forçar reagendamento mesmo com conflitos
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReagendandoAgendamento(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={salvarReagendamento} 
                disabled={salvando || (conflitos.length > 0 && !forcarAgendamento)}
              >
                {salvando ? 'Reagendando...' : 'Reagendar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeusAgendamentosTab;