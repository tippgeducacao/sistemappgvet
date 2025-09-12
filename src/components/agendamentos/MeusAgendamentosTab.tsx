import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Trash2, Clock, Users, MapPin, Eye, Edit, RefreshCw, List, History, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/stores/AuthStore';
import { AgendamentoSDR } from '@/hooks/useAgendamentosSDR';
import AgendamentoDetailsModal from './AgendamentoDetailsModal';
import EditarHorarioSDRDialog from './EditarHorarioSDRDialog';
import HistoricoReunioes from '@/components/sdr/HistoricoReunioes';
import MeusAgendamentosCalendario from './MeusAgendamentosCalendario';

interface MeusAgendamentosTabProps {
  agendamentos: AgendamentoSDR[];
  onRefresh: () => void;
}

const MeusAgendamentosTab: React.FC<MeusAgendamentosTabProps> = ({ agendamentos, onRefresh }) => {
  const { profile } = useAuthStore();
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoSDR | null>(null);
const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<AgendamentoSDR | null>(null);

  // Estado para ordenação
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Função para alternar ordenação
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Função para ordenar os dados
  const sortData = (data: AgendamentoSDR[]) => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'data_agendamento':
          aValue = new Date(a.data_agendamento);
          bValue = new Date(b.data_agendamento);
          break;
        case 'nome':
          aValue = a.lead?.nome || '';
          bValue = b.lead?.nome || '';
          break;
        case 'vendedor':
          aValue = a.vendedor?.name || '';
          bValue = b.vendedor?.name || '';
          break;
        case 'interesse':
          aValue = a.pos_graduacao_interesse || '';
          bValue = b.pos_graduacao_interesse || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Renderizar ícone de ordenação
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };


  // Filtrar agendamentos do SDR logado - apenas os que ainda estão agendados
  const agendamentosAgendados = sortData(
    agendamentos
      .filter(ag => ag.sdr_id === profile?.id && ['agendado', 'remarcado'].includes(ag.status))
      .sort((a, b) => new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime())
  );

  const cancelarAgendamento = async (agendamentoId: string) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          status: 'cancelado',
          observacoes: 'Cancelado pelo SDR'
        })
        .eq('id', agendamentoId)
        .eq('sdr_id', profile?.id); // Garantir que só pode cancelar seus próprios

      if (error) throw error;

      toast.success('Agendamento cancelado com sucesso!');
      onRefresh();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error('Erro ao cancelar agendamento');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'atrasado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'finalizado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'finalizado_venda': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'agendado': return 'Agendado';
      case 'atrasado': return 'Atrasado';
      case 'finalizado': return 'Finalizado';
      case 'finalizado_venda': return 'Finalizado - Venda';
      default: return status;
    }
  };

  const renderAgendamentosList = (agendamentosList: AgendamentoSDR[], emptyMessage: string) => {
    if (agendamentosList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {emptyMessage}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('created_at')}
            >
              <div className="flex items-center gap-1">
                Data de Criação
                {renderSortIcon('created_at')}
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
              onClick={() => handleSort('nome')}
            >
              <div className="flex items-center gap-1">
                Nome
                {renderSortIcon('nome')}
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
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agendamentosList.map((agendamento) => (
            <TableRow key={agendamento.id}>
              <TableCell className="font-medium">
                {format(new Date(agendamento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div>{format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(agendamento.data_agendamento), 'HH:mm')}
                    {agendamento.data_fim_agendamento && 
                      ` - ${format(new Date(agendamento.data_fim_agendamento), 'HH:mm')}`
                    }
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium">{agendamento.lead?.nome}</TableCell>
              <TableCell>{agendamento.vendedor?.name}</TableCell>
              <TableCell>{agendamento.pos_graduacao_interesse}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(agendamento.status)}>
                  {getStatusText(agendamento.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAgendamento(agendamento);
                      setModalOpen(true);
                    }}
                    title="Visualizar detalhes do agendamento"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {(['agendado','atrasado'].includes(agendamento.status)) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAgendamento(agendamento);
                        setEditOpen(true);
                      }}
                      title="Editar horário da reunião"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {agendamento.status !== 'cancelado' && !agendamento.resultado_reuniao && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja cancelar este agendamento com {agendamento.lead?.nome}?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Não, manter</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => cancelarAgendamento(agendamento.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Sim, cancelar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Meus Agendamentos</h3>
          <p className="text-sm text-muted-foreground">
            Agendamentos que você criou e histórico de reuniões
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            title="Atualizar agendamentos"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Badge variant="outline">
            {agendamentosAgendados.length} agendamento(s) ativo(s)
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="agendados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agendados" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Agendados ({agendamentosAgendados.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agendados">
          {renderAgendamentosList(agendamentosAgendados, "Você ainda não tem agendamentos pendentes")}
        </TabsContent>

        <TabsContent value="historico">
          <HistoricoReunioes />
        </TabsContent>

        <TabsContent value="calendario">
          <MeusAgendamentosCalendario agendamentosAtivos={agendamentosAgendados} />
        </TabsContent>
      </Tabs>

      <AgendamentoDetailsModal
        agendamento={selectedAgendamento}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      <EditarHorarioSDRDialog
        agendamento={editingAgendamento}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={onRefresh}
      />
    </div>
  );
};

export default MeusAgendamentosTab;