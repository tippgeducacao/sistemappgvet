import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, User, Phone, Mail, ExternalLink, Plus, Edit, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Agendamento } from '@/hooks/useAgendamentos';

interface AgendamentoDetailsModalProps {
  agendamento: Agendamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  observacoes: string;
  setObservacoes: (observacoes: string) => void;
  onAtualizarResultado: (resultado: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou') => void;
  onCriarVenda: () => void;
  onRemarcar?: (agendamento: Agendamento) => void;
  onEditarStatus?: (agendamento: Agendamento) => void;
  isHistorico?: boolean;
}

const AgendamentoDetailsModal: React.FC<AgendamentoDetailsModalProps> = ({
  agendamento,
  open,
  onOpenChange,
  observacoes,
  setObservacoes,
  onAtualizarResultado,
  onCriarVenda,
  onRemarcar,
  onEditarStatus,
  isHistorico = false
}) => {
  if (!agendamento) return null;

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
    
    const statusValidos = ['agendado', 'atrasado', 'cancelado', 'realizado', 'reagendado', 'remarcado'];
    const status = agendamento.status?.toLowerCase().trim();
    
    if (!status || !statusValidos.includes(status)) {
      return <Badge variant="outline">Agendado</Badge>;
    }
    
    switch (status) {
      case 'agendado':
        return <Badge variant="outline">Agendado</Badge>;
      case 'atrasado':
        return <Badge variant="destructive">Atrasado</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'realizado':
        return <Badge variant="secondary">Realizado</Badge>;
      case 'reagendado':
        return <Badge variant="outline">Reagendado</Badge>;
      case 'remarcado':
        return <Badge variant="secondary">Remarcado</Badge>;
      default:
        return <Badge variant="outline">Agendado</Badge>;
    }
  };

  const formatarHorario = (agendamento: Agendamento) => {
    const inicio = format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR });
    
    if (agendamento.data_fim_agendamento) {
      const fim = format(new Date(agendamento.data_fim_agendamento), "HH:mm", { locale: ptBR });
      return `${inicio} - ${fim}`;
    }
    
    return inicio;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {agendamento.resultado_reuniao ? 'Detalhes da Reunião' : 'Detalhes do Agendamento'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações do Lead */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações do Lead
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <strong>Nome:</strong> {agendamento.lead?.nome || 'Não informado'}
              </div>
              {agendamento.lead?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <strong>Email:</strong> {agendamento.lead.email}
                </div>
              )}
              {agendamento.lead?.whatsapp && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <strong>WhatsApp:</strong> {agendamento.lead.whatsapp}
                </div>
              )}
              {agendamento.pos_graduacao_interesse && (
                <div>
                  <strong>Interesse:</strong> {agendamento.pos_graduacao_interesse}
                </div>
              )}
            </div>
          </div>

          {/* Informações da Reunião */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Informações da Reunião
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <strong>Data:</strong> {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
              </div>
              <div>
                <strong>Horário:</strong> {formatarHorario(agendamento)}
              </div>
              <div>
                <strong>Vendedor:</strong> {agendamento.vendedor?.name || 'Não informado'}
              </div>
              <div>
                <strong>SDR Responsável:</strong> {agendamento.sdr?.name || 'Não informado'}
              </div>
              <div>
                <strong>Status:</strong> {getStatusBadge(agendamento)}
              </div>
              <div>
                <strong>Criado em:</strong> {format(new Date(agendamento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
              {agendamento.status === 'remarcado' && (
                <div>
                  <strong>Última atualização:</strong> {format(new Date(agendamento.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              )}
            </div>

            {/* Informação sobre remarcação */}
            {agendamento.status === 'remarcado' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Reunião Remarcada pelo Vendedor
                </div>
                <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                  Esta reunião foi remarcada em {format(new Date(agendamento.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}

            {agendamento.link_reuniao && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4" />
                <a 
                  href={agendamento.link_reuniao.startsWith('http') 
                    ? agendamento.link_reuniao 
                    : `https://${agendamento.link_reuniao}`
                  } 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Acessar Reunião
                </a>
              </div>
            )}

            {agendamento.observacoes && (
              <div className="text-sm">
                <strong>Observações do Agendamento:</strong> 
                <p className="mt-1 text-muted-foreground">{agendamento.observacoes}</p>
              </div>
            )}

            {agendamento.observacoes_resultado && (
              <div className="text-sm">
                <strong>Observações do Resultado:</strong> 
                <p className="mt-1 text-muted-foreground">{agendamento.observacoes_resultado}</p>
              </div>
            )}

            {agendamento.data_resultado && (
              <div className="text-sm">
                <strong>Horário de Fechamento:</strong> 
                <p className="mt-1 text-muted-foreground">
                  {format(new Date(agendamento.data_resultado), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4 border-t">
            {isHistorico ? (
              <>
                {onRemarcar && (
                  <Button 
                    onClick={() => onRemarcar(agendamento)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Remarcar
                  </Button>
                )}
                {onEditarStatus && (
                  <Button 
                    onClick={() => onEditarStatus(agendamento)}
                    size="sm"
                    variant="ghost"
                    className="flex items-center gap-1"
                  >
                    <Settings className="h-3 w-3" />
                    Status
                  </Button>
                )}
              </>
            ) : !agendamento.resultado_reuniao && (
              <>
                <Button 
                  onClick={() => onAtualizarResultado('nao_compareceu')}
                  variant="destructive"
                  size="sm"
                >
                  Não Compareceu
                </Button>
                
                <Button 
                  onClick={() => onAtualizarResultado('compareceu_nao_comprou')}
                  variant="secondary"
                  size="sm"
                >
                  Não Comprou
                </Button>
                
                <Button 
                  onClick={onCriarVenda}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-3 w-3" />
                  Criar Venda
                </Button>
              </>
            )}
          </div>

          {/* Marcar Resultado - só aparece se não tiver resultado ainda e não for histórico */}
          {!agendamento.resultado_reuniao && !isHistorico && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Observações da Reunião</h3>
              
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgendamentoDetailsModal;