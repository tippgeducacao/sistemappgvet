import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, FileText } from 'lucide-react';
import { useAgendamentosDetalhados } from '@/hooks/useAgendamentosDetalhados';
import LoadingState from '@/components/ui/loading-state';

interface VendedorReunioesModalProps {
  vendedorId: string;
  vendedorName: string;
  weekDate: Date;
  isOpen: boolean;
  onClose: () => void;
}

const VendedorReunioesModal: React.FC<VendedorReunioesModalProps> = ({
  vendedorId,
  vendedorName,
  weekDate,
  isOpen,
  onClose
}) => {
  const { agendamentos, isLoading } = useAgendamentosDetalhados(vendedorId, weekDate);

  const getResultadoBadge = (resultado: string) => {
    switch (resultado) {
      case 'comprou':
        return <Badge className="bg-blue-500">Comprou</Badge>;
      case 'compareceu_nao_comprou':
      case 'presente':
      case 'compareceu':
        return <Badge className="bg-yellow-500">Compareceu</Badge>;
      case 'nao_compareceu':
      case 'ausente':
        return <Badge className="bg-red-500">Não Compareceu</Badge>;
      default:
        return <Badge variant="secondary">{resultado}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finalizado':
        return <Badge className="bg-green-500">Finalizado</Badge>;
      case 'agendado':
        return <Badge className="bg-blue-500">Agendado</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-500">Cancelado</Badge>;
      case 'atrasado':
        return <Badge className="bg-orange-500">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Reuniões de {vendedorName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Semana de {weekDate.toLocaleDateString('pt-BR')} (quarta a terça)
          </p>
        </DialogHeader>

        {isLoading ? (
          <LoadingState message="Carregando reuniões..." />
        ) : agendamentos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma reunião encontrada para esta semana</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Atenção:</strong> Mostrando reuniões da semana específica (quarta a terça).
              Reuniões são contabilizadas pela data do resultado (quando finalizada) ou data do agendamento (se ainda não finalizada).
            </div>
            
            {agendamentos.map((agendamento) => (
              <div key={agendamento.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')}
                      </span>
                      <Clock className="w-4 h-4 text-muted-foreground ml-2" />
                      <span>
                        {new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    {agendamento.leads?.nome && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{agendamento.leads.nome}</span>
                        {agendamento.leads.whatsapp && (
                          <span className="text-sm text-muted-foreground">
                            • {agendamento.leads.whatsapp}
                          </span>
                        )}
                      </div>
                    )}

                    {agendamento.pos_graduacao_interesse && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{agendamento.pos_graduacao_interesse}</span>
                      </div>
                    )}

                    {agendamento.data_resultado && (
                      <div className="text-sm text-muted-foreground">
                        Resultado lançado em: {new Date(agendamento.data_resultado).toLocaleDateString('pt-BR')} às {new Date(agendamento.data_resultado).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}

                    {agendamento.observacoes_resultado && (
                      <div className="text-sm bg-muted p-2 rounded">
                        <strong>Observações:</strong> {agendamento.observacoes_resultado}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {getStatusBadge(agendamento.status)}
                    {agendamento.resultado_reuniao && getResultadoBadge(agendamento.resultado_reuniao)}
                  </div>
                </div>

                {agendamento.link_reuniao && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(agendamento.link_reuniao, '_blank')}
                    >
                      Abrir Link da Reunião
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VendedorReunioesModal;