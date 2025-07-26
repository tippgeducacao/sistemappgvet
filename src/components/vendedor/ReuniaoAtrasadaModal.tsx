import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, User, Calendar, AlertTriangle } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/stores/AuthStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  onAtualizarResultado: () => void;
}

const ReuniaoAtrasadaModal: React.FC<ReuniaoAtrasadaModalProps> = ({
  isOpen,
  onClose,
  agendamentos,
  onAtualizarResultado
}) => {
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoAtrasado | null>(null);
  const [resultado, setResultado] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (agendamentos.length > 0) {
      setAgendamentoSelecionado(agendamentos[0]);
    }
  }, [agendamentos]);

  const handleSalvarResultado = async () => {
    if (!agendamentoSelecionado || !resultado) {
      toast.error('Selecione um resultado para a reunião');
      return;
    }

    setSalvando(true);
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({
          resultado_reuniao: resultado,
          observacoes_resultado: observacoes,
          data_resultado: new Date().toISOString(),
          status: 'realizado'
        })
        .eq('id', agendamentoSelecionado.id);

      if (error) throw error;

      toast.success('Resultado da reunião salvo com sucesso!');
      
      // Se há mais agendamentos atrasados, selecionar o próximo
      const proximoIndex = agendamentos.findIndex(ag => ag.id === agendamentoSelecionado.id) + 1;
      if (proximoIndex < agendamentos.length) {
        setAgendamentoSelecionado(agendamentos[proximoIndex]);
        setResultado('');
        setObservacoes('');
      } else {
        // Não há mais agendamentos atrasados
        onClose();
      }
      
      onAtualizarResultado();
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
      toast.error('Erro ao salvar resultado da reunião');
    } finally {
      setSalvando(false);
    }
  };

  const handlePularAgendamento = () => {
    const proximoIndex = agendamentos.findIndex(ag => ag.id === agendamentoSelecionado?.id) + 1;
    if (proximoIndex < agendamentos.length) {
      setAgendamentoSelecionado(agendamentos[proximoIndex]);
      setResultado('');
      setObservacoes('');
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
            Reunião Atrasada - Marcar Resultado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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

          {/* Resultado da Reunião */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="resultado">Resultado da Reunião *</Label>
              <Select value={resultado} onValueChange={setResultado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado da reunião" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compareceu">Compareceu</SelectItem>
                  <SelectItem value="nao_compareceu">Não Compareceu</SelectItem>
                  <SelectItem value="reagendou">Reagendou</SelectItem>
                  <SelectItem value="converteu">Converteu em Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações sobre o Resultado</Label>
              <Textarea
                id="observacoes"
                placeholder="Adicione observações sobre o resultado da reunião..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Contador de Agendamentos */}
          {agendamentos.length > 1 && (
            <div className="text-center text-sm text-muted-foreground">
              Agendamento {agendamentos.findIndex(ag => ag.id === agendamentoSelecionado.id) + 1} de {agendamentos.length} atrasados
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={handlePularAgendamento}
              disabled={salvando}
            >
              Pular para Próxima
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={salvando}
              >
                Fechar
              </Button>
              <Button 
                onClick={handleSalvarResultado}
                disabled={!resultado || salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Resultado'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReuniaoAtrasadaModal;