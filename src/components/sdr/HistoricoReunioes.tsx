import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, User, ExternalLink, Eye, Filter, X } from 'lucide-react';
import { useAuthStore } from '@/stores/AuthStore';
import { supabase } from '@/integrations/supabase/client';
import LoadingState from '@/components/ui/loading-state';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface HistoricoReuniao {
  id: string;
  lead_id: string;
  vendedor_id: string;
  data_agendamento: string;
  data_fim_agendamento?: string;
  pos_graduacao_interesse: string;
  link_reuniao: string;
  observacoes?: string;
  status: string;
  resultado_reuniao?: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou' | null;
  data_resultado?: string;
  observacoes_resultado?: string;
  created_at: string;
  updated_at: string;
  lead?: {
    nome: string;
    email?: string;
    whatsapp?: string;
  };
  vendedor?: {
    name: string;
    email: string;
  };
}

const HistoricoReunioes: React.FC = () => {
  const [reunioes, setReunioes] = useState<HistoricoReuniao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuthStore();

  // Estado para filtros
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCreationDate, setSelectedCreationDate] = useState<Date | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  // Opções de status de resultado
  const statusOptions = [
    { value: 'comprou', label: 'Converteu', color: 'bg-green-100 text-green-800' },
    { value: 'compareceu_nao_comprou', label: 'Compareceu', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'nao_compareceu', label: 'Não Compareceu', color: 'bg-red-100 text-red-800' }
  ];

  const fetchHistoricoReunioes = async () => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          lead:leads!agendamentos_lead_id_fkey (
            nome,
            email,
            whatsapp
          ),
          vendedor:profiles!agendamentos_vendedor_id_fkey (
            name,
            email
          )
        `)
        .eq('sdr_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico de reuniões:', error);
        return;
      }

      setReunioes((data || []) as HistoricoReuniao[]);
    } catch (error) {
      console.error('Erro ao buscar histórico de reuniões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricoReunioes();
  }, [profile?.id]);

  // Filtrar reuniões pelo período e status selecionados
  const reunioesFiltradas = reunioes.filter(reuniao => {
    // Filtro por período de agendamento
    if (dateRange?.from || dateRange?.to) {
      const dataAgendamento = new Date(reuniao.data_agendamento);
      if (dateRange.from && dataAgendamento < dateRange.from) return false;
      if (dateRange.to && dataAgendamento > dateRange.to) return false;
    }
    
    // Filtro por data específica de criação
    if (selectedCreationDate) {
      const dataCriacao = new Date(reuniao.created_at);
      dataCriacao.setHours(0, 0, 0, 0);
      const dataCriacaoSelecionada = new Date(selectedCreationDate);
      dataCriacaoSelecionada.setHours(0, 0, 0, 0);
      if (dataCriacao.getTime() !== dataCriacaoSelecionada.getTime()) return false;
    }
    
    // Filtro por status de resultado 
    if (selectedStatus.length > 0) {
      if (!reuniao.resultado_reuniao || !selectedStatus.includes(reuniao.resultado_reuniao)) {
        return false;
      }
    }
    
    return true;
  });

  const handleStatusToggle = (status: string) => {
    setSelectedStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearAllFilters = () => {
    setDateRange(undefined);
    setSelectedCreationDate(undefined);
    setSelectedStatus([]);
  };

  const hasActiveFilters = dateRange?.from || dateRange?.to || selectedCreationDate || selectedStatus.length > 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendado':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Agendado</Badge>;
      case 'realizado':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Realizado</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResultadoBadge = (resultado: string | null) => {
    if (!resultado) return null;
    
    switch (resultado) {
      case 'comprou':
        return <Badge className="bg-green-100 text-green-800">Converteu</Badge>;
      case 'compareceu_nao_comprou':
        return <Badge className="bg-yellow-100 text-yellow-800">Compareceu</Badge>;
      case 'nao_compareceu':
        return <Badge className="bg-red-100 text-red-800">Não Compareceu</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Reuniões</CardTitle>
          <CardDescription>Todas as reuniões que você agendou</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingState message="Carregando histórico..." />
        </CardContent>
      </Card>
    );
  }

  if (reunioes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Reuniões</CardTitle>
          <CardDescription>Todas as reuniões que você agendou</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Área de Filtros */}
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Filtro por período de agendamento */}
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
                    "Filtrar por data agendamento"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
                <div className="p-3 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setDateRange(undefined)}
                  >
                    Limpar Período
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Filtro por data de criação */}
            <Popover>
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
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar
                  mode="single"
                  selected={selectedCreationDate}
                  onSelect={setSelectedCreationDate}
                  initialFocus
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
                <div className="p-3 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedCreationDate(undefined)}
                  >
                    Limpar Data
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Filtro por status */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Status
                  {selectedStatus.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      {selectedStatus.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 z-50" align="start">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Filtrar por resultado</h4>
                  {statusOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={selectedStatus.includes(option.value)}
                        onCheckedChange={() => handleStatusToggle(option.value)}
                      />
                      <label
                        htmlFor={option.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                  {selectedStatus.length > 0 && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedStatus([])}
                      >
                        Limpar Status
                      </Button>
                    </div>
                  )}
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
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Nenhuma reunião agendada ainda</p>
            <p className="text-sm">Suas reuniões aparecerão aqui quando você começar a agendar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Reuniões</CardTitle>
        <CardDescription>
          {reunioesFiltradas.length} reuniões encontradas
          {hasActiveFilters && (
            <>
              {" com os filtros aplicados"}
              {selectedStatus.length > 0 && (
                <> (status: {selectedStatus.map(s => statusOptions.find(opt => opt.value === s)?.label).join(", ")})</>
              )}
            </>
          )}
          {reunioes.length > reunioesFiltradas.length && 
            ` (${reunioes.length} total)`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Área de Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Filtro por período de agendamento */}
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
                  "Filtrar por data agendamento"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                locale={ptBR}
                className="p-3 pointer-events-auto"
              />
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setDateRange(undefined)}
                >
                  Limpar Período
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Filtro por data de criação */}
          <Popover>
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
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={selectedCreationDate}
                onSelect={setSelectedCreationDate}
                initialFocus
                locale={ptBR}
                className="p-3 pointer-events-auto"
              />
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedCreationDate(undefined)}
                >
                  Limpar Data
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Filtro por status */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Status
                {selectedStatus.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {selectedStatus.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 z-50" align="start">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Filtrar por resultado</h4>
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={selectedStatus.includes(option.value)}
                      onCheckedChange={() => handleStatusToggle(option.value)}
                    />
                    <label
                      htmlFor={option.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
                {selectedStatus.length > 0 && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedStatus([])}
                    >
                      Limpar Status
                    </Button>
                  </div>
                )}
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
        </div>

        {reunioesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Nenhuma reunião encontrada neste período</p>
            <p className="text-sm">Selecione outro período ou aguarde novas reuniões</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reunioesFiltradas.map((reuniao) => (
            <div key={reuniao.id} className="border rounded-lg p-4 space-y-3">
              {/* Header da reunião */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {reuniao.lead?.nome}
                      {reuniao.created_at && (
                        <span className="text-xs text-muted-foreground ml-2 font-normal">
                          • criado em {format(new Date(reuniao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </span>
                  </div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                     <CalendarIcon className="h-4 w-4" />
                     {format(new Date(reuniao.data_agendamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                   </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(reuniao.data_agendamento), 'HH:mm')}
                    {reuniao.data_fim_agendamento && 
                      ` - ${format(new Date(reuniao.data_fim_agendamento), 'HH:mm')}`
                    }
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(reuniao.status)}
                  {getResultadoBadge(reuniao.resultado_reuniao)}
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Vendedor:</span> {reuniao.vendedor?.name}
                </div>
                <div>
                  <span className="font-medium">Pós-graduação:</span> {reuniao.pos_graduacao_interesse}
                </div>
                {reuniao.lead?.email && (
                  <div>
                    <span className="font-medium">Email:</span> {reuniao.lead.email}
                  </div>
                )}
                {reuniao.lead?.whatsapp && (
                  <div>
                    <span className="font-medium">WhatsApp:</span> {reuniao.lead.whatsapp}
                  </div>
                )}
              </div>

              {/* Observações */}
              {reuniao.observacoes && (
                <div className="text-sm">
                  <span className="font-medium">Observações:</span>
                  <p className="text-muted-foreground mt-1">{reuniao.observacoes}</p>
                </div>
              )}

              {/* Resultado da reunião */}
              {reuniao.observacoes_resultado && (
                <div className="text-sm">
                  <span className="font-medium">Resultado:</span>
                  <p className="text-muted-foreground mt-1">{reuniao.observacoes_resultado}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center gap-2 pt-2 border-t">
                {reuniao.link_reuniao && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={reuniao.link_reuniao} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Link da Reunião
                    </a>
                  </Button>
                )}
                {reuniao.data_resultado && (
                  <div className="text-xs text-muted-foreground ml-auto">
                    Finalizada em {format(new Date(reuniao.data_resultado), "dd/MM/yyyy 'às' HH:mm")}
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricoReunioes;