import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, User, Clock, Book } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);

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

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Buscar vendedores ativos
      const { data: vendedoresData, error: vendedoresError } = await supabase
        .from('profiles')
        .select('id, name, email, pos_graduacoes, horario_trabalho')
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
        cursos: (vendedor.pos_graduacoes || []).map((cursoId: string) => {
          const curso = cursosData?.find(c => c.id === cursoId);
          return curso ? curso.nome : 'Curso não encontrado';
        })
      }));

      setVendedores(vendedoresComCursos);
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

  const verificarDisponibilidade = (vendedor: Vendedor, data: Date) => {
    if (!vendedor.horario_trabalho) return false;

    const diaSemana = data.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    const horarioTrabalho = vendedor.horario_trabalho;

    // Verificar formato novo do horário
    if (horarioTrabalho.dias_trabalho) {
      const diasValidos = horarioTrabalho.dias_trabalho === 'segunda_sabado' 
        ? [1, 2, 3, 4, 5, 6] 
        : [1, 2, 3, 4, 5];
      
      return diasValidos.includes(diaSemana);
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
                </CardTitle>
                <CardDescription>
                  Vendedores e suas especializações
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vendedores.map((vendedor) => {
                      const status = getStatusDisponibilidade(vendedor);
                      const agendamentosDoVendedor = getAgendamentosVendedor(vendedor.id);
                      
                      return (
                        <div key={vendedor.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-muted-foreground" />
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