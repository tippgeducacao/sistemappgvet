import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Search, Users, Target, TrendingUp } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAllAgendamentos } from '@/hooks/useAllAgendamentos';
import type { DateRange } from 'react-day-picker';

interface ReuniaoHistoryTabProps {
  userId: string;
  userType: string;
}

const ReuniaoHistoryTab: React.FC<ReuniaoHistoryTabProps> = ({ userId, userType }) => {
  const { agendamentos, isLoading } = useAllAgendamentos();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Filtrar agendamentos do usuário
  const userAgendamentos = useMemo(() => {
    if (!agendamentos) return [];
    
    // Para SDRs, mostrar agendamentos onde eles são o SDR
    // Para vendedores, mostrar agendamentos onde eles são o vendedor
    const isSDR = userType === 'sdr_inbound' || userType === 'sdr_outbound';
    
    return agendamentos.filter(agendamento => {
      // Filtrar por usuário baseado no tipo
      if (isSDR && agendamento.sdr_id !== userId) return false;
      if (!isSDR && agendamento.vendedor_id !== userId) return false;
      
      // Filtro por data
      if (dateRange?.from || dateRange?.to) {
        const agendamentoDate = new Date(agendamento.data_agendamento);
        if (dateRange.from && agendamentoDate < dateRange.from) return false;
        if (dateRange.to && agendamentoDate > dateRange.to) return false;
      }
      
      // Filtro por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          agendamento.lead_id?.toString().toLowerCase().includes(searchLower) ||
          agendamento.pos_graduacao_interesse?.toLowerCase().includes(searchLower) ||
          agendamento.status?.toLowerCase().includes(searchLower) ||
          agendamento.resultado_reuniao?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    }).sort((a, b) => new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime());
  }, [agendamentos, userId, userType, searchTerm, dateRange]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = userAgendamentos.length;
    const realizadas = userAgendamentos.filter(a => a.resultado_reuniao && a.resultado_reuniao !== 'nao_compareceu').length;
    const convertidas = userAgendamentos.filter(a => a.resultado_reuniao === 'comprou' || a.resultado_reuniao === 'compareceu_nao_comprou').length;
    const naoCompareceu = userAgendamentos.filter(a => a.resultado_reuniao === 'nao_compareceu').length;
    
    const taxaComparecimento = total > 0 ? (realizadas / total) * 100 : 0;
    const taxaConversao = realizadas > 0 ? (convertidas / realizadas) * 100 : 0;

    return {
      total,
      realizadas,
      convertidas,
      naoCompareceu,
      taxaComparecimento,
      taxaConversao
    };
  }, [userAgendamentos]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800';
      case 'finalizado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      case 'atrasado': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultadoColor = (resultado: string) => {
    switch (resultado) {
      case 'comprou': return 'bg-green-100 text-green-800';
      case 'compareceu_nao_comprou': return 'bg-yellow-100 text-yellow-800';
      case 'nao_compareceu': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultadoLabel = (resultado: string) => {
    switch (resultado) {
      case 'comprou': return 'Comprou';
      case 'compareceu_nao_comprou': return 'Compareceu - Não comprou';
      case 'nao_compareceu': return 'Não compareceu';
      default: return 'Sem resultado';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total de Reuniões</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.realizadas}</div>
                <div className="text-xs text-muted-foreground">Realizadas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">
                  {stats.taxaComparecimento.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Taxa Comparecimento</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.taxaConversao.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Taxa Conversão</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por status, resultado ou interesse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Popover>
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
                "Filtrar por data"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
            />
            <div className="p-3 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setDateRange(undefined)}
              >
                Limpar Filtro
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Lista de reuniões */}
      <div className="space-y-3">
        {userAgendamentos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                Nenhuma reunião encontrada com os filtros aplicados
              </div>
            </CardContent>
          </Card>
        ) : (
          userAgendamentos.map((agendamento) => (
            <Card key={agendamento.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">
                        Reunião - {agendamento.pos_graduacao_interesse || 'Interesse não informado'}
                      </h4>
                      <Badge className={getStatusColor(agendamento.status)}>
                        {agendamento.status}
                      </Badge>
                      {agendamento.resultado_reuniao && (
                        <Badge className={getResultadoColor(agendamento.resultado_reuniao)}>
                          {getResultadoLabel(agendamento.resultado_reuniao)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>
                        Agendada para: {format(new Date(agendamento.data_agendamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                      {agendamento.data_fim_agendamento && (
                        <div>
                          Fim: {format(new Date(agendamento.data_fim_agendamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      )}
                      {agendamento.data_resultado && (
                        <div>
                          Resultado em: {format(new Date(agendamento.data_resultado), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      )}
                      <div>Lead ID: {agendamento.lead_id}</div>
                    </div>
                  </div>
                </div>

                {agendamento.observacoes && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm">
                      <strong>Observações:</strong> {agendamento.observacoes}
                    </div>
                  </div>
                )}

                {agendamento.observacoes_resultado && (
                  <div className="mt-2">
                    <div className="text-sm text-muted-foreground">
                      <strong>Observações do Resultado:</strong> {agendamento.observacoes_resultado}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ReuniaoHistoryTab;