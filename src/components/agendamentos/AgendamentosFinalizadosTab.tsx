import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, MapPin, Filter, Eye, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AgendamentoSDR } from '@/hooks/useAgendamentosSDR';
import AgendamentoDetailsModal from './AgendamentoDetailsModal';

interface AgendamentosFinalizadosTabProps {
  agendamentos: AgendamentoSDR[];
  onRefresh: () => void;
}

const AgendamentosFinalizadosTab: React.FC<AgendamentosFinalizadosTabProps> = ({ agendamentos, onRefresh }) => {
  const [pesquisaLead, setPesquisaLead] = useState<string>('');
  const [filtroResultado, setFiltroResultado] = useState<string>('todos');
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoSDR | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filtrar agendamentos finalizados
  const agendamentosFinalizados = agendamentos.filter(ag => 
    ['finalizado', 'finalizado_venda'].includes(ag.status) && ag.resultado_reuniao
  );

  // Aplicar filtros de pesquisa e resultado
  const agendamentosFiltrados = agendamentosFinalizados.filter(agendamento => {
    if (pesquisaLead && !agendamento.lead?.nome?.toLowerCase().includes(pesquisaLead.toLowerCase())) return false;
    if (filtroResultado !== 'todos' && agendamento.resultado_reuniao !== filtroResultado) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalizado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'finalizado_venda': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'finalizado': return 'Finalizado';
      case 'finalizado_venda': return 'Finalizado - Venda';
      default: return status;
    }
  };

  const getResultadoColor = (resultado: string) => {
    switch (resultado) {
      case 'comprou': return 'default';
      case 'nao_compareceu': return 'destructive';
      case 'compareceu_nao_comprou': return 'secondary';
      default: return 'secondary';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Agendamentos Finalizados</h3>
          <p className="text-sm text-muted-foreground">
            Agendamentos que já foram concluídos com resultado registrado
          </p>
        </div>
        <Badge variant="outline">
          {agendamentosFiltrados.length} de {agendamentosFinalizados.length} agendamento(s)
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
          <Select value={filtroResultado} onValueChange={setFiltroResultado}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os resultados</SelectItem>
              <SelectItem value="comprou">Comprou</SelectItem>
              <SelectItem value="nao_compareceu">Não Compareceu</SelectItem>
              <SelectItem value="compareceu_nao_comprou">Compareceu e não comprou</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(filtroResultado !== 'todos' || pesquisaLead) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
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
              Nenhum agendamento finalizado encontrado
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {agendamentosFinalizados.length === 0 
                ? 'Você ainda não possui agendamentos finalizados'
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
                        Agendado às {format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR })} - {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
                        {agendamento.data_fim_agendamento && 
                          ` até ${format(new Date(agendamento.data_fim_agendamento), 'HH:mm')}`
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

                      {/* Resultado da reunião */}
                      {agendamento.resultado_reuniao && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                              Resultado da Reunião
                            </div>
                            {agendamento.data_resultado && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(agendamento.data_resultado), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            )}
                          </div>
                          <div className="text-sm">
                            <Badge variant={getResultadoColor(agendamento.resultado_reuniao)}>
                              {getResultadoText(agendamento.resultado_reuniao)}
                            </Badge>
                          </div>
                          {agendamento.observacoes_resultado && (
                            <div className="text-xs text-muted-foreground mt-2">
                              {agendamento.observacoes_resultado}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
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

export default AgendamentosFinalizadosTab;