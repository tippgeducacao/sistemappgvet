import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Agendamento } from '@/hooks/useAgendamentos';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReunioesPlanilhaProps {
  agendamentos: Agendamento[];
  onAtualizarResultado: (id: string, resultado: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou', observacoes?: string) => Promise<boolean>;
}

const ReunioesPlanilha: React.FC<ReunioesPlanilhaProps> = ({
  agendamentos,
  onAtualizarResultado
}) => {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [observacoes, setObservacoes] = useState('');

  const getStatusBadge = (agendamento: Agendamento) => {
    if (agendamento.resultado_reuniao) {
      switch (agendamento.resultado_reuniao) {
        case 'nao_compareceu':
          return <Badge variant="destructive">Não Compareceu</Badge>;
        case 'compareceu_nao_comprou':
          return <Badge variant="secondary">Compareceu - Não Comprou</Badge>;
        case 'comprou':
          return <Badge variant="default">Comprou</Badge>;
      }
    }
    
    const dataReuniao = new Date(agendamento.data_agendamento);
    const agora = new Date();
    
    if (dataReuniao > agora) {
      return <Badge variant="outline">Agendado</Badge>;
    } else {
      return <Badge variant="outline">Pendente</Badge>;
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
      {agendamentos.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">Nenhuma reunião encontrada</p>
          </CardContent>
        </Card>
      ) : (
        agendamentos.map((agendamento) => (
          <Card key={agendamento.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold text-lg">{agendamento.lead?.nome}</h3>
                    {getStatusBadge(agendamento)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                    
                    {agendamento.lead?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {agendamento.lead.email}
                      </div>
                    )}
                    
                    {agendamento.lead?.whatsapp && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {agendamento.lead.whatsapp}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    SDR: {agendamento.sdr?.name}
                  </div>
                  
                  <div className="text-sm">
                    <strong>Interesse:</strong> {agendamento.pos_graduacao_interesse}
                  </div>
                  
                  {agendamento.observacoes && (
                    <div className="text-sm">
                      <strong>Observações:</strong> {agendamento.observacoes}
                    </div>
                  )}
                  
                  {agendamento.observacoes_resultado && (
                    <div className="text-sm">
                      <strong>Resultado:</strong> {agendamento.observacoes_resultado}
                    </div>
                  )}
                </div>
                
                {!agendamento.resultado_reuniao && (
                  <Button 
                    onClick={() => abrirDialog(agendamento)}
                    size="sm"
                  >
                    Marcar Resultado
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

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
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações sobre a reunião..."
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

export default ReunioesPlanilha;