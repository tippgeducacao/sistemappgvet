import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, MapPin, Clock, Link, FileText, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AgendamentoSDR } from '@/hooks/useAgendamentosSDR';

interface AgendamentoDetailsModalProps {
  agendamento: AgendamentoSDR | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AgendamentoDetailsModal: React.FC<AgendamentoDetailsModalProps> = ({
  agendamento,
  open,
  onOpenChange,
}) => {
  if (!agendamento) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'atrasado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'finalizado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'finalizado_venda': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'cancelado': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'agendado': return 'Agendado';
      case 'atrasado': return 'Atrasado';
      case 'finalizado': return 'Finalizado';
      case 'finalizado_venda': return 'Finalizado - Venda';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getResultadoColor = (resultado: string) => {
    switch (resultado) {
      case 'comprou': return 'default';
      case 'nao_compareceu': return 'destructive';
      case 'compareceu_nao_comprou': return 'secondary';
      default: return 'outline';
    }
  };

  const getResultadoText = (resultado: string) => {
    switch (resultado) {
      case 'comprou': return 'Comprou';
      case 'nao_compareceu': return 'Não Compareceu';
      case 'compareceu_nao_comprou': return 'Compareceu e não comprou';
      default: return resultado;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detalhes do Agendamento
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o agendamento
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status e Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Status e Horário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={getStatusColor(agendamento.status)}>
                  {getStatusText(agendamento.status)}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <span className="text-sm font-medium">Data e hora:</span>
                <p className="text-sm">
                  {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {agendamento.data_fim_agendamento && 
                    ` - ${format(new Date(agendamento.data_fim_agendamento), 'HH:mm')}`
                  }
                </p>
              </div>

              {agendamento.link_reuniao && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">Link da reunião:</span>
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-blue-600" />
                    <a 
                      href={agendamento.link_reuniao} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {agendamento.link_reuniao}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Lead */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Informações do Lead
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agendamento.lead && (
                <>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Nome:</span>
                    <p className="text-sm">{agendamento.lead.nome}</p>
                  </div>

                  {agendamento.lead.email && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Email:</span>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <p className="text-sm">{agendamento.lead.email}</p>
                      </div>
                    </div>
                  )}

                  {agendamento.lead.whatsapp && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium">WhatsApp:</span>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <p className="text-sm">{agendamento.lead.whatsapp}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="space-y-1">
                <span className="text-sm font-medium">Interesse:</span>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  <p className="text-sm">{agendamento.pos_graduacao_interesse}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pessoas Envolvidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Equipe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <span className="text-sm font-medium">SDR ID:</span>
                <p className="text-sm">{agendamento.sdr_id}</p>
              </div>

              {agendamento.vendedor?.name && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">Vendedor:</span>
                  <p className="text-sm">{agendamento.vendedor.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          {(agendamento.observacoes || agendamento.observacoes_resultado) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {agendamento.observacoes && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Observações do agendamento:</span>
                    <div className="text-sm bg-muted/50 p-3 rounded-md">
                      {agendamento.observacoes}
                    </div>
                  </div>
                )}

                {agendamento.observacoes_resultado && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Observações do resultado:</span>
                    <div className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
                      {agendamento.observacoes_resultado}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resultado da Reunião */}
        {agendamento.resultado_reuniao && (
          <>
            <Separator className="my-4" />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Resultado da Reunião
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Resultado:</span>
                  <Badge variant={getResultadoColor(agendamento.resultado_reuniao)}>
                    {getResultadoText(agendamento.resultado_reuniao)}
                  </Badge>
                </div>

                {agendamento.data_resultado && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Horário de fechamento:</span>
                    <p className="text-sm">
                      {format(new Date(agendamento.data_resultado), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AgendamentoDetailsModal;