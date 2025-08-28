import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, FileText, CheckCircle, Clock3, UserCheck, UserX } from 'lucide-react';
import { useAgendamentosDetalhados, type AgendamentoDetalhado, type VendaConvertida } from '@/hooks/useAgendamentosDetalhados';
import LoadingState from '@/components/ui/loading-state';
import { getDataEfetivaVenda } from '@/utils/vendaDateUtils';

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
  const { reunioesCategorizada, isLoading } = useAgendamentosDetalhados(vendedorId, weekDate);

  const renderAgendamento = (agendamento: AgendamentoDetalhado) => (
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

          {agendamento.observacoes_resultado && (
            <div className="text-sm bg-muted p-2 rounded">
              <strong>Observações:</strong> {agendamento.observacoes_resultado}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Badge variant={agendamento.status === 'finalizado' ? 'default' : 'secondary'}>
            {agendamento.status}
          </Badge>
          {agendamento.resultado_reuniao && (
            <Badge variant="outline">{agendamento.resultado_reuniao}</Badge>
          )}
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
  );

  const renderVendaConvertida = (venda: VendaConvertida) => (
    <div key={venda.id} className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="font-medium text-green-700">
              {getDataEfetivaVenda(venda).toLocaleDateString('pt-BR')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{venda.aluno_nome}</span>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{venda.curso_nome}</span>
          </div>

          {venda.data_agendamento ? (
            <div className="text-sm text-muted-foreground">
              Reunião original: {new Date(venda.data_agendamento).toLocaleDateString('pt-BR')}
            </div>
          ) : (
            <div className="text-sm text-orange-600">
              Sem vínculo com reunião
            </div>
          )}
        </div>

        <Badge className="bg-green-500 text-white">Convertida</Badge>
      </div>
    </div>
  );

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
        ) : (
          <div className="space-y-6">
            {/* Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Convertidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {reunioesCategorizada.convertidas.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-orange-500" />
                    Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {reunioesCategorizada.pendentes.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    Compareceram
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {reunioesCategorizada.compareceram.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-500" />
                    Não Compareceram
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {reunioesCategorizada.naoCompareceram.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Convertidas */}
            {reunioesCategorizada.convertidas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Vendas Convertidas ({reunioesCategorizada.convertidas.length})
                </h3>
                <div className="space-y-3">
                  {reunioesCategorizada.convertidas.map(renderVendaConvertida)}
                </div>
              </div>
            )}

            {/* Pendentes */}
            {reunioesCategorizada.pendentes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock3 className="w-5 h-5 text-orange-500" />
                  Reuniões Pendentes ({reunioesCategorizada.pendentes.length})
                </h3>
                <div className="space-y-3">
                  {reunioesCategorizada.pendentes.map(renderAgendamento)}
                </div>
              </div>
            )}

            {/* Compareceram */}
            {reunioesCategorizada.compareceram.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  Compareceram ({reunioesCategorizada.compareceram.length})
                </h3>
                <div className="space-y-3">
                  {reunioesCategorizada.compareceram.map(renderAgendamento)}
                </div>
              </div>
            )}

            {/* Não Compareceram */}
            {reunioesCategorizada.naoCompareceram.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <UserX className="w-5 h-5 text-red-500" />
                  Não Compareceram ({reunioesCategorizada.naoCompareceram.length})
                </h3>
                <div className="space-y-3">
                  {reunioesCategorizada.naoCompareceram.map(renderAgendamento)}
                </div>
              </div>
            )}

            {/* Mensagem se não houver dados */}
            {reunioesCategorizada.convertidas.length === 0 && 
             reunioesCategorizada.pendentes.length === 0 && 
             reunioesCategorizada.compareceram.length === 0 && 
             reunioesCategorizada.naoCompareceram.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma reunião encontrada para esta semana</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VendedorReunioesModal;