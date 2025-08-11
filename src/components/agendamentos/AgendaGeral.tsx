import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/stores/AuthStore';
import { useCursos } from '@/hooks/useCursos';

interface Vendedor {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
  grupos_pos_graduacoes: string[];
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
  sdr_id?: string;
  data_agendamento: string;
  data_fim_agendamento?: string;
  pos_graduacao_interesse: string;
  observacoes?: string;
  status: string;
  lead?: {
    nome: string;
  };
  sdr?: {
    name: string;
  };
}

interface AgendaGeralProps {
  isOpen: boolean;
  onClose: () => void;
}

const AgendaGeral: React.FC<AgendaGeralProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuthStore();
  const { cursos } = useCursos();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [vendedoresFiltrados, setVendedoresFiltrados] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [sdrs, setSdrs] = useState<any[]>([]);
  const [filtroGrupo, setFiltroGrupo] = useState<string>('todos');
  const [filtroSDR, setFiltroSDR] = useState<string>('todos');
  const [vendedorHorarioModal, setVendedorHorarioModal] = useState<Vendedor | null>(null);
  
  // Verificar se o usuário tem permissão para ver a agenda geral
  const temPermissao = profile?.user_type === 'admin' || 
                      profile?.user_type === 'secretaria' || 
                      profile?.user_type === 'diretor' ||
                       profile?.user_type === 'sdr';

  // Horários da timeline (6:00 às 00:00) - Aumentando altura das células para 80px
  const horarios = Array.from({ length: 19 }, (_, i) => {
    const hour = i + 6;
    if (hour >= 24) {
      return '00:00';
    }
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    if (isOpen && temPermissao) {
      carregarDados();
    } else if (isOpen && !temPermissao) {
      toast.error('Você não tem permissão para acessar a agenda geral');
      onClose();
    }
  }, [isOpen, temPermissao]);

  useEffect(() => {
    if (selectedDate && temPermissao) {
      carregarAgendamentosData();
    }
  }, [selectedDate, temPermissao]);

  useEffect(() => {
    aplicarFiltros();
  }, [vendedores, filtroGrupo, filtroSDR]);

  // Função para detectar conflitos de horário
  const detectarConflitos = (vendedorId: string, horario: string) => {
    const agendamentosHorario = getAgendamentosParaVendedorEHorario(vendedorId, horario);
    
    if (agendamentosHorario.length <= 1) return false;
    
    // Verificar se há sobreposição de horários
    for (let i = 0; i < agendamentosHorario.length; i++) {
      for (let j = i + 1; j < agendamentosHorario.length; j++) {
        const ag1 = agendamentosHorario[i];
        const ag2 = agendamentosHorario[j];
        
        const inicio1 = new Date(ag1.data_agendamento);
        const fim1 = ag1.data_fim_agendamento ? new Date(ag1.data_fim_agendamento) : new Date(inicio1.getTime() + 60 * 60 * 1000);
        
        const inicio2 = new Date(ag2.data_agendamento);
        const fim2 = ag2.data_fim_agendamento ? new Date(ag2.data_fim_agendamento) : new Date(inicio2.getTime() + 60 * 60 * 1000);
        
        // Verificar sobreposição
        if (inicio1 < fim2 && inicio2 < fim1) {
          return true;
        }
      }
    }
    
    return false;
  };

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

      // Buscar SDRs ativos (incluindo inbound e outbound)
      const { data: sdrsData, error: sdrsError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('user_type', ['sdr'])
        .eq('ativo', true)
        .order('name');

      if (sdrsError) throw sdrsError;

      // Buscar cursos para mapear os IDs para nomes
      const { data: cursosData, error: cursosError } = await supabase
        .from('cursos')
        .select('id, nome')
        .eq('ativo', true);

      if (cursosError) throw cursosError;

      // setCursos(cursosData || []); // Usando cursos do hook
      setSdrs(sdrsData || []);
      
      // Mapear grupos para vendedores
      const vendedoresComGrupos = (vendedoresData || []).map(vendedor => ({
        ...vendedor,
        horario_trabalho: vendedor.horario_trabalho as any,
        grupos_pos_graduacoes: vendedor.pos_graduacoes || [],
        cursos: (vendedor.pos_graduacoes || []).map((cursoId: string) => {
          const curso = cursos.find(c => c.id === cursoId);
          return curso ? curso.nome : 'Curso não encontrado';
        })
      })) as Vendedor[];

      setVendedores(vendedoresComGrupos);
      setVendedoresFiltrados(vendedoresComGrupos);
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
          sdr:profiles!agendamentos_sdr_id_fkey(name),
          leads!inner(nome)
        `)
        .gte('data_agendamento', `${dataFormatada}T00:00:00`)
        .lt('data_agendamento', `${dataFormatada}T23:59:59`)
        .in('status', ['agendado', 'atrasado', 'finalizado', 'finalizado_venda']);

      if (error) throw error;
      
      // Mapear os dados para incluir o nome do lead corretamente
      const agendamentosFormatados = (data || []).map(agendamento => ({
        ...agendamento,
        lead: {
          nome: agendamento.leads?.nome || 'Lead não encontrado'
        }
      }));
      
      setAgendamentos(agendamentosFormatados);
      console.log('📅 Agendamentos carregados:', agendamentosFormatados);
    } catch (error) {
      console.error('Erro ao carregar agendamentos da data:', error);
    }
  };

  const aplicarFiltros = () => {
    let vendedoresFiltrados = [...vendedores];

    // Filtro por grupo
    if (filtroGrupo && filtroGrupo !== 'todos') {
      vendedoresFiltrados = vendedoresFiltrados.filter(vendedor => 
        vendedor.cursos?.some(grupo => 
          grupo.toLowerCase().includes(filtroGrupo.toLowerCase())
        )
      );
    }

    setVendedoresFiltrados(vendedoresFiltrados);
  };

  const gruposUnicos = [...new Set(
    vendedores.flatMap(v => v.cursos || [])
  )].sort();

  const getAgendamentosParaVendedorEHorario = (vendedorId: string, horario: string) => {
    const horaTimeline = parseInt(horario.split(':')[0]);
    
    return agendamentos.filter(ag => {
      if (ag.vendedor_id !== vendedorId) return false;
      
      // Aplicar filtro por SDR se selecionado
      if (filtroSDR !== 'todos' && ag.sdr_id !== filtroSDR) return false;
      
      const dataAgendamento = new Date(ag.data_agendamento);
      const horaAgendamento = dataAgendamento.getHours();
      
      // Só mostrar o agendamento na linha da hora de INÍCIO
      // Isso evita duplicação nas células subsequentes
      return horaAgendamento === horaTimeline;
    });
  };

  const calcularPosicaoEAltura = (agendamento: Agendamento, horario: string) => {
    const dataInicio = new Date(agendamento.data_agendamento);
    const dataFim = agendamento.data_fim_agendamento ? new Date(agendamento.data_fim_agendamento) : null;
    
    const minutosInicio = dataInicio.getMinutes();
    const horaInicio = dataInicio.getHours();
    
    // Altura da célula
    const ALTURA_CELULA = 80;
    
    // Calcular posição vertical baseada nos minutos
    const topOffset = (minutosInicio / 60) * ALTURA_CELULA;
    
    // Calcular altura baseada na duração
    let altura = ALTURA_CELULA; // altura padrão de 1 hora
    if (dataFim) {
      const duracaoMinutos = (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60);
      // Converter duração em minutos para pixels
      altura = (duracaoMinutos / 60) * ALTURA_CELULA;
    }
    
    return { top: topOffset, height: Math.max(altura, 24) }; // altura mínima de 24px
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
            Agenda Geral - Todos os Agendamentos
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

              {/* Filtro de Grupos */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os grupos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os grupos</SelectItem>
                    {gruposUnicos.map((grupo, index) => (
                      <SelectItem key={index} value={grupo}>
                        {grupo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por SDR */}
              <div className="flex items-center gap-2">
                <Select value={filtroSDR} onValueChange={setFiltroSDR}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos os SDRs" />
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
                  {filtroGrupo !== 'todos' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => setFiltroGrupo('todos')}
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
                  {horarios.map((horario) => {
                    const horarioKey = `horario-${horario}`;
                    
                    return (
                      <div key={horarioKey} className="contents">
                        {/* Coluna de horário */}
                        <div className="border-b border-r p-3 text-center text-sm font-medium bg-muted/30">
                          {horario}
                        </div>
                        
                         {/* Colunas dos vendedores */}
                         {vendedoresFiltrados.map((vendedor) => {
                           const agendamentosHorario = getAgendamentosParaVendedorEHorario(vendedor.id, horario);
                           const temConflito = detectarConflitos(vendedor.id, horario);
                           
                           return (
                             <div 
                               key={`${vendedor.id}-${horario}`} 
                               className={`border-b border-l min-h-[80px] relative ${temConflito ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                             >
                                {temConflito && (
                                  <div className="absolute top-1 right-1 z-20" title="Conflito de horário detectado">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                  </div>
                                )}
                               {agendamentosHorario.map((agendamento, index) => {
                                 const { top, height } = calcularPosicaoEAltura(agendamento, horario);
                                 const isConflito = temConflito && agendamentosHorario.length > 1;
                                 
                                 return (
                                   <div
                                     key={`${agendamento.id}-${horario}-${index}`}
                                     className={`
                                       absolute left-1 right-1 rounded-sm border-l-4 p-2 text-xs
                                       ${isConflito ? 'bg-red-200 border-red-500 dark:bg-red-900/50' : getCorAgendamento(agendamento)}
                                       animate-fade-in
                                       ${isConflito ? 'ring-2 ring-red-300 dark:ring-red-600' : ''}
                                     `}
                                     style={{
                                       top: `${top + 2}px`,
                                       height: `${Math.max(height - 4, 24)}px`,
                                       zIndex: isConflito ? 15 : 10
                                     }}
                                     title={`${format(new Date(agendamento.data_agendamento), 'HH:mm')}${agendamento.data_fim_agendamento ? ` - ${format(new Date(agendamento.data_fim_agendamento), 'HH:mm')}` : ''} | ${agendamento.lead?.nome} | ${agendamento.pos_graduacao_interesse}${agendamento.sdr?.name ? ` | SDR: ${agendamento.sdr.name}` : ''}${isConflito ? ' | ⚠️ CONFLITO DE HORÁRIO' : ''}`}
                                   >
                                     <div className="h-full flex flex-col justify-start">
                                       <div className="flex items-center justify-between">
                                         <div className="font-semibold text-xs leading-tight">
                                           {format(new Date(agendamento.data_agendamento), 'HH:mm')}
                                           {agendamento.data_fim_agendamento && ` - ${format(new Date(agendamento.data_fim_agendamento), 'HH:mm')}`}
                                         </div>
                                         {isConflito && (
                                           <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0" />
                                         )}
                                       </div>
                                       <div className="font-medium text-xs truncate leading-tight mt-1">
                                         {agendamento.lead?.nome || 'Lead não encontrado'}
                                       </div>
                                       <div className="text-[10px] truncate opacity-80 leading-tight">
                                         {agendamento.pos_graduacao_interesse.replace('Pós-graduação: ', '')}
                                       </div>
                                       {agendamento.sdr?.name && (
                                         <div className="text-[9px] truncate opacity-70 leading-tight mt-0.5">
                                           SDR: {agendamento.sdr.name}
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                           );
                         })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-muted-foreground">
              {vendedoresFiltrados.length} vendedor(es) • {agendamentos.filter(ag => {
                if (filtroSDR !== 'todos' && ag.sdr_id !== filtroSDR) return false;
                return vendedoresFiltrados.some(v => v.id === ag.vendedor_id);
              }).length} agendamento(s)
              {filtroSDR !== 'todos' && (
                <span className="ml-2 text-primary">
                  • Filtrado por SDR: {sdrs.find(s => s.id === filtroSDR)?.name}
                </span>
              )}
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