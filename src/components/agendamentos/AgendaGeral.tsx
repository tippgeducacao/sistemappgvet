import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Vendedor {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
  pos_graduacoes: string[];
  cursos?: string[];
  horario_trabalho?: {
    manha_inicio?: string;
    manha_fim?: string;
    tarde_inicio?: string;
    tarde_fim?: string;
    sabado_inicio?: string;
    sabado_fim?: string;
  };
}

interface Agendamento {
  id: string;
  vendedor_id: string;
  data_agendamento: string;
  data_fim_agendamento?: string;
  pos_graduacao_interesse: string;
  observacoes?: string;
  status: string;
  lead?: {
    nome: string;
  };
}

interface AgendaGeralProps {
  isOpen: boolean;
  onClose: () => void;
}

const AgendaGeral: React.FC<AgendaGeralProps> = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [vendedoresFiltrados, setVendedoresFiltrados] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [filtroPosgGraduacao, setFiltroPosgGraduacao] = useState<string>('todas');
  const [vendedorHorarioModal, setVendedorHorarioModal] = useState<Vendedor | null>(null);

  // Horários da timeline (6:00 às 00:00)
  const horarios = Array.from({ length: 19 }, (_, i) => {
    const hour = i + 6;
    if (hour >= 24) {
      return '00:00';
    }
    return `${hour.toString().padStart(2, '0')}:00`;
  });

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

  useEffect(() => {
    aplicarFiltros();
  }, [vendedores, filtroPosgGraduacao]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Buscar apenas vendedores ativos
      const { data: vendedoresData, error: vendedoresError } = await supabase
        .from('profiles')
        .select('id, name, email, photo_url, pos_graduacoes, horario_trabalho')
        .eq('user_type', 'vendedor')
        .eq('ativo', true)
        .order('name');

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
        horario_trabalho: vendedor.horario_trabalho as any,
        cursos: (vendedor.pos_graduacoes || []).map((cursoId: string) => {
          const curso = cursosData?.find(c => c.id === cursoId);
          return curso ? curso.nome : 'Curso não encontrado';
        })
      })) as Vendedor[];

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

    setVendedoresFiltrados(vendedoresFiltrados);
  };

  const posGraduacoesUnicas = [...new Set(
    vendedores.flatMap(v => v.cursos || [])
  )].sort();

  const getAgendamentosParaVendedorEHorario = (vendedorId: string, horario: string) => {
    return agendamentos.filter(ag => {
      if (ag.vendedor_id !== vendedorId) return false;
      
      const dataAgendamento = new Date(ag.data_agendamento);
      const horaAgendamento = dataAgendamento.getHours();
      const horaTimeline = parseInt(horario.split(':')[0]);
      
      return horaAgendamento === horaTimeline;
    });
  };

  const getCorAgendamento = (agendamento: Agendamento) => {
    const cores = [
      'bg-blue-200 border-blue-400',
      'bg-green-200 border-green-400',
      'bg-yellow-200 border-yellow-400',
      'bg-purple-200 border-purple-400',
      'bg-pink-200 border-pink-400',
      'bg-indigo-200 border-indigo-400',
    ];
    
    // Usar hash simples baseado no ID para consistência de cores
    const hash = agendamento.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return cores[Math.abs(hash) % cores.length];
  };

  const navegarData = (direcao: 'anterior' | 'proximo') => {
    if (direcao === 'anterior') {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Agenda Geral - Timeline dos Vendedores
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[calc(95vh-120px)]">
          {/* Header com navegação e filtros */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              {/* Navegação de data */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navegarData('anterior')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="min-w-[200px] text-center">
                  <span className="font-medium text-lg">
                    {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navegarData('proximo')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Filtro de Pós-graduação */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select value={filtroPosgGraduacao} onValueChange={setFiltroPosgGraduacao}>
                  <SelectTrigger className="w-[250px]">
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
            </div>
          </div>

          {/* Timeline Container */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : vendedoresFiltrados.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    {vendedores.length === 0 
                      ? "Nenhum vendedor encontrado"
                      : "Nenhum vendedor corresponde ao filtro aplicado"
                    }
                  </p>
                  {filtroPosgGraduacao !== 'todas' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => setFiltroPosgGraduacao('todas')}
                    >
                      Limpar Filtro
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Grid da Timeline */}
                <div className="grid" style={{ 
                  gridTemplateColumns: `80px repeat(${vendedoresFiltrados.length}, 1fr)`,
                  minWidth: `${80 + (vendedoresFiltrados.length * 200)}px`
                }}>
                  {/* Header com vendedores */}
                  <div className="sticky top-0 bg-background border-b p-2 text-center font-medium text-sm">
                    Horário
                  </div>
                  {vendedoresFiltrados.map((vendedor) => (
                    <div key={vendedor.id} className="sticky top-0 bg-background border-b border-l p-3 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={vendedor.photo_url} />
                          <AvatarFallback className="text-xs">
                            {vendedor.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1">
                          <div className="text-xs font-medium">{vendedor.name}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => setVendedorHorarioModal(vendedor)}
                            title="Ver horário de expediente"
                          >
                            <Clock className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {vendedor.cursos?.slice(0, 2).map((curso, index) => (
                            <Badge key={index} variant="outline" className="text-[10px] px-1 py-0">
                              {curso.length > 15 ? `${curso.substring(0, 15)}...` : curso}
                            </Badge>
                          ))}
                          {vendedor.cursos && vendedor.cursos.length > 2 && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              +{vendedor.cursos.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Linhas de horário */}
                  {horarios.map((horario) => (
                    <React.Fragment key={horario}>
                      {/* Coluna de horário */}
                      <div className="border-b border-r p-3 text-center text-sm font-medium bg-muted/30">
                        {horario}
                      </div>
                      
                      {/* Colunas dos vendedores */}
                      {vendedoresFiltrados.map((vendedor) => {
                        const agendamentosHorario = getAgendamentosParaVendedorEHorario(vendedor.id, horario);
                        
                        return (
                          <div key={`${vendedor.id}-${horario}`} className="border-b border-l p-1 min-h-[60px] relative">
                            {agendamentosHorario.map((agendamento, index) => (
                              <div
                                key={agendamento.id}
                                className={`
                                  absolute inset-1 rounded-sm border-l-4 p-2 text-xs
                                  ${getCorAgendamento(agendamento)}
                                  ${index > 0 ? 'mt-1' : ''}
                                `}
                                style={{
                                  top: `${4 + (index * 20)}px`,
                                  height: agendamentosHorario.length > 1 ? '16px' : '52px'
                                }}
                                title={`${format(new Date(agendamento.data_agendamento), 'HH:mm')}${agendamento.data_fim_agendamento ? ` - ${format(new Date(agendamento.data_fim_agendamento), 'HH:mm')}` : ''} | ${agendamento.lead?.nome} | ${agendamento.pos_graduacao_interesse}`}
                              >
                                <div className="space-y-1">
                                  <div className="font-semibold text-xs">
                                    {format(new Date(agendamento.data_agendamento), 'HH:mm')}
                                    {agendamento.data_fim_agendamento && ` - ${format(new Date(agendamento.data_fim_agendamento), 'HH:mm')}`}
                                  </div>
                                  {agendamentosHorario.length === 1 && (
                                    <>
                                      <div className="font-medium text-xs truncate">
                                        {agendamento.lead?.nome}
                                      </div>
                                      <div className="text-[10px] truncate opacity-80">
                                        {agendamento.pos_graduacao_interesse}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-muted-foreground">
              {vendedoresFiltrados.length} vendedor(es) • {agendamentos.length} agendamento(s)
            </div>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>

        {/* Modal de Horário de Expediente */}
        {vendedorHorarioModal && (
          <Dialog open={!!vendedorHorarioModal} onOpenChange={() => setVendedorHorarioModal(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horário de Expediente - {vendedorHorarioModal.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={vendedorHorarioModal.photo_url} />
                    <AvatarFallback>
                      {vendedorHorarioModal.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{vendedorHorarioModal.name}</div>
                    <div className="text-sm text-muted-foreground">{vendedorHorarioModal.email}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Horários de Trabalho</h4>
                  {vendedorHorarioModal.horario_trabalho ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">Manhã</div>
                          <div className="text-lg">
                            {vendedorHorarioModal.horario_trabalho.manha_inicio || '09:00'} - {vendedorHorarioModal.horario_trabalho.manha_fim || '12:00'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">Tarde</div>
                          <div className="text-lg">
                            {vendedorHorarioModal.horario_trabalho.tarde_inicio || '13:00'} - {vendedorHorarioModal.horario_trabalho.tarde_fim || '18:00'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">Sábado</div>
                          <div className="text-lg">
                            {vendedorHorarioModal.horario_trabalho.sabado_inicio && vendedorHorarioModal.horario_trabalho.sabado_fim
                              ? `${vendedorHorarioModal.horario_trabalho.sabado_inicio} - ${vendedorHorarioModal.horario_trabalho.sabado_fim}`
                              : 'Não trabalha aos sábados'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-muted-foreground">
                        Horário padrão: 09:00 - 12:00 / 13:00 - 18:00
                      </div>
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium text-muted-foreground">Sábado</div>
                        <div className="text-muted-foreground">08:00 - 12:00</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setVendedorHorarioModal(null)}>
                    Fechar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AgendaGeral;