import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Users, MapPin, Filter, Eye, Edit2, Search, CalendarIcon, ChevronUp, ChevronDown, ChevronsUpDown, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AgendamentoSDR } from '@/hooks/useAgendamentosSDR';
import AgendamentoDetailsModal from './AgendamentoDetailsModal';
import { useUserRoles } from '@/hooks/useUserRoles';

interface TodosAgendamentosTabProps {
  agendamentos: AgendamentoSDR[];
  sdrs: any[];
  onEditarAgendamento?: (agendamento: AgendamentoSDR) => void;
}

const TodosAgendamentosTab: React.FC<TodosAgendamentosTabProps> = ({ agendamentos, sdrs, onEditarAgendamento }) => {
  const [filtroSDR, setFiltroSDR] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroResultado, setFiltroResultado] = useState<string>('todos');
  const [pesquisaLead, setPesquisaLead] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoSDR | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { isDiretor } = useUserRoles();

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
        case 'sdr':
          aValue = getSdrName(a.sdr_id);
          bValue = getSdrName(b.sdr_id);
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

  // Aplicar filtros e ordenação
  const agendamentosFiltrados = sortData(agendamentos.filter(agendamento => {
    if (filtroSDR !== 'todos' && agendamento.sdr_id !== filtroSDR) return false;
    if (filtroStatus !== 'todos' && agendamento.status !== filtroStatus) return false;
    if (filtroResultado !== 'todos' && agendamento.resultado_reuniao !== filtroResultado) return false;
    if (pesquisaLead && !agendamento.lead?.nome?.toLowerCase().includes(pesquisaLead.toLowerCase())) return false;
    
    // Filtro por data de início
    if (dataInicio) {
      const dataAgendamento = new Date(agendamento.data_agendamento);
      dataAgendamento.setHours(0, 0, 0, 0);
      const inicio = new Date(dataInicio);
      inicio.setHours(0, 0, 0, 0);
      if (dataAgendamento < inicio) return false;
    }
    
    // Filtro por data de fim
    if (dataFim) {
      const dataAgendamento = new Date(agendamento.data_agendamento);
      dataAgendamento.setHours(23, 59, 59, 999);
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);
      if (dataAgendamento > fim) return false;
    }
    
    return true;
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'atrasado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'finalizado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'finalizado_venda': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'cancelado': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'remarcado': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'realizado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
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
      case 'remarcado': return 'Remarcado';
      case 'realizado': return 'Realizado';
      default: return status;
    }
  };

  const getSdrName = (sdrId: string) => {
    const sdr = sdrs.find(s => s.id === sdrId);
    return sdr?.name || 'SDR não encontrado';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Todos os Agendamentos</h3>
          <p className="text-sm text-muted-foreground">
            Visualização de todos os agendamentos do sistema - somente leitura
          </p>
        </div>
        <Badge variant="outline">
          {agendamentosFiltrados.length} de {agendamentos.length} agendamento(s)
        </Badge>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Campo de pesquisa por lead */}
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome do lead..."
            value={pesquisaLead}
            onChange={(e) => setPesquisaLead(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Filtro de Data de Início */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[160px] justify-start text-left font-normal",
                !dataInicio && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Data início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dataInicio}
              onSelect={setDataInicio}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Filtro de Data de Fim */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[160px] justify-start text-left font-normal",
                !dataFim && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Data fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dataFim}
              onSelect={setDataFim}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select value={filtroSDR} onValueChange={setFiltroSDR}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por SDR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os SDRs</SelectItem>
              {sdrs.map((sdr) => (
                <SelectItem key={sdr.id} value={sdr.id}>
                  {sdr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
            <SelectItem value="finalizado_venda">Finalizado - Venda</SelectItem>
            <SelectItem value="remarcado">Remarcado</SelectItem>
            <SelectItem value="realizado">Realizado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroResultado} onValueChange={setFiltroResultado}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Resultado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Resultados</SelectItem>
            <SelectItem value="comprou">Comprou</SelectItem>
            <SelectItem value="compareceu_nao_comprou">Compareceu e não comprou</SelectItem>
            <SelectItem value="nao_compareceu">Não compareceu</SelectItem>
          </SelectContent>
        </Select>

        {(filtroSDR !== 'todos' || filtroStatus !== 'todos' || filtroResultado !== 'todos' || pesquisaLead || dataInicio || dataFim) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setFiltroSDR('todos');
              setFiltroStatus('todos');
              setFiltroResultado('todos');
              setPesquisaLead('');
              setDataInicio(undefined);
              setDataFim(undefined);
            }}
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {agendamentosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {agendamentos.length === 0 
                ? 'Não há agendamentos no sistema'
                : 'Tente ajustar os filtros para ver mais agendamentos'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
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
                onClick={() => handleSort('sdr')}
              >
                <div className="flex items-center gap-1">
                  SDR
                  {renderSortIcon('sdr')}
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
            {agendamentosFiltrados.map((agendamento) => (
              <TableRow key={agendamento.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  {agendamento.created_at && format(new Date(agendamento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
                    {agendamento.data_resultado && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Finalizado: {format(new Date(agendamento.data_resultado), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div>{agendamento.lead?.nome}</div>
                </TableCell>
                <TableCell>{getSdrName(agendamento.sdr_id)}</TableCell>
                <TableCell>{agendamento.vendedor?.name || '-'}</TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="truncate" title={agendamento.pos_graduacao_interesse}>
                    {agendamento.pos_graduacao_interesse}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {agendamento.resultado_reuniao ? (
                      <Badge 
                        variant={
                          agendamento.resultado_reuniao === 'comprou' ? 'default' :
                          agendamento.resultado_reuniao === 'nao_compareceu' ? 'destructive' : 'secondary'
                        }
                      >
                        {agendamento.resultado_reuniao === 'comprou' ? 'Comprou' :
                         agendamento.resultado_reuniao === 'nao_compareceu' ? 'Não Compareceu' :
                         'Compareceu e não comprou'}
                      </Badge>
                    ) : (
                      <Badge className={getStatusColor(agendamento.status)}>
                        {getStatusText(agendamento.status)}
                      </Badge>
                    )}
                  </div>
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
                    {isDiretor && onEditarAgendamento && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditarAgendamento(agendamento)}
                        title="Editar agendamento"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AgendamentoDetailsModal
        agendamento={selectedAgendamento}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default TodosAgendamentosTab;