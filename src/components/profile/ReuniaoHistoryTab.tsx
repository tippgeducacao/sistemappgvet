import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Search, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAllAgendamentos } from '@/hooks/useAllAgendamentos';
import type { DateRange } from 'react-day-picker';
import * as XLSX from 'xlsx';

interface ReuniaoHistoryTabProps {
  userId: string;
  userType: string;
}

const ReuniaoHistoryTab: React.FC<ReuniaoHistoryTabProps> = ({ userId, userType }) => {
  const { agendamentos, isLoading } = useAllAgendamentos();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedAgendamento, setSelectedAgendamento] = useState<any>(null);

  // Filtrar agendamentos do usuário
  const filteredAgendamentos = useMemo(() => {
    if (!agendamentos) return [];
    
    const isSDR = userType === 'sdr_inbound' || userType === 'sdr_outbound';
    
    return agendamentos.filter(agendamento => {
      // Filtrar por usuário baseado no tipo
      if (isSDR && agendamento.sdr_id !== userId) return false;
      if (!isSDR && agendamento.vendedor_id !== userId) return false;
      
      // Filtrar por período
      if (dateRange?.from || dateRange?.to) {
        const agendamentoDate = new Date(agendamento.data_agendamento);
        if (dateRange.from && agendamentoDate < dateRange.from) return false;
        if (dateRange.to && agendamentoDate > dateRange.to) return false;
      }
      
      // Filtro por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          agendamento.pos_graduacao_interesse?.toLowerCase().includes(searchLower) ||
          agendamento.status?.toLowerCase().includes(searchLower) ||
          agendamento.resultado_reuniao?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [agendamentos, userId, userType, searchTerm, dateRange]);

  // Exportar para Excel
  const exportToExcel = () => {
    const data = filteredAgendamentos.map(agendamento => ({
      'Data': format(new Date(agendamento.data_agendamento), 'dd/MM/yyyy HH:mm'),
      'Status': agendamento.status,
      'Resultado': agendamento.resultado_reuniao || 'Sem resultado',
      'Interesse': agendamento.pos_graduacao_interesse || 'Não informado',
      'Observações': agendamento.observacoes || '',
      'Link Reunião': agendamento.link_reuniao || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico de Reuniões');
    
    const filename = `historico_reunioes_${userId}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800';
      case 'finalizado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      case 'atrasado': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const AgendamentoDetailsModal = ({ agendamento }: { agendamento: any }) => (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Detalhes da Reunião</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Data do Agendamento</label>
            <p className="text-sm">{format(new Date(agendamento.data_agendamento), 'dd/MM/yyyy HH:mm')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <Badge className={getStatusColor(agendamento.status)}>{agendamento.status}</Badge>
          </div>
        </div>

        {agendamento.data_fim_agendamento && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Data de Fim</label>
            <p className="text-sm">{format(new Date(agendamento.data_fim_agendamento), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-muted-foreground">Interesse em Pós-Graduação</label>
          <p className="text-sm">{agendamento.pos_graduacao_interesse || 'Não informado'}</p>
        </div>

        {agendamento.link_reuniao && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Link da Reunião</label>
            <p className="text-sm break-all">{agendamento.link_reuniao}</p>
          </div>
        )}

        {agendamento.resultado_reuniao && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Resultado da Reunião</label>
              <p className="text-sm">{agendamento.resultado_reuniao}</p>
            </div>
            {agendamento.data_resultado && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data do Resultado</label>
                <p className="text-sm">{format(new Date(agendamento.data_resultado), 'dd/MM/yyyy HH:mm')}</p>
              </div>
            )}
          </div>
        )}

        {agendamento.observacoes && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Observações</label>
            <p className="text-sm">{agendamento.observacoes}</p>
          </div>
        )}

        {agendamento.observacoes_resultado && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Observações do Resultado</label>
            <p className="text-sm">{agendamento.observacoes_resultado}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Criado em</label>
            <p className="text-sm">{format(new Date(agendamento.created_at), 'dd/MM/yyyy HH:mm')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Atualizado em</label>
            <p className="text-sm">{format(new Date(agendamento.updated_at), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </div>
      </div>
    </DialogContent>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros e Exportação */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
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
                  "Filtrar por período"
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

        <Button onClick={exportToExcel} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Lista de reuniões */}
      <div className="space-y-3">
        {filteredAgendamentos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                Nenhuma reunião encontrada para os filtros selecionados
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAgendamentos.map((agendamento) => (
            <Card key={agendamento.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">
                        {format(new Date(agendamento.data_agendamento), 'dd/MM/yyyy HH:mm')}
                      </h4>
                      <Badge className={getStatusColor(agendamento.status)}>
                        {agendamento.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Interesse</div>
                        <div className="font-medium">
                          {agendamento.pos_graduacao_interesse || 'Não informado'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Resultado</div>
                        <div className="font-medium">
                          {agendamento.resultado_reuniao || 'Sem resultado'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Observações</div>
                        <div className="font-medium">
                          {agendamento.observacoes || 'Nenhuma observação'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <AgendamentoDetailsModal agendamento={agendamento} />
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ReuniaoHistoryTab;