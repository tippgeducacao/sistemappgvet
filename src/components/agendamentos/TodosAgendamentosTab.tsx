import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, MapPin, Filter, Eye, Edit2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoSDR | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { isDiretor } = useUserRoles();

  // Aplicar filtros
  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    if (filtroSDR !== 'todos' && agendamento.sdr_id !== filtroSDR) return false;
    if (filtroStatus !== 'todos' && agendamento.status !== filtroStatus) return false;
    if (filtroResultado !== 'todos' && agendamento.resultado_reuniao !== filtroResultado) return false;
    if (pesquisaLead && !agendamento.lead?.nome?.toLowerCase().includes(pesquisaLead.toLowerCase())) return false;
    return true;
  });

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

        {(filtroSDR !== 'todos' || filtroStatus !== 'todos' || filtroResultado !== 'todos' || pesquisaLead) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setFiltroSDR('todos');
              setFiltroStatus('todos');
              setFiltroResultado('todos');
              setPesquisaLead('');
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
        <div className="grid gap-4">
          {agendamentosFiltrados.map((agendamento) => (
            <Card key={agendamento.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(agendamento.status)}>
                          {getStatusText(agendamento.status)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Agendado para {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })} das {format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR })}
                          {agendamento.data_fim_agendamento && 
                            ` às ${format(new Date(agendamento.data_fim_agendamento), 'HH:mm', { locale: ptBR })}`
                          }
                        </span>
                      </div>
                      
                      {/* Data e hora de finalização */}
                      {agendamento.data_resultado && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Finalizado em:</span>{' '}
                          {format(new Date(agendamento.data_resultado), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{agendamento.lead?.nome}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{agendamento.pos_graduacao_interesse}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">SDR: {getSdrName(agendamento.sdr_id)}</span>
                      </div>

                      {agendamento.vendedor?.name && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Vendedor: {agendamento.vendedor.name}</span>
                        </div>
                      )}


                      {agendamento.observacoes && (
                        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {agendamento.observacoes}
                        </div>
                      )}

                      {agendamento.resultado_reuniao && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border">
                          <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Resultado da Reunião
                          </div>
                          <div className="text-sm">
                            <Badge variant={
                              agendamento.resultado_reuniao === 'comprou' ? 'default' :
                              agendamento.resultado_reuniao === 'nao_compareceu' ? 'destructive' : 'secondary'
                            }>
                              {agendamento.resultado_reuniao === 'comprou' ? 'Comprou' :
                               agendamento.resultado_reuniao === 'nao_compareceu' ? 'Não Compareceu' :
                               'Compareceu e não comprou'}
                            </Badge>
                            {agendamento.data_resultado && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                em {format(new Date(agendamento.data_resultado), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            )}
                          </div>
                          {agendamento.observacoes_resultado && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {agendamento.observacoes_resultado}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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