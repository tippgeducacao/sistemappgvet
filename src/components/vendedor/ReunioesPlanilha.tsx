import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, User, Phone, Mail, ExternalLink, Plus, Edit, Search, ChevronUp, ChevronDown, Eye, ShoppingCart, Link, X } from 'lucide-react';
import { format, isAfter, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Agendamento } from '@/hooks/useAgendamentos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import NovaVendaForm from '@/components/NovaVendaForm';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import { DiagnosticoVinculacaoDialog } from '@/components/agendamentos/DiagnosticoVinculacaoDialog';
import { useFormStore } from '@/store/FormStore';
import { useUserRoles } from '@/hooks/useUserRoles';
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
  const [editarStatusDialogAberto, setEditarStatusDialogAberto] = useState(false);
  const [verVendaDialogAberto, setVerVendaDialogAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [vendaSelecionada, setVendaSelecionada] = useState<any | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [novoStatus, setNovoStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCreationDate, setSelectedCreationDate] = useState<Date | undefined>();
  const [dateRangePopoverOpen, setDateRangePopoverOpen] = useState(false);
  const [creationDatePopoverOpen, setCreationDatePopoverOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [diagnosticoAberto, setDiagnosticoAberto] = useState(false);
  const { updateField, clearForm } = useFormStore();
  const { isAdmin, isDiretor, isSecretaria } = useUserRoles();

  // Garantir popovers sempre fechados ao montar e desmontar
  useEffect(() => {
    setDateRangePopoverOpen(false);
    setCreationDatePopoverOpen(false);
    return () => {
      setDateRangePopoverOpen(false);
      setCreationDatePopoverOpen(false);
    };
  }, []);

  // Mapa de status das vendas vinculadas (para sobrescrever badge "Comprou" quando for rejeitada)
  const [vendasStatusMap, setVendasStatusMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Buscar status das vendas vinculadas às reuniões com resultado "comprou"
    const ids = Array.from(new Set(
      agendamentos
        .filter(a => a.resultado_reuniao === 'comprou' && a.form_entry_id)
        .map(a => a.form_entry_id as string)
    ));

    if (ids.length === 0) {
      setVendasStatusMap({});
      return;
    }

    supabase
      .from('form_entries')
      .select('id, status')
      .in('id', ids)
      .then(({ data, error }) => {
        if (error) {
          console.error('Erro ao carregar status das vendas vinculadas:', error);
          return;
        }
        const map = Object.fromEntries((data || []).map((v: any) => [v.id, v.status]));
        setVendasStatusMap(map);
      });
  }, [agendamentos]);

  // Separar reuniões em agendadas (sem resultado) e histórico (com resultado) com filtros
  const { reunioesAgendadas, reunioesHistorico } = useMemo(() => {
    let filteredAgendamentos = agendamentos.filter(agendamento => {
      // Filtro por nome
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!agendamento.lead?.nome?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Filtro por período de agendamento (inclusivo dos dias de início e fim)
      if (dateRange?.from || dateRange?.to) {
        const dataAgendamento = new Date(agendamento.data_agendamento);
        const startDate = dateRange.from ? startOfDay(dateRange.from) : null;
        const endDate = dateRange.to ? endOfDay(dateRange.to) : null;
        
        if (startDate && dataAgendamento < startDate) return false;
        if (endDate && dataAgendamento > endDate) return false;
      }
      
      // Filtro por data específica de criação
      if (selectedCreationDate) {
        const dataCriacao = new Date(agendamento.created_at);
        dataCriacao.setHours(0, 0, 0, 0);
        const dataCriacaoSelecionada = new Date(selectedCreationDate);
        dataCriacaoSelecionada.setHours(0, 0, 0, 0);
        if (dataCriacao.getTime() !== dataCriacaoSelecionada.getTime()) return false;
      }
      
      return true;
    });

    const agendadas = filteredAgendamentos.filter(agendamento => !agendamento.resultado_reuniao);
    let historico = filteredAgendamentos.filter(agendamento => agendamento.resultado_reuniao);
    
    // Aplicar ordenação apenas no histórico
    if (sortBy && historico.length > 0) {
      historico = historico.sort((a, b) => {
        let valueA, valueB;
        
        switch (sortBy) {
          case 'data_criacao':
            valueA = new Date(a.created_at);
            valueB = new Date(b.created_at);
            break;
          case 'data_agendamento':
            valueA = new Date(a.data_agendamento);
            valueB = new Date(b.data_agendamento);
            break;
          case 'vendedor':
            valueA = a.vendedor?.name || '';
            valueB = b.vendedor?.name || '';
            break;
          case 'interesse':
            valueA = a.pos_graduacao_interesse || '';
            valueB = b.pos_graduacao_interesse || '';
            break;
          case 'status':
            valueA = a.resultado_reuniao || a.status || '';
            valueB = b.resultado_reuniao || b.status || '';
            break;
          default:
            return 0;
        }
        
        if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return {
      reunioesAgendadas: agendadas,
      reunioesHistorico: historico
    };
  }, [agendamentos, searchTerm, dateRange, selectedCreationDate, sortBy, sortOrder]);

  const getStatusBadge = (agendamento: Agendamento) => {
    if (agendamento.resultado_reuniao) {
      switch (agendamento.resultado_reuniao) {
        case 'nao_compareceu':
          return <Badge variant="destructive">Não Compareceu</Badge>;
        case 'compareceu_nao_comprou':
          return <Badge variant="secondary">Compareceu - Não Comprou</Badge>;
        case 'comprou':
          if (agendamento.form_entry_id && vendasStatusMap[agendamento.form_entry_id]) {
            const st = vendasStatusMap[agendamento.form_entry_id];
            if (st === 'desistiu') return <Badge variant="destructive">Rejeitada</Badge>;
            if (st === 'matriculado') return <Badge variant="default">Matriculado</Badge>;
          }
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

  const abrirVerVenda = async (agendamento: Agendamento) => {
    try {
      let venda = null;
      
      // Primeiro, tentar buscar pela form_entry_id direta
      if (agendamento.form_entry_id) {
        const { data, error } = await supabase
          .from('form_entries')
          .select(`
            *,
            alunos!aluno_id (*),
            cursos (nome),
            profiles!form_entries_vendedor_id_fkey (name)
          `)
          .eq('id', agendamento.form_entry_id)
          .maybeSingle();
        
        if (error) {
          console.error('❌ Erro RLS ao buscar venda por form_entry_id:', error);
          if (error.code === 'PGRST116' || error.message.includes('permission')) {
            toast({
              title: "Permissão insuficiente",
              description: "Você não tem permissão para visualizar esta venda.",
              variant: "destructive",
            });
            return;
          }
        }
        
        if (data) venda = data;
      }
      
      // Se não encontrou pela form_entry_id, buscar por correspondência robusta
      if (!venda && agendamento.lead) {
        const { data, error } = await supabase
          .from('form_entries')
          .select(`
            *,
            alunos!aluno_id (*),
            cursos (nome),
            profiles!form_entries_vendedor_id_fkey (name)
          `)
          .eq('vendedor_id', agendamento.vendedor_id)
          .in('status', ['matriculado', 'pendente'])
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (error) {
          console.error('❌ Erro ao buscar vendas do vendedor:', error);
        } else if (data) {
          // Buscar por email (case-insensitive)
          if (agendamento.lead.email) {
            const emailLead = agendamento.lead.email.toLowerCase().trim();
            venda = data.find(v => 
              v.alunos?.email?.toLowerCase().trim() === emailLead
            );
          }
          
          // Se não encontrou por email, buscar por telefone normalizado
          if (!venda && agendamento.lead.whatsapp) {
            const phoneLead = agendamento.lead.whatsapp.replace(/\D/g, '');
            if (phoneLead.length >= 10) {
              venda = data.find(v => {
                const phoneAluno = v.alunos?.telefone?.replace(/\D/g, '') || '';
                return phoneAluno.length >= 10 && phoneLead.endsWith(phoneAluno.slice(-10));
              });
            }
          }
        }
      }

      if (!venda) {
        // Abrir diagnóstico automaticamente para ajudar na vinculação manual
        setAgendamentoSelecionado(agendamento);
        setDiagnosticoAberto(true);
        
        toast({
          title: "Venda não encontrada",
          description: "Não foi encontrada uma venda vinculada. Use o diagnóstico para vincular manualmente.",
          variant: "destructive",
        });
        return;
      }

      setVendaSelecionada(venda);
      setVerVendaDialogAberto(true);
    } catch (error) {
      console.error('❌ Erro ao buscar venda:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da venda",
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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const clearAllFilters = () => {
    setDateRange(undefined);
    setSelectedCreationDate(undefined);
    setSearchTerm('');
  };

  const hasActiveFilters = dateRange?.from || dateRange?.to || selectedCreationDate || searchTerm.trim().length > 0;

  const renderTabela = (listaAgendamentos: Agendamento[], mostrarAcoes: boolean = true, isHistorico: boolean = false) => (
    listaAgendamentos.length === 0 ? (
      <Card>
        <CardContent className="p-6 text-center">
          <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
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
                {isHistorico ? (
                  <>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('data_criacao')}
                    >
                      <div className="flex items-center gap-1">
                        Data de Criação
                        {renderSortIcon('data_criacao')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('data_agendamento')}
                    >
                      <div className="flex items-center gap-1">
                        Data de Agendamento
                        {renderSortIcon('data_agendamento')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('vendedor')}
                    >
                      <div className="flex items-center gap-1">
                        Vendedor
                        {renderSortIcon('vendedor')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('interesse')}
                    >
                      <div className="flex items-center gap-1">
                        Interesse
                        {renderSortIcon('interesse')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {renderSortIcon('status')}
                      </div>
                    </TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Status</TableHead>
                  </>
                )}
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
                  {isHistorico ? (
                    <>
                      <TableCell>
                        {format(new Date(agendamento.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {agendamento.vendedor?.name || 'Não atribuído'}
                      </TableCell>
                      <TableCell>
                        {agendamento.pos_graduacao_interesse || 'Não informado'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(agendamento)}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {formatarHorario(agendamento)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(agendamento)}
                      </TableCell>
                    </>
                  )}
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
                            <>
                              {agendamento.resultado_reuniao === 'nao_compareceu' && (
                                <Button 
                                  onClick={(e) => handleRemarcarHistorico(agendamento, e)}
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  Remarcar
                                </Button>
                              )}
                              {agendamento.resultado_reuniao === 'compareceu_nao_comprou' && (
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    abrirNovaVenda(agendamento);
                                  }}
                                  size="sm"
                                  variant="default"
                                  className="flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  Nova Venda
                                </Button>
                              )}
                              {agendamento.resultado_reuniao === 'comprou' && (
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    abrirVerVenda(agendamento);
                                  }}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  Ver Venda
                                </Button>
                              )}
                            </>
                          ) : !agendamento.resultado_reuniao && (
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
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Campo de pesquisa por nome */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Pesquisar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro por período de agendamento */}
        <Popover open={dateRangePopoverOpen} onOpenChange={setDateRangePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                "Filtrar por data agendamento"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[9999]" align="start" side="bottom" sideOffset={8}>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                if (range?.from && range?.to) {
                  setDateRangePopoverOpen(false);
                }
              }}
              numberOfMonths={2}
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
            <div className="p-3 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setDateRange(undefined);
                  setDateRangePopoverOpen(false);
                }}
              >
                Limpar Período
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Filtro por data específica de criação */}
        <Popover open={creationDatePopoverOpen} onOpenChange={setCreationDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedCreationDate ? (
                format(selectedCreationDate, "dd/MM/yyyy", { locale: ptBR })
              ) : (
                "Filtrar por data criação"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[9999]" align="start" side="bottom" sideOffset={8}>
            <Calendar
              mode="single"
              selected={selectedCreationDate}
              onSelect={(date) => {
                setSelectedCreationDate(date);
                if (date) {
                  setCreationDatePopoverOpen(false);
                }
              }}
              initialFocus
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
            <div className="p-3 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedCreationDate(undefined);
                  setCreationDatePopoverOpen(false);
                }}
              >
                Limpar Data
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Botão para limpar todos os filtros */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="mr-2 h-4 w-4" />
            Limpar Filtros
          </Button>
        )}

        {/* Botão de diagnóstico de vinculação - apenas para admins */}
        {(isAdmin || isDiretor || isSecretaria) && (
          <Button
            variant="outline"
            onClick={() => setDiagnosticoAberto(true)}
            className="w-full sm:w-auto"
          >
            <Link className="h-4 w-4 mr-2" />
            Diagnóstico Vinculação
          </Button>
        )}
      </div>

      <Tabs defaultValue="agendadas" className="w-full" onValueChange={() => { setDateRangePopoverOpen(false); setCreationDatePopoverOpen(false); }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agendadas" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
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
                  <CalendarIcon className="h-4 w-4" />
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
                      <CalendarIcon className="h-4 w-4" />
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
            onSuccess={async (vendaId: string) => {
              // Atualizar status da reunião para "comprou" e vincular com a venda
              if (agendamentoSelecionado) {
                try {
                  const { error } = await supabase
                    .from('agendamentos')
                    .update({
                      resultado_reuniao: 'comprou',
                      form_entry_id: vendaId,
                      data_resultado: new Date().toISOString(),
                      observacoes_resultado: 'Venda criada através da reunião'
                    })
                    .eq('id', agendamentoSelecionado.id);

                  if (error) throw error;

                  toast({
                    title: "Sucesso",
                    description: "Venda criada e reunião atualizada com sucesso!",
                  });

                  // Recarregar dados
                  if (onRefresh) {
                    onRefresh();
                  }
                } catch (error) {
                  console.error('Erro ao atualizar reunião:', error);
                  toast({
                    title: "Aviso",
                    description: "Venda criada, mas houve erro ao atualizar a reunião",
                    variant: "destructive",
                  });
                }
              }
              
              setNovaVendaAberto(false);
              setAgendamentoSelecionado(null);
              clearForm();
            }}
          />
        </div>
      )}

      {/* Modal de Ver Venda */}
      {verVendaDialogAberto && vendaSelecionada && (
        <VendaDetailsDialog
          venda={vendaSelecionada}
          open={verVendaDialogAberto}
          onOpenChange={setVerVendaDialogAberto}
        />
      )}

      {/* Modal de Diagnóstico de Vinculação */}
      <DiagnosticoVinculacaoDialog
        isOpen={diagnosticoAberto}
        onClose={() => setDiagnosticoAberto(false)}
      />
    </div>
  );
};


export default ReunioesPlanilha;