import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Building, Filter } from 'lucide-react';
import { MeetingDetail } from '@/hooks/useAgendamentosStatsAdmin';

interface SDRMeetingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sdrName: string;
  meetings: MeetingDetail[];
}

const getStatusBadge = (status: MeetingDetail['status']) => {
  switch (status) {
    case 'convertida':
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Convertida</Badge>;
    case 'pendente':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente (aguardando aprovação)</Badge>;
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

type StatusFilter = 'todos' | 'convertida' | 'compareceu' | 'pendente' | 'nao_compareceu';

const statusFilterOptions = [
  { value: 'todos' as StatusFilter, label: 'Todos', color: 'text-foreground' },
  { value: 'convertida' as StatusFilter, label: 'Convertidas', color: 'text-green-600' },
  { value: 'compareceu' as StatusFilter, label: 'Compareceram', color: 'text-blue-600' },
  { value: 'pendente' as StatusFilter, label: 'Pendentes', color: 'text-yellow-600' },
  { value: 'nao_compareceu' as StatusFilter, label: 'Não Compareceram', color: 'text-red-600' },
];

export const SDRMeetingDetailsModal: React.FC<SDRMeetingDetailsModalProps> = ({
  open,
  onOpenChange,
  sdrName,
  meetings
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');

  // Reset filter quando modal abre
  useEffect(() => {
    if (open) {
      setStatusFilter('todos');
    }
  }, [open]);

  // Calcular contadores por status
  const statusCounts = useMemo(() => {
    return {
      todos: meetings.length,
      convertida: meetings.filter(m => m.status === 'convertida').length,
      compareceu: meetings.filter(m => m.status === 'compareceu').length,
      pendente: meetings.filter(m => m.status === 'pendente').length,
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
            Reuniões de {sdrName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
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
            {filteredAndSortedMeetings.map((meeting, index) => (
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Lead:</span>
                    <span className="ml-2 font-medium">{meeting.lead_name}</span>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Vendedor:</span>
                    <span className="ml-2 font-medium">{meeting.vendedor_name}</span>
                  </div>
                  
                  {meeting.curso_nome && (
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Curso:</span>
                      <span className="ml-2 font-medium">{meeting.curso_nome}</span>
                    </div>
                  )}
                  
                  {meeting.data_assinatura && (
                    <div>
                      <span className="text-muted-foreground">Assinatura:</span>
                      <span className="ml-2 font-medium">
                        {new Date(meeting.data_assinatura).toLocaleDateString('pt-BR')}
                      </span>
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
                <p>Nenhuma reunião encontrada para este SDR na semana selecionada.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};