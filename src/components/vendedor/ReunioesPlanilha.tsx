import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, User, Phone, Mail, ExternalLink, Plus, Edit, Search } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Agendamento } from '@/hooks/useAgendamentos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import NovaVendaForm from '@/components/NovaVendaForm';
import { useFormStore } from '@/store/FormStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ReunioesPlanilhaProps {
  agendamentos: Agendamento[];
  onAtualizarResultado: (id: string, resultado: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou', observacoes?: string) => Promise<boolean>;
  onRefresh?: () => void;
}


const ReunioesPlanilha: React.FC<ReunioesPlanilhaProps> = ({
  agendamentos,
  onAtualizarResultado,
  onRefresh
}) => {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novaVendaAberto, setNovaVendaAberto] = useState(false);
  const [remarcarDialogAberto, setRemarcarDialogAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novaHoraInicio, setNovaHoraInicio] = useState('');
  const [novaHoraFim, setNovaHoraFim] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { updateField, clearForm } = useFormStore();

  // Separar reuniões em agendadas (sem resultado) e histórico (com resultado) com filtro de pesquisa
  const { reunioesAgendadas, reunioesHistorico } = useMemo(() => {
    const filteredAgendamentos = agendamentos.filter(agendamento => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return agendamento.lead?.nome?.toLowerCase().includes(searchLower);
      }
      return true;
    });

    const agendadas = filteredAgendamentos.filter(agendamento => !agendamento.resultado_reuniao);
    const historico = filteredAgendamentos.filter(agendamento => agendamento.resultado_reuniao);
    
    return {
      reunioesAgendadas: agendadas,
      reunioesHistorico: historico
    };
  }, [agendamentos, searchTerm]);

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
    
    // Não criar status "pendente" visual - usar apenas status válidos do banco
    const statusValidos = ['agendado', 'atrasado', 'cancelado', 'realizado', 'reagendado', 'remarcado'];
    const status = agendamento.status?.toLowerCase().trim();
    
    if (!status || !statusValidos.includes(status)) {
      console.warn(`Status inválido detectado: "${agendamento.status}". Tratando como "agendado".`);
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
  };
  };

  const isReuniaoPerdida = (agendamento: Agendamento) => {
    if (agendamento.resultado_reuniao) return false;
    
    const dataFim = agendamento.data_fim_agendamento 
      ? new Date(agendamento.data_fim_agendamento)
      : new Date(new Date(agendamento.data_agendamento).getTime() + 60 * 60 * 1000); // 1 hora depois se não tiver fim
    
    return isAfter(new Date(), dataFim);
  };

  const formatarHorario = (agendamento: Agendamento) => {
    const inicio = format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR });
    
    if (agendamento.data_fim_agendamento) {
      const fim = format(new Date(agendamento.data_fim_agendamento), "HH:mm", { locale: ptBR });
      return `${inicio} - ${fim}`;
    }
    
    return inicio;
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

  const abrirNovaVenda = (agendamento: Agendamento) => {
    // Limpar formulário primeiro
    clearForm();
    
    // Preencher dados do lead
    if (agendamento.lead) {
      if (agendamento.lead.nome) {
        updateField('nomeAluno', agendamento.lead.nome);
      }
      if (agendamento.lead.email) {
        updateField('emailAluno', agendamento.lead.email);
      }
      if (agendamento.lead.whatsapp) {
        updateField('telefone', agendamento.lead.whatsapp);
      }
    }
    
    // Adicionar observação sobre origem da venda
    const observacaoOrigem = `Venda originada da reunião do dia ${format(new Date(agendamento.data_agendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
    updateField('observacoes', observacaoOrigem);
    
    // Adicionar ID do agendamento para controle
    console.log('🆔 Definindo agendamentoId no formulário:', agendamento.id);
    updateField('agendamentoId', agendamento.id);
    
    // Adicionar ID do SDR que criou o agendamento
    if (agendamento.sdr_id) {
      console.log('🧑‍💼 Definindo sdrId no formulário:', agendamento.sdr_id);
      updateField('sdrId', agendamento.sdr_id);
    }
    
    setAgendamentoSelecionado(agendamento);
    setNovaVendaAberto(true);
  };

  const abrirRemarcarDialog = (agendamento: Agendamento, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgendamentoSelecionado(agendamento);
    
    // Preencher com valores atuais
    const dataAtual = format(new Date(agendamento.data_agendamento), "yyyy-MM-dd");
    const horaInicio = format(new Date(agendamento.data_agendamento), "HH:mm");
    const horaFim = agendamento.data_fim_agendamento 
      ? format(new Date(agendamento.data_fim_agendamento), "HH:mm")
      : '';
    
    setNovaData(dataAtual);
    setNovaHoraInicio(horaInicio);
    setNovaHoraFim(horaFim);
    setRemarcarDialogAberto(true);
  };

  const handleRemarcarReuniao = async () => {
    if (!agendamentoSelecionado || !novaData || !novaHoraInicio) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos a data e hora de início",
        variant: "destructive",
      });
      return;
    }

    try {
      // Construir nova data de agendamento
      const novaDataAgendamento = new Date(`${novaData}T${novaHoraInicio}:00`);
      let novaDataFim = null;
      
      if (novaHoraFim) {
        novaDataFim = new Date(`${novaData}T${novaHoraFim}:00`);
      } else {
        // Se não especificou hora fim, usa 1 hora como padrão
        novaDataFim = new Date(novaDataAgendamento.getTime() + 60 * 60 * 1000);
      }

      // Verificar se a nova data/hora é no futuro
      const agora = new Date();
      if (novaDataAgendamento <= agora) {
        toast({
          title: "Erro",
          description: "Não é possível remarcar para uma data/hora que já passou",
          variant: "destructive",
        });
        return;
      }

      // Importar o serviço de agendamentos dinamicamente
      const { AgendamentosService } = await import('@/services/agendamentos/AgendamentosService');
      
      // Verificar conflitos de agenda (ignorando o próprio agendamento)
      const temConflito = await AgendamentosService.verificarConflitosAgenda(
        agendamentoSelecionado.vendedor_id,
        novaDataAgendamento.toISOString(),
        novaDataFim.toISOString(),
        agendamentoSelecionado.id // Ignorar este agendamento na verificação
      );

      if (temConflito) {
        toast({
          title: "Conflito de Agenda",
          description: "Já existe uma reunião agendada neste horário. Escolha outro horário.",
          variant: "destructive",
        });
        return;
      }

      // Se chegou até aqui, não há conflitos - pode remarcar
      const { error } = await supabase
        .from('agendamentos')
        .update({
          data_agendamento: novaDataAgendamento.toISOString(),
          data_fim_agendamento: novaDataFim.toISOString(),
          status: 'remarcado'
        })
        .eq('id', agendamentoSelecionado.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Reunião remarcada com sucesso!",
      });

      setRemarcarDialogAberto(false);
      setAgendamentoSelecionado(null);
      
      // Recarregar dados usando callback se disponível
      if (onRefresh) {
        onRefresh();
      }
      
    } catch (error) {
      console.error('Erro ao remarcar reunião:', error);
      toast({
        title: "Erro",
        description: "Erro ao remarcar a reunião. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRemarcarHistorico = async (agendamento: Agendamento, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({
          status: 'remarcado',
          resultado_reuniao: null,
          data_resultado: null,
          observacoes_resultado: null
        })
        .eq('id', agendamento.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Reunião remarcada e movida para agendadas!",
      });

      if (onRefresh) {
        onRefresh();
      }
      
    } catch (error) {
      console.error('Erro ao remarcar reunião:', error);
      toast({
        title: "Erro",
        description: "Erro ao remarcar a reunião. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const renderTabela = (listaAgendamentos: Agendamento[], mostrarAcoes: boolean = true, isHistorico: boolean = false) => (
    listaAgendamentos.length === 0 ? (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-muted-foreground">Nenhuma reunião encontrada</p>
        </CardContent>
      </Card>
    ) : (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reunião</TableHead>
                {mostrarAcoes && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {listaAgendamentos.map((agendamento) => (
                <TableRow 
                  key={agendamento.id}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    isReuniaoPerdida(agendamento) ? 'bg-destructive/10 text-destructive' : ''
                  }`}
                  onClick={() => abrirDialog(agendamento)}
                >
                  <TableCell className="font-medium">
                    {agendamento.lead?.nome}
                  </TableCell>
                  <TableCell>
                    {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {formatarHorario(agendamento)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(agendamento)}
                  </TableCell>
                  <TableCell>
                    {agendamento.link_reuniao && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            agendamento.link_reuniao.startsWith('http') 
                              ? agendamento.link_reuniao 
                              : `https://${agendamento.link_reuniao}`,
                            '_blank'
                          );
                        }}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Acessar
                      </Button>
                    )}
                  </TableCell>
                  {mostrarAcoes && (
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {isHistorico ? (
                          <Button 
                            onClick={(e) => handleRemarcarHistorico(agendamento, e)}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Remarcar
                          </Button>
                        ) : !agendamento.resultado_reuniao && (
                          <>
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDialog(agendamento);
                              }}
                              size="sm"
                              variant="outline"
                            >
                              Marcar Resultado
                            </Button>
                            <Button 
                              onClick={(e) => abrirRemarcarDialog(agendamento, e)}
                              size="sm"
                              variant="ghost"
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Remarcar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  );

  return (
    <div className="space-y-4">
      {/* Filtro de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por nome do lead..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="agendadas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agendadas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agendadas ({reunioesAgendadas.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Histórico ({reunioesHistorico.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="agendadas" className="space-y-4">
          {renderTabela(reunioesAgendadas, true, false)}
        </TabsContent>
        
        <TabsContent value="historico" className="space-y-4">
          {renderTabela(reunioesHistorico, true, true)}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {agendamentoSelecionado?.resultado_reuniao ? 'Detalhes da Reunião' : 'Marcar Resultado da Reunião'}
            </DialogTitle>
          </DialogHeader>
          
          {agendamentoSelecionado && (
            <div className="space-y-6">
              {/* Informações do Lead */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Lead
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Nome:</strong> {agendamentoSelecionado.lead?.nome}
                  </div>
                  {agendamentoSelecionado.lead?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <strong>Email:</strong> {agendamentoSelecionado.lead.email}
                    </div>
                  )}
                  {agendamentoSelecionado.lead?.whatsapp && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <strong>WhatsApp:</strong> {agendamentoSelecionado.lead.whatsapp}
                    </div>
                  )}
                  <div>
                    <strong>Interesse:</strong> {agendamentoSelecionado.pos_graduacao_interesse}
                  </div>
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
                    <strong>Data:</strong> {format(new Date(agendamentoSelecionado.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div>
                    <strong>Horário:</strong> {formatarHorario(agendamentoSelecionado)}
                  </div>
                  <div>
                    <strong>SDR Responsável:</strong> {agendamentoSelecionado.sdr?.name || 'Não informado'}
                  </div>
                  <div>
                    <strong>Status:</strong> {getStatusBadge(agendamentoSelecionado)}
                  </div>
                  <div>
                    <strong>Criado em:</strong> {format(new Date(agendamentoSelecionado.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  {agendamentoSelecionado.status === 'remarcado' && (
                    <div>
                      <strong>Última atualização:</strong> {format(new Date(agendamentoSelecionado.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  )}
                </div>

                {/* Informação sobre remarcação */}
                {agendamentoSelecionado.status === 'remarcado' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      Reunião Remarcada pelo Vendedor
                    </div>
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                      Esta reunião foi remarcada em {format(new Date(agendamentoSelecionado.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}

                {agendamentoSelecionado.link_reuniao && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    <a 
                      href={agendamentoSelecionado.link_reuniao.startsWith('http') 
                        ? agendamentoSelecionado.link_reuniao 
                        : `https://${agendamentoSelecionado.link_reuniao}`
                      } 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Acessar Reunião
                    </a>
                  </div>
                )}

                {agendamentoSelecionado.observacoes && (
                  <div className="text-sm">
                    <strong>Observações do Agendamento:</strong> 
                    <p className="mt-1 text-muted-foreground">{agendamentoSelecionado.observacoes}</p>
                  </div>
                )}

                {agendamentoSelecionado.observacoes_resultado && (
                  <div className="text-sm">
                    <strong>Observações do Resultado:</strong> 
                    <p className="mt-1 text-muted-foreground">{agendamentoSelecionado.observacoes_resultado}</p>
                  </div>
                )}

                {agendamentoSelecionado.data_resultado && (
                  <div className="text-sm">
                    <strong>Horário de Fechamento:</strong> 
                    <p className="mt-1 text-muted-foreground">
                      {format(new Date(agendamentoSelecionado.data_resultado), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {/* Marcar Resultado - só aparece se não tiver resultado ainda */}
              {!agendamentoSelecionado.resultado_reuniao && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-lg">Marcar Resultado</h3>
                  
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button 
                      onClick={() => handleAtualizarResultado('nao_compareceu')}
                      variant="destructive"
                      size="sm"
                    >
                      Não Compareceu
                    </Button>
                    
                    <Button 
                      onClick={() => handleAtualizarResultado('compareceu_nao_comprou')}
                      variant="secondary"
                      size="sm"
                    >
                      Não Comprou
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        setDialogAberto(false);
                        abrirNovaVenda(agendamentoSelecionado);
                      }}
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      Criar Venda
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Remarcar Reunião */}
      <Dialog open={remarcarDialogAberto} onOpenChange={setRemarcarDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remarcar Reunião</DialogTitle>
          </DialogHeader>
          
          {agendamentoSelecionado && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <strong>Lead:</strong> {agendamentoSelecionado.lead?.nome}
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="nova-data">Nova Data</Label>
                  <Input
                    id="nova-data"
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="nova-hora-inicio">Hora Início</Label>
                    <Input
                      id="nova-hora-inicio"
                      type="time"
                      value={novaHoraInicio}
                      onChange={(e) => setNovaHoraInicio(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nova-hora-fim">Hora Fim (opcional)</Label>
                    <Input
                      id="nova-hora-fim"
                      type="time"
                      value={novaHoraFim}
                      onChange={(e) => setNovaHoraFim(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setRemarcarDialogAberto(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleRemarcarReuniao}>
                  Remarcar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Venda */}
      {novaVendaAberto && (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
          <NovaVendaForm 
            onCancel={() => {
              setNovaVendaAberto(false);
              setAgendamentoSelecionado(null);
              clearForm();
            }}
          />
        </div>
      )}
    </div>
  );
};


export default ReunioesPlanilha;