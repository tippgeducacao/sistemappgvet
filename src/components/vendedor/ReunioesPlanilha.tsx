import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Eye, Edit, Search, Settings, Clock, ArrowUp, ArrowDown, MoreHorizontal, ExternalLink, Mail, Phone, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Agendamento } from '@/hooks/useAgendamentos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import NovaVendaForm from '@/components/NovaVendaForm';
import AgendamentoDetailsModal from './AgendamentoDetailsModal';
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
  const [detailsModalAberto, setDetailsModalAberto] = useState(false);
  const [novaVendaAberto, setNovaVendaAberto] = useState(false);
  const [remarcarDialogAberto, setRemarcarDialogAberto] = useState(false);
  const [editarStatusDialogAberto, setEditarStatusDialogAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novaHoraInicio, setNovaHoraInicio] = useState('');
  const [novaHoraFim, setNovaHoraFim] = useState('');
  const [novoStatus, setNovoStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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

    // Função para ordenar por horário
    const sortByTime = (list: Agendamento[]) => {
      return [...list].sort((a, b) => {
        const dateA = new Date(a.data_agendamento);
        const dateB = new Date(b.data_agendamento);
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      });
    };

    const agendadas = sortByTime(filteredAgendamentos.filter(agendamento => !agendamento.resultado_reuniao));
    const historico = sortByTime(filteredAgendamentos.filter(agendamento => agendamento.resultado_reuniao));
    
    return {
      reunioesAgendadas: agendadas,
      reunioesHistorico: historico
    };
  }, [agendamentos, searchTerm, sortOrder]);

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
      // IMPORTANTE: Manter o sdr_id original ao remarcar
      const { error } = await supabase
        .from('agendamentos')
        .update({
          data_agendamento: novaDataAgendamento.toISOString(),
          data_fim_agendamento: novaDataFim.toISOString(),
          status: 'remarcado'
          // sdr_id é mantido automaticamente (não está sendo alterado)
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
      // IMPORTANTE: Manter o sdr_id original ao remarcar do histórico
      const { error } = await supabase
        .from('agendamentos')
        .update({
          status: 'remarcado',
          resultado_reuniao: null,
          data_resultado: null,
          observacoes_resultado: null
          // sdr_id é mantido automaticamente (não está sendo alterado)
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

  const abrirEditarStatusDialog = (agendamento: Agendamento, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgendamentoSelecionado(agendamento);
    setNovoStatus(agendamento.status || 'agendado');
    setEditarStatusDialogAberto(true);
  };

  const handleEditarStatus = async () => {
    if (!agendamentoSelecionado || !novoStatus) {
      toast({
        title: "Erro",
        description: "Selecione um status válido",
        variant: "destructive",
      });
      return;
    }

    try {
      // IMPORTANTE: Manter o sdr_id original ao editar status
      const { error } = await supabase
        .from('agendamentos')
        .update({
          status: novoStatus
          // sdr_id é mantido automaticamente (não está sendo alterado)
        })
        .eq('id', agendamentoSelecionado.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status da reunião atualizado com sucesso!",
      });

      setEditarStatusDialogAberto(false);
      setAgendamentoSelecionado(null);
      setNovoStatus('');
      
      if (onRefresh) {
        onRefresh();
      }
      
    } catch (error) {
      console.error('Erro ao editar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar o status da reunião. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const abrirDetailsModal = (agendamento: Agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setObservacoes(agendamento.observacoes_resultado || '');
    setDetailsModalAberto(true);
  };

  const handleAtualizarResultadoModal = async (resultado: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou') => {
    if (!agendamentoSelecionado) return;
    
    const sucesso = await onAtualizarResultado(agendamentoSelecionado.id, resultado, observacoes);
    if (sucesso) {
      setDetailsModalAberto(false);
      setAgendamentoSelecionado(null);
      setObservacoes('');
    }
  };

  const handleCriarVendaModal = () => {
    if (!agendamentoSelecionado) return;
    setDetailsModalAberto(false);
    abrirNovaVenda(agendamentoSelecionado);
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
                <TableHead className="w-24">Data</TableHead>
                <TableHead className="w-20">Horário</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="text-center w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listaAgendamentos.map((agendamento) => (
                <TableRow 
                  key={agendamento.id}
                  className={`hover:bg-muted/50 ${
                    isReuniaoPerdida(agendamento) ? 'bg-destructive/10 text-destructive' : ''
                  }`}
                >
                  <TableCell className="font-medium py-2">
                    {format(new Date(agendamento.data_agendamento), "dd/MM", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="py-2">
                    {format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="max-w-40 truncate">
                      {agendamento.lead?.nome || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="max-w-32 truncate">
                      {agendamento.vendedor?.name || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    {getStatusBadge(agendamento)}
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirDetailsModal(agendamento)}
                        className="flex items-center gap-1 h-8 px-2"
                      >
                        <Eye className="h-3 w-3" />
                        Visualizar
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {agendamento.link_reuniao && (
                            <DropdownMenuItem
                              onClick={() => {
                                window.open(
                                  agendamento.link_reuniao.startsWith('http') 
                                    ? agendamento.link_reuniao 
                                    : `https://${agendamento.link_reuniao}`,
                                  '_blank'
                                );
                              }}
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Acessar Reunião
                            </DropdownMenuItem>
                          )}
                          {isHistorico ? (
                            <>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemarcarHistorico(agendamento, e);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-3 w-3" />
                                Remarcar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirEditarStatusDialog(agendamento, e);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Settings className="h-3 w-3" />
                                Editar Status
                              </DropdownMenuItem>
                            </>
                          ) : !agendamento.resultado_reuniao && (
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirRemarcarDialog(agendamento, e);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-3 w-3" />
                              Remarcar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  );

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getSortIcon = () => {
    if (sortOrder === 'asc') return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Filtros e controles */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome do lead..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="default"
          onClick={toggleSortOrder}
          className="flex items-center gap-2 whitespace-nowrap"
          title={`Ordenar por horário ${sortOrder === 'asc' ? 'crescente' : 'decrescente'}`}
        >
          <Clock className="h-4 w-4" />
          Horário
          {getSortIcon()}
        </Button>
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

      {/* Modal de Detalhes do Agendamento */}
      <AgendamentoDetailsModal
        agendamento={agendamentoSelecionado}
        open={detailsModalAberto}
        onOpenChange={setDetailsModalAberto}
        observacoes={observacoes}
        setObservacoes={setObservacoes}
        onAtualizarResultado={handleAtualizarResultadoModal}
        onCriarVenda={handleCriarVendaModal}
        onRemarcar={(agendamento) => abrirRemarcarDialog(agendamento, { stopPropagation: () => {} } as React.MouseEvent)}
        onEditarStatus={(agendamento) => abrirEditarStatusDialog(agendamento, { stopPropagation: () => {} } as React.MouseEvent)}
        isHistorico={false}
      />

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

      {/* Modal de Editar Status */}
      <Dialog open={editarStatusDialogAberto} onOpenChange={setEditarStatusDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Status da Reunião</DialogTitle>
          </DialogHeader>
          
          {agendamentoSelecionado && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <strong>Lead:</strong> {agendamentoSelecionado.lead?.nome}
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Data:</strong> {format(new Date(agendamentoSelecionado.data_agendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>SDR Responsável:</strong> {agendamentoSelecionado.sdr?.name || 'Não informado'}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="novo-status">Novo Status</Label>
                <Select value={novoStatus} onValueChange={setNovoStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="remarcado">Remarcado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="realizado">Realizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditarStatusDialogAberto(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleEditarStatus}>
                  Salvar Status
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