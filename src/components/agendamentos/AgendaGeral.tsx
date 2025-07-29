import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, User, Clock, Book, Filter, X } from 'lucide-react';
import { AgendamentosService } from '@/services/agendamentos/AgendamentosService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isSameDay, isWeekend, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatarHorarioTrabalho } from '@/utils/horarioUtils';

interface Vendedor {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
  pos_graduacoes: string[];
  horario_trabalho: any;
  cursos?: any[];
}

interface AgendaGeralProps {
  isOpen: boolean;
  onClose: () => void;
}

const AgendaGeral: React.FC<AgendaGeralProps> = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [vendedoresFiltrados, setVendedoresFiltrados] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);

  // Filtros
  const [filtroPosgGraduacao, setFiltroPosgGraduacao] = useState<string>('todas');
  const [filtroHorarioInicio, setFiltroHorarioInicio] = useState<string>('');
  const [filtroHorarioFim, setFiltroHorarioFim] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isOpen) {
      carregarDados();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate) {
      carregarAgendamentosData();
    }
  }, [selectedDate]);

  // Aplicar filtros quando houver mudanças
  useEffect(() => {
    aplicarFiltros();
  }, [vendedores, filtroPosgGraduacao, filtroHorarioInicio, filtroHorarioFim, selectedDate, agendamentos]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Buscar vendedores ativos (incluindo SDRs)
      const { data: vendedoresData, error: vendedoresError } = await supabase
        .from('profiles')
        .select('id, name, email, photo_url, pos_graduacoes, horario_trabalho')
        .in('user_type', ['vendedor', 'sdr_inbound', 'sdr_outbound'])
        .eq('ativo', true)
        .order('name');

      console.log('🔍 Vendedores carregados:', vendedoresData?.map(v => ({ 
        name: v.name, 
        photo_url: v.photo_url 
      })));

      if (vendedoresError) throw vendedoresError;

      // Buscar cursos para mapear os IDs para nomes
      const { data: cursosData, error: cursosError } = await supabase
        .from('cursos')
        .select('id, nome')
        .eq('ativo', true);

      if (cursosError) throw cursosError;

      setCursos(cursosData || []);
      
      // Mapear cursos para vendedores
      const vendedoresComCursos = (vendedoresData || []).map(vendedor => ({
        ...vendedor,
        cursos: (vendedor.pos_graduacoes || []).map((cursoId: string) => {
          const curso = cursosData?.find(c => c.id === cursoId);
          return curso ? curso.nome : 'Curso não encontrado';
        })
      }));

      setVendedores(vendedoresComCursos);
      setVendedoresFiltrados(vendedoresComCursos);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const carregarAgendamentosData = async () => {
    if (!selectedDate) return;

    try {
      const dataFormatada = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          vendedor:profiles!agendamentos_vendedor_id_fkey(name),
          lead:leads(nome)
        `)
        .gte('data_agendamento', `${dataFormatada}T00:00:00`)
        .lt('data_agendamento', `${dataFormatada}T23:59:59`)
        .eq('status', 'agendado');

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar agendamentos da data:', error);
    }
  };

  const aplicarFiltros = () => {
    let vendedoresFiltrados = [...vendedores];

    // Filtro por pós-graduação
    if (filtroPosgGraduacao && filtroPosgGraduacao !== 'todas') {
      vendedoresFiltrados = vendedoresFiltrados.filter(vendedor => 
        vendedor.cursos?.some(curso => 
          curso.toLowerCase().includes(filtroPosgGraduacao.toLowerCase())
        )
      );
    }

    // Filtro por horário de disponibilidade
    if (filtroHorarioInicio && filtroHorarioFim && selectedDate) {
      vendedoresFiltrados = vendedoresFiltrados.filter(vendedor => {
        // Verificar se o vendedor trabalha no dia selecionado
        if (!verificarDisponibilidade(vendedor, selectedDate)) {
          return false;
        }

        // Verificar se tem horário de trabalho que abranja o período solicitado
        const temHorarioDisponivel = verificarHorarioDisponivel(
          vendedor, 
          selectedDate, 
          filtroHorarioInicio, 
          filtroHorarioFim
        );

        if (!temHorarioDisponivel) {
          return false;
        }

        // Verificar se não tem agendamentos conflitantes no período
        const agendamentosVendedor = getAgendamentosVendedor(vendedor.id);
        const temConflito = agendamentosVendedor.some(agendamento => {
          const inicioAgendamento = new Date(agendamento.data_agendamento);
          const fimAgendamento = agendamento.data_fim_agendamento 
            ? new Date(agendamento.data_fim_agendamento)
            : new Date(inicioAgendamento.getTime() + 60 * 60 * 1000); // 1 hora padrão

          const inicioFiltro = new Date(selectedDate);
          inicioFiltro.setHours(parseInt(filtroHorarioInicio.split(':')[0]), parseInt(filtroHorarioInicio.split(':')[1]));
          
          const fimFiltro = new Date(selectedDate);
          fimFiltro.setHours(parseInt(filtroHorarioFim.split(':')[0]), parseInt(filtroHorarioFim.split(':')[1]));

          // Verificar sobreposição de horários
          return inicioAgendamento < fimFiltro && fimAgendamento > inicioFiltro;
        });

        return !temConflito;
      });
    }

    setVendedoresFiltrados(vendedoresFiltrados);
  };

  const verificarHorarioDisponivel = (vendedor: Vendedor, data: Date, inicioDesejado: string, fimDesejado: string): boolean => {
    if (!vendedor.horario_trabalho) return false;

    const diaSemana = data.getDay();
    const horarioTrabalho = vendedor.horario_trabalho;

    let periodosTrabalho: any[] = [];

    // Verificar formato do horário de trabalho
    if (horarioTrabalho.manha_inicio) {
      // Formato antigo
      periodosTrabalho = [
        {
          inicio: horarioTrabalho.manha_inicio,
          fim: horarioTrabalho.manha_fim
        },
        {
          inicio: horarioTrabalho.tarde_inicio,
          fim: horarioTrabalho.tarde_fim
        }
      ];
    } else {
      // Formato novo - verificar com base na configuração de dias de trabalho
      let trabalhaNesteDia = false;
      
      if (horarioTrabalho.dias_trabalho === 'segunda_sabado') {
        trabalhaNesteDia = diaSemana >= 1 && diaSemana <= 6; // Segunda a sábado
      } else if (horarioTrabalho.dias_trabalho === 'personalizado') {
        const diasMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const diaAtual = diasMap[diaSemana];
        trabalhaNesteDia = horarioTrabalho.dias_personalizados?.includes(diaAtual) || false;
      }
      
      if (!trabalhaNesteDia) return false;

      // Determinar qual configuração de horário usar baseado no dia
      if (diaSemana === 6 && horarioTrabalho.sabado) {
        // Sábado - usar configuração específica do sábado
        periodosTrabalho = [
          {
            inicio: horarioTrabalho.sabado.periodo1_inicio,
            fim: horarioTrabalho.sabado.periodo1_fim
          }
        ];
        if (horarioTrabalho.sabado.periodo2_inicio && horarioTrabalho.sabado.periodo2_fim) {
          periodosTrabalho.push({
            inicio: horarioTrabalho.sabado.periodo2_inicio,
            fim: horarioTrabalho.sabado.periodo2_fim
          });
        }
      } else if (diaSemana >= 1 && diaSemana <= 5 && horarioTrabalho.segunda_sexta) {
        // Segunda a sexta - usar configuração de segunda a sexta
        periodosTrabalho = [
          {
            inicio: horarioTrabalho.segunda_sexta.periodo1_inicio,
            fim: horarioTrabalho.segunda_sexta.periodo1_fim
          }
        ];
        if (horarioTrabalho.segunda_sexta.periodo2_inicio && horarioTrabalho.segunda_sexta.periodo2_fim) {
          periodosTrabalho.push({
            inicio: horarioTrabalho.segunda_sexta.periodo2_inicio,
            fim: horarioTrabalho.segunda_sexta.periodo2_fim
          });
        }
      }
    }

    // Verificar se o período desejado se encaixa em algum período de trabalho
    return periodosTrabalho.some(periodo => {
      if (!periodo.inicio || !periodo.fim) return false;
      return inicioDesejado >= periodo.inicio && fimDesejado <= periodo.fim;
    });
  };

  const limparFiltros = () => {
    setFiltroPosgGraduacao('todas');
    setFiltroHorarioInicio('');
    setFiltroHorarioFim('');
  };

  const posGraduacoesUnicas = [...new Set(
    vendedores.flatMap(v => v.cursos || [])
  )].sort();

  const verificarDisponibilidade = (vendedor: Vendedor, data: Date) => {
    if (!vendedor.horario_trabalho) return false;

    const diaSemana = data.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    const horarioTrabalho = vendedor.horario_trabalho;

    // Verificar formato novo do horário
    if (horarioTrabalho.dias_trabalho) {
      if (horarioTrabalho.dias_trabalho === 'segunda_sabado') {
        return diaSemana >= 1 && diaSemana <= 6; // Segunda a sábado
      } else if (horarioTrabalho.dias_trabalho === 'personalizado') {
        const diasMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const diaAtual = diasMap[diaSemana];
        return horarioTrabalho.dias_personalizados?.includes(diaAtual) || false;
      }
    }

    // Formato antigo - assumir segunda a sexta
    return diaSemana >= 1 && diaSemana <= 5;
  };

  const getAgendamentosVendedor = (vendedorId: string) => {
    return agendamentos.filter(ag => ag.vendedor_id === vendedorId);
  };

  const getStatusDisponibilidade = (vendedor: Vendedor) => {
    if (!selectedDate) return 'indefinido';
    
    const isDisponivel = verificarDisponibilidade(vendedor, selectedDate);
    if (!isDisponivel) return 'indisponivel';
    
    const agendamentosDoVendedor = getAgendamentosVendedor(vendedor.id);
    
    // Se tem filtro de horário, verificar disponibilidade específica
    if (filtroHorarioInicio && filtroHorarioFim) {
      const temHorarioDisponivel = verificarHorarioDisponivel(
        vendedor, 
        selectedDate, 
        filtroHorarioInicio, 
        filtroHorarioFim
      );
      
      if (!temHorarioDisponivel) return 'indisponivel';
      
      // Verificar conflitos de agendamento no período específico
      const temConflito = agendamentosDoVendedor.some(agendamento => {
        const inicioAgendamento = new Date(agendamento.data_agendamento);
        const fimAgendamento = agendamento.data_fim_agendamento 
          ? new Date(agendamento.data_fim_agendamento)
          : new Date(inicioAgendamento.getTime() + 60 * 60 * 1000);

        const inicioFiltro = new Date(selectedDate);
        inicioFiltro.setHours(parseInt(filtroHorarioInicio.split(':')[0]), parseInt(filtroHorarioInicio.split(':')[1]));
        
        const fimFiltro = new Date(selectedDate);
        fimFiltro.setHours(parseInt(filtroHorarioFim.split(':')[0]), parseInt(filtroHorarioFim.split(':')[1]));

        return inicioAgendamento < fimFiltro && fimAgendamento > inicioFiltro;
      });
      
      return temConflito ? 'ocupado' : 'livre';
    }
    
    // Lógica original para quando não há filtro de horário
    if (agendamentosDoVendedor.length === 0) return 'livre';
    
    return 'ocupado';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'livre':
        return <Badge variant="default" className="bg-green-500">Livre</Badge>;
      case 'ocupado':
        return <Badge variant="secondary">Ocupado</Badge>;
      case 'indisponivel':
        return <Badge variant="destructive">Indisponível</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Agenda Geral - Disponibilidade dos Vendedores
          </DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                </Button>
                {((filtroPosgGraduacao && filtroPosgGraduacao !== 'todas') || filtroHorarioInicio || filtroHorarioFim) && (
                  <Button variant="outline" size="sm" onClick={limparFiltros}>
                    <X className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro por Pós-graduação */}
                <div>
                  <Label htmlFor="filtro-pos">Pós-graduação</Label>
                  <Select value={filtroPosgGraduacao} onValueChange={setFiltroPosgGraduacao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as especializações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as especializações</SelectItem>
                      {posGraduacoesUnicas.map((pos, index) => (
                        <SelectItem key={index} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Horário Início */}
                <div>
                  <Label htmlFor="filtro-inicio">Horário Início</Label>
                  <Input
                    id="filtro-inicio"
                    type="time"
                    value={filtroHorarioInicio}
                    onChange={(e) => setFiltroHorarioInicio(e.target.value)}
                    placeholder="HH:mm"
                  />
                </div>

                {/* Filtro de Horário Fim */}
                <div>
                  <Label htmlFor="filtro-fim">Horário Fim</Label>
                  <Input
                    id="filtro-fim"
                    type="time"
                    value={filtroHorarioFim}
                    onChange={(e) => setFiltroHorarioFim(e.target.value)}
                    placeholder="HH:mm"
                  />
                </div>
              </div>
              
              {filtroHorarioInicio && filtroHorarioFim && filtroHorarioInicio >= filtroHorarioFim && (
                <div className="text-sm text-destructive">
                  O horário de início deve ser anterior ao horário de fim.
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Selecione uma Data</CardTitle>
                <CardDescription>
                  Clique em uma data para ver a disponibilidade dos vendedores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < startOfDay(new Date())}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          </div>

          {/* Lista de Vendedores */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Disponibilidade para {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {((filtroPosgGraduacao && filtroPosgGraduacao !== 'todas') || (filtroHorarioInicio && filtroHorarioFim)) && (
                    <div className="text-sm font-normal text-muted-foreground mt-1">
                      {filtroPosgGraduacao && filtroPosgGraduacao !== 'todas' && (
                        <Badge variant="outline" className="mr-2">
                          {filtroPosgGraduacao}
                        </Badge>
                      )}
                      {filtroHorarioInicio && filtroHorarioFim && (
                        <Badge variant="outline">
                          {filtroHorarioInicio} - {filtroHorarioFim}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardTitle>
                <CardDescription>
                  Vendedores e suas especializações 
                  {vendedoresFiltrados.length !== vendedores.length && (
                    <span className="text-primary">
                      ({vendedoresFiltrados.length} de {vendedores.length} vendedores)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : vendedoresFiltrados.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      {vendedores.length === 0 
                        ? "Nenhum vendedor encontrado"
                        : "Nenhum vendedor corresponde aos filtros aplicados"
                      }
                    </div>
                    {((filtroPosgGraduacao && filtroPosgGraduacao !== 'todas') || filtroHorarioInicio || filtroHorarioFim) && (
                      <Button variant="outline" size="sm" className="mt-2" onClick={limparFiltros}>
                        Limpar Filtros
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vendedoresFiltrados.map((vendedor) => {
                      const status = getStatusDisponibilidade(vendedor);
                      const agendamentosDoVendedor = getAgendamentosVendedor(vendedor.id);
                      
                      return (
                        <div key={vendedor.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={vendedor.photo_url} />
                                <AvatarFallback>
                                  {vendedor.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{vendedor.name}</h4>
                                <p className="text-sm text-muted-foreground">{vendedor.email}</p>
                              </div>
                            </div>
                            {getStatusBadge(status)}
                          </div>

                          {/* Horário de Trabalho */}
                          {vendedor.horario_trabalho && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatarHorarioTrabalho(vendedor.horario_trabalho)}</span>
                            </div>
                          )}

                          {/* Especializações */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Book className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Especializações:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {vendedor.cursos && vendedor.cursos.length > 0 ? (
                                vendedor.cursos.map((curso, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {curso}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">Nenhuma especialização definida</span>
                              )}
                            </div>
                          </div>

                          {/* Agendamentos do dia */}
                          {agendamentosDoVendedor.length > 0 && (
                            <div className="border-t pt-3">
                              <h5 className="text-sm font-medium mb-2">Agendamentos do dia:</h5>
                              <div className="space-y-1">
                                {agendamentosDoVendedor.map((agendamento) => (
                                  <div key={agendamento.id} className="text-xs bg-muted p-2 rounded">
                                    <div className="flex justify-between">
                                      <span>{format(new Date(agendamento.data_agendamento), 'HH:mm')}</span>
                                      <span>{agendamento.lead?.nome}</span>
                                    </div>
                                    <div className="text-muted-foreground">
                                      {agendamento.pos_graduacao_interesse}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgendaGeral;