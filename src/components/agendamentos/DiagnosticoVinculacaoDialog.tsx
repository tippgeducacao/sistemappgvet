import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Link, Search, CheckCircle2, AlertTriangle, User, Mail, Calendar, ArrowRight } from 'lucide-react';
import { useAgendamentoLinking } from '@/hooks/useAgendamentoLinking';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DiagnosticoVinculacaoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticoVinculacaoDialog: React.FC<DiagnosticoVinculacaoDialogProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const {
    agendamentosSemVinculo,
    isLoadingAgendamentos,
    isExecuting,
    executarVinculacaoAutomatica,
    vincularManualmente,
    refetchAgendamentos,
    buscarVendasCandidatas,
    isVinculandoManualmente
  } = useAgendamentoLinking();

  const [selectedAgendamento, setSelectedAgendamento] = useState<string | null>(null);
  const [showCandidates, setShowCandidates] = useState(false);

  const { data: vendasCandidatas, isLoading: isLoadingCandidatas } = 
    buscarVendasCandidatas(selectedAgendamento);

  const handleExecutarVinculacao = async () => {
    await executarVinculacaoAutomatica();
    await refetchAgendamentos();
  };

  const handleVincularManualmente = async (formEntryId: string) => {
    if (!selectedAgendamento) return;
    
    await vincularManualmente(selectedAgendamento, formEntryId);
    setSelectedAgendamento(null);
    setShowCandidates(false);
    await refetchAgendamentos();
  };

  const handleBuscarCandidatas = (agendamentoId: string) => {
    setSelectedAgendamento(agendamentoId);
    setShowCandidates(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Diagnóstico de Vinculação - Reuniões e Vendas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ações principais */}
          <div className="flex gap-3">
            <Button
              onClick={handleExecutarVinculacao}
              disabled={isExecuting || isLoadingAgendamentos}
              className="flex items-center gap-2"
            >
              {isExecuting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Vincular Automaticamente
            </Button>
            
            <Button
              variant="outline"
              onClick={() => refetchAgendamentos()}
              disabled={isLoadingAgendamentos}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingAgendamentos ? 'animate-spin' : ''}`} />
              Atualizar Lista
            </Button>
          </div>

          {/* Status geral */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isLoadingAgendamentos ? (
                'Carregando agendamentos...'
              ) : (
                `Encontrados ${agendamentosSemVinculo?.length || 0} agendamentos "comprou" sem venda vinculada`
              )}
            </AlertDescription>
          </Alert>

          {/* Lista de agendamentos sem vinculação */}
          {!showCandidates && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agendamentos Sem Vinculação</CardTitle>
                <CardDescription>
                  Reuniões com resultado "comprou" que não têm venda vinculada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  {agendamentosSemVinculo && agendamentosSemVinculo.length > 0 ? (
                    <div className="space-y-3">
                      {agendamentosSemVinculo.map((agendamento) => (
                        <div key={agendamento.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {format(new Date(agendamento.data_agendamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>Vendedor: {agendamento.vendedor?.name}</span>
                              </div>

                              {agendamento.sdr && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-blue-500" />
                                  <span>SDR: {agendamento.sdr?.name}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>Lead: {agendamento.lead?.nome} ({agendamento.lead?.email})</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Comprou
                              </Badge>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBuscarCandidatas(agendamento.id)}
                                className="flex items-center gap-1"
                              >
                                <Search className="h-3 w-3" />
                                Ver Candidatas
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p>Todos os agendamentos "comprou" já têm vendas vinculadas!</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Vendas candidatas */}
          {showCandidates && selectedAgendamento && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Vendas Candidatas</CardTitle>
                    <CardDescription>
                      Vendas que podem corresponder ao agendamento selecionado
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCandidates(false);
                      setSelectedAgendamento(null);
                    }}
                  >
                    Voltar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCandidatas ? (
                  <div className="text-center py-4">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Buscando vendas candidatas...</p>
                  </div>
                ) : vendasCandidatas && vendasCandidatas.length > 0 ? (
                  <div className="space-y-3">
                    {vendasCandidatas.map((venda) => (
                      <div key={venda.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{venda.alunos?.nome}</span>
                              <Badge variant="outline">
                                {venda.status === 'matriculado' 
                                  ? 'Matriculado' 
                                  : venda.status === 'desistiu' 
                                    ? 'Rejeitada' 
                                    : 'Pendente'
                                }
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{venda.alunos?.email}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Criada em: {format(new Date(venda.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                            </div>

                            {venda.cursos && (
                              <div className="text-sm text-muted-foreground">
                                Curso: {venda.cursos.nome}
                              </div>
                            )}
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleVincularManualmente(venda.id)}
                            disabled={isVinculandoManualmente}
                            className="flex items-center gap-2"
                          >
                            <ArrowRight className="h-3 w-3" />
                            Vincular
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                    <p>Nenhuma venda candidata encontrada para este agendamento.</p>
                    <p className="text-sm mt-2">
                      Verifique se a venda foi criada com os mesmos dados do lead.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};