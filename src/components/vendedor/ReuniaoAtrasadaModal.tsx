import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, Calendar, AlertTriangle, CalendarDays } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppNavigation } from '@/hooks/useAppNavigation';

interface AgendamentoAtrasado {
  id: string;
  data_agendamento: string;
  data_fim_agendamento?: string;
  pos_graduacao_interesse: string;
  observacoes?: string;
  link_reuniao: string;
  lead?: {
    nome: string;
    email?: string;
    whatsapp?: string;
  };
}

interface ReuniaoAtrasadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamentos: AgendamentoAtrasado[];
}

const ReuniaoAtrasadaModal: React.FC<ReuniaoAtrasadaModalProps> = ({
  isOpen,
  onClose,
  agendamentos
}) => {
  const { navigateToSection } = useAppNavigation();
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoAtrasado | null>(null);

  useEffect(() => {
    if (agendamentos.length > 0) {
      setAgendamentoSelecionado(agendamentos[0]);
    }
  }, [agendamentos]);

  const handleIrParaReunioes = () => {
    onClose();
    navigateToSection('reunioes');
  };

  const handleProximoAgendamento = () => {
    const proximoIndex = agendamentos.findIndex(ag => ag.id === agendamentoSelecionado?.id) + 1;
    if (proximoIndex < agendamentos.length) {
      setAgendamentoSelecionado(agendamentos[proximoIndex]);
    } else {
      onClose();
    }
  };

  const formatarHorario = (agendamento: AgendamentoAtrasado) => {
    const inicio = format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR });
    
    if (agendamento.data_fim_agendamento) {
      const fim = format(new Date(agendamento.data_fim_agendamento), "HH:mm", { locale: ptBR });
      return `${inicio} - ${fim}`;
    }
    
    return inicio;
  };

  if (!agendamentoSelecionado) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Reunião Atrasada - Aviso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aviso Importante */}
          <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">⚠️ Atenção!</p>
                <p>Você possui reuniões atrasadas que precisam ter seu resultado marcado. Acesse a aba "Reuniões" para lançar os resultados e liberar novos agendamentos.</p>
              </div>
            </div>
          </div>

          {/* Informações da Reunião */}
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Detalhes da Reunião
                <Badge variant="destructive">Atrasada</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Lead:</strong> {agendamentoSelecionado.lead?.nome}
                </div>
                <div>
                  <strong>Data:</strong> {format(new Date(agendamentoSelecionado.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
                </div>
                <div>
                  <strong>Horário:</strong> {formatarHorario(agendamentoSelecionado)}
                </div>
                <div>
                  <strong>Pós-graduação:</strong> {agendamentoSelecionado.pos_graduacao_interesse}
                </div>
              </div>
              
              {agendamentoSelecionado.lead?.email && (
                <div className="text-sm">
                  <strong>Email:</strong> {agendamentoSelecionado.lead.email}
                </div>
              )}
              
              {agendamentoSelecionado.lead?.whatsapp && (
                <div className="text-sm">
                  <strong>WhatsApp:</strong> {agendamentoSelecionado.lead.whatsapp}
                </div>
              )}

              {agendamentoSelecionado.observacoes && (
                <div className="text-sm">
                  <strong>Observações:</strong> {agendamentoSelecionado.observacoes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contador de Agendamentos */}
          {agendamentos.length > 1 && (
            <div className="text-center text-sm text-muted-foreground">
              Reunião {agendamentos.findIndex(ag => ag.id === agendamentoSelecionado.id) + 1} de {agendamentos.length} atrasadas
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-between gap-3">
            {agendamentos.length > 1 && (
              <Button 
                variant="outline" 
                onClick={handleProximoAgendamento}
              >
                Próxima Reunião
              </Button>
            )}
            
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="outline" 
                onClick={onClose}
              >
                Fechar
              </Button>
              <Button 
                onClick={handleIrParaReunioes}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Ir para Reuniões
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReuniaoAtrasadaModal;