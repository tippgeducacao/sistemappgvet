import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Building, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getWeekRange } from '@/utils/semanaUtils';
import LoadingState from '@/components/ui/loading-state';

interface VendedorMeetingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedorName: string;
  vendedorId: string;
  weekDate: Date;
}

interface MeetingDetail {
  id: string;
  data_agendamento: string;
  resultado_reuniao: string;
  lead_name: string;
  vendedor_name: string;
  sdr_name?: string;
  status: 'convertida' | 'compareceu' | 'nao_compareceu';
}

const getStatusBadge = (status: MeetingDetail['status']) => {
  switch (status) {
    case 'convertida':
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Convertida</Badge>;
    case 'compareceu':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Compareceu</Badge>;
    case 'nao_compareceu':
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Não Compareceu</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

type StatusFilter = 'todos' | 'convertida' | 'compareceu' | 'nao_compareceu';

const statusFilterOptions = [
  { value: 'todos' as StatusFilter, label: 'Todos', color: 'text-foreground' },
  { value: 'convertida' as StatusFilter, label: 'Convertidas', color: 'text-green-600' },
  { value: 'compareceu' as StatusFilter, label: 'Compareceram', color: 'text-blue-600' },
  { value: 'nao_compareceu' as StatusFilter, label: 'Não Compareceram', color: 'text-red-600' },
];

export const VendedorMeetingDetailsModal: React.FC<VendedorMeetingDetailsModalProps> = ({
  open,
  onOpenChange,
  vendedorName,
  vendedorId,
  weekDate
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [meetings, setMeetings] = useState<MeetingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset filter quando modal abre
  useEffect(() => {
    if (open) {
      setStatusFilter('todos');
    }
  }, [open]);

  // Buscar reuniões quando modal abre
  useEffect(() => {
    if (open && vendedorId) {
      fetchMeetings();
    }
  }, [open, vendedorId, weekDate]);

  const fetchMeetings = async () => {
    if (!vendedorId) return;
    
    setIsLoading(true);
    try {
      const { start, end } = getWeekRange(weekDate);
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data_agendamento,
          resultado_reuniao,
          leads!inner (
            nome
          ),
          profiles!vendedor_id (
            name
          ),
          sdr_profiles:profiles!sdr_id (
            name
          )
        `)
        .eq('vendedor_id', vendedorId)
        .gte('data_agendamento', start.toISOString())
        .lte('data_agendamento', end.toISOString())
        .not('resultado_reuniao', 'is', null);

      if (error) {
        console.error('Erro ao buscar reuniões do vendedor:', error);
        return;
      }

      const mappedMeetings: MeetingDetail[] = data?.map((meeting: any) => {
        let status: MeetingDetail['status'] = 'nao_compareceu';
        
        switch (meeting.resultado_reuniao) {
          case 'comprou':
            status = 'convertida';
            break;
          case 'compareceu_nao_comprou':
            status = 'compareceu';
            break;
          case 'nao_compareceu':
            status = 'nao_compareceu';
            break;
        }

        return {
          id: meeting.id,
          data_agendamento: meeting.data_agendamento,
          resultado_reuniao: meeting.resultado_reuniao,
          lead_name: meeting.leads.nome,
          vendedor_name: meeting.profiles?.name || vendedorName,
          sdr_name: meeting.sdr_profiles?.name,
          status
        };
      }) || [];

      setMeetings(mappedMeetings);
    } catch (error) {
      console.error('Erro ao buscar reuniões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular contadores por status
  const statusCounts = useMemo(() => {
    return {
      todos: meetings.length,
      convertida: meetings.filter(m => m.status === 'convertida').length,
      compareceu: meetings.filter(m => m.status === 'compareceu').length,
      nao_compareceu: meetings.filter(m => m.status === 'nao_compareceu').length,
    };
  }, [meetings]);

  // Filtrar e ordenar reuniões
  const filteredAndSortedMeetings = useMemo(() => {
    const filtered = statusFilter === 'todos' 
      ? meetings 
      : meetings.filter(meeting => meeting.status === statusFilter);
    
    return [...filtered].sort((a, b) => 
      new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime()
    );
  }, [meetings, statusFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Reuniões de {vendedorName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {isLoading ? (
            <LoadingState />
          ) : (
            <>
              {/* Filtros por Status */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium text-sm">Filtrar por status:</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {statusFilterOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={statusFilter === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(option.value)}
                      className={`h-8 text-xs ${option.color}`}
                    >
                      {option.label}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {statusCounts[option.value]}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="text-sm text-muted-foreground mb-4">
                {statusFilter === 'todos' 
                  ? `Total de ${meetings.length} reunião(ões) encontrada(s)`
                  : `${filteredAndSortedMeetings.length} reunião(ões) filtrada(s) de ${meetings.length} total`
                }
              </div>
              
              <div className="space-y-3">
                {filteredAndSortedMeetings.map((meeting) => (
                  <div 
                    key={meeting.id}
                    className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatDate(meeting.data_agendamento)}
                        </span>
                      </div>
                      {getStatusBadge(meeting.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Lead:</span>
                        <span className="ml-2 font-medium">{meeting.lead_name}</span>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Vendedor:</span>
                        <span className="ml-2 font-medium">{meeting.vendedor_name}</span>
                      </div>
                      
                      {meeting.sdr_name && (
                        <div>
                          <span className="text-muted-foreground">SDR:</span>
                          <span className="ml-2 font-medium">{meeting.sdr_name}</span>
                        </div>
                      )}
                    </div>
                    
                    {meeting.resultado_reuniao && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Resultado: {meeting.resultado_reuniao.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredAndSortedMeetings.length === 0 && statusFilter !== 'todos' && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma reunião encontrada para o filtro "{statusFilterOptions.find(f => f.value === statusFilter)?.label}".</p>
                  </div>
                )}
                
                {meetings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma reunião encontrada para este vendedor na semana selecionada.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};