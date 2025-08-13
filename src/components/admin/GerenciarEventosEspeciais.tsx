import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Clock, Plus, Trash2, Edit, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventoEspecial {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  is_recorrente: boolean;
  tipo_recorrencia?: 'semanal' | 'mensal' | 'anual';
  dias_semana?: number[];
  hora_inicio: string;
  hora_fim: string;
  data_inicio_recorrencia?: string;
  data_fim_recorrencia?: string;
  created_at: string;
  updated_at: string;
}

const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' }
];

export const GerenciarEventosEspeciais = () => {
  const [eventos, setEventos] = useState<EventoEspecial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoEspecial | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    is_recorrente: false,
    tipo_recorrencia: 'semanal' as 'semanal' | 'mensal' | 'anual',
    dias_semana: [] as number[],
    hora_inicio: '09:00',
    hora_fim: '10:00',
    data_inicio_recorrencia: '',
    data_fim_recorrencia: ''
  });

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos_especiais')
        .select('*')
        .order('data_inicio', { ascending: true });

      if (error) throw error;
      
      // Mapear os dados para incluir valores padrão para campos opcionais
      const eventosComDefaults = (data || []).map(evento => ({
        ...evento,
        is_recorrente: (evento as any).is_recorrente || false,
        hora_inicio: (evento as any).hora_inicio || '09:00',
        hora_fim: (evento as any).hora_fim || '10:00',
        dias_semana: (evento as any).dias_semana || [],
        tipo_recorrencia: (evento as any).tipo_recorrencia || 'semanal' as 'semanal' | 'mensal' | 'anual',
        data_inicio_recorrencia: (evento as any).data_inicio_recorrencia || '',
        data_fim_recorrencia: (evento as any).data_fim_recorrencia || ''
      })) as EventoEspecial[];
      
      setEventos(eventosComDefaults);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast.error('Erro ao carregar eventos especiais');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo) {
      toast.error('Título é obrigatório');
      return;
    }

    // Validações para eventos únicos
    if (!formData.is_recorrente) {
      if (!formData.data_inicio || !formData.data_fim) {
        toast.error('Data de início e fim são obrigatórias para eventos únicos');
        return;
      }
      if (new Date(formData.data_inicio) >= new Date(formData.data_fim)) {
        toast.error('Data de fim deve ser posterior à data de início');
        return;
      }
    }

    // Validações para eventos recorrentes
    if (formData.is_recorrente) {
      if (!formData.data_inicio_recorrencia || !formData.data_fim_recorrencia) {
        toast.error('Período de recorrência é obrigatório');
        return;
      }
      if (formData.tipo_recorrencia === 'semanal' && formData.dias_semana.length === 0) {
        toast.error('Selecione pelo menos um dia da semana');
        return;
      }
      if (new Date(formData.data_inicio_recorrencia) >= new Date(formData.data_fim_recorrencia)) {
        toast.error('Data fim da recorrência deve ser posterior à data de início');
        return;
      }
    }

    try {
      const dadosEvento = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        is_recorrente: formData.is_recorrente,
        hora_inicio: formData.hora_inicio,
        hora_fim: formData.hora_fim,
        // Para eventos únicos, usar as datas completas
        data_inicio: formData.is_recorrente ? 
          `${formData.data_inicio_recorrencia}T${formData.hora_inicio}:00` : 
          formData.data_inicio,
        data_fim: formData.is_recorrente ? 
          `${formData.data_fim_recorrencia}T${formData.hora_fim}:00` : 
          formData.data_fim,
        // Campos específicos de recorrência
        tipo_recorrencia: formData.is_recorrente ? formData.tipo_recorrencia : null,
        dias_semana: formData.is_recorrente && formData.tipo_recorrencia === 'semanal' ? 
          formData.dias_semana : null,
        data_inicio_recorrencia: formData.is_recorrente ? formData.data_inicio_recorrencia : null,
        data_fim_recorrencia: formData.is_recorrente ? formData.data_fim_recorrencia : null
      };

      if (editingEvento) {
        const { error } = await supabase
          .from('eventos_especiais')
          .update(dadosEvento)
          .eq('id', editingEvento.id);

        if (error) throw error;
        toast.success('Evento atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('eventos_especiais')
          .insert({
            ...dadosEvento,
            created_by: (await supabase.auth.getUser()).data.user?.id!
          });

        if (error) throw error;
        toast.success('Evento criado com sucesso!');
      }

      fetchEventos();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;

    try {
      const { error } = await supabase
        .from('eventos_especiais')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Evento excluído com sucesso!');
      fetchEventos();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      data_inicio: '',
      data_fim: '',
      is_recorrente: false,
      tipo_recorrencia: 'semanal',
      dias_semana: [],
      hora_inicio: '09:00',
      hora_fim: '10:00',
      data_inicio_recorrencia: '',
      data_fim_recorrencia: ''
    });
    setEditingEvento(null);
  };

  const openEditDialog = (evento: EventoEspecial) => {
    setEditingEvento(evento);
    setFormData({
      titulo: evento.titulo,
      descricao: evento.descricao || '',
      data_inicio: evento.is_recorrente ? '' : evento.data_inicio.slice(0, 16),
      data_fim: evento.is_recorrente ? '' : evento.data_fim.slice(0, 16),
      is_recorrente: evento.is_recorrente,
      tipo_recorrencia: evento.tipo_recorrencia || 'semanal',
      dias_semana: evento.dias_semana || [],
      hora_inicio: evento.hora_inicio,
      hora_fim: evento.hora_fim,
      data_inicio_recorrencia: evento.data_inicio_recorrencia || '',
      data_fim_recorrencia: evento.data_fim_recorrencia || ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const toggleDiaSemana = (dia: number) => {
    setFormData(prev => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(dia) 
        ? prev.dias_semana.filter(d => d !== dia)
        : [...prev.dias_semana, dia].sort()
    }));
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando eventos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Eventos Especiais</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvento ? 'Editar Evento' : 'Novo Evento Especial'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Treinamento Geral"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Detalhes do evento..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_recorrente"
                    checked={formData.is_recorrente}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_recorrente: !!checked }))
                    }
                  />
                  <Label htmlFor="is_recorrente" className="flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    Evento recorrente
                  </Label>
                </div>

                {!formData.is_recorrente ? (
                  // Evento único
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="data_inicio">Data/Hora Início *</Label>
                      <Input
                        id="data_inicio"
                        type="datetime-local"
                        value={formData.data_inicio}
                        onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                        required={!formData.is_recorrente}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="data_fim">Data/Hora Fim *</Label>
                      <Input
                        id="data_fim"
                        type="datetime-local"
                        value={formData.data_fim}
                        onChange={(e) => setFormData(prev => ({ ...prev, data_fim: e.target.value }))}
                        required={!formData.is_recorrente}
                      />
                    </div>
                  </div>
                ) : (
                  // Evento recorrente
                  <div className="space-y-4">
                    <div>
                      <Label>Tipo de Recorrência</Label>
                      <Select
                        value={formData.tipo_recorrencia}
                        onValueChange={(value: 'semanal' | 'mensal' | 'anual') => 
                          setFormData(prev => ({ ...prev, tipo_recorrencia: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.tipo_recorrencia === 'semanal' && (
                      <div>
                        <Label>Dias da Semana *</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {DIAS_SEMANA.map((dia) => (
                            <div key={dia.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`dia-${dia.value}`}
                                checked={formData.dias_semana.includes(dia.value)}
                                onCheckedChange={() => toggleDiaSemana(dia.value)}
                              />
                              <Label htmlFor={`dia-${dia.value}`} className="text-sm">
                                {dia.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Horário Início *</Label>
                        <Input
                          type="time"
                          value={formData.hora_inicio}
                          onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                          required={formData.is_recorrente}
                        />
                      </div>
                      <div>
                        <Label>Horário Fim *</Label>
                        <Input
                          type="time"
                          value={formData.hora_fim}
                          onChange={(e) => setFormData(prev => ({ ...prev, hora_fim: e.target.value }))}
                          required={formData.is_recorrente}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Início da Recorrência *</Label>
                        <Input
                          type="date"
                          value={formData.data_inicio_recorrencia}
                          onChange={(e) => setFormData(prev => ({ ...prev, data_inicio_recorrencia: e.target.value }))}
                          required={formData.is_recorrente}
                        />
                      </div>
                      <div>
                        <Label>Fim da Recorrência *</Label>
                        <Input
                          type="date"
                          value={formData.data_fim_recorrencia}
                          onChange={(e) => setFormData(prev => ({ ...prev, data_fim_recorrencia: e.target.value }))}
                          required={formData.is_recorrente}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingEvento ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {eventos.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum evento especial cadastrado</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          eventos.map((evento) => (
            <Card key={evento.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{evento.titulo}</CardTitle>
                    {evento.is_recorrente && (
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(evento)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(evento.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {evento.descricao && (
                  <p className="text-muted-foreground mb-3">{evento.descricao}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {!evento.is_recorrente ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(evento.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(evento.data_inicio), "HH:mm", { locale: ptBR })} às{' '}
                          {format(new Date(evento.data_fim), "HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <Repeat className="h-4 w-4" />
                        <span>
                          {evento.tipo_recorrencia?.charAt(0).toUpperCase() + evento.tipo_recorrencia?.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{evento.hora_inicio} às {evento.hora_fim}</span>
                      </div>
                      {evento.tipo_recorrencia === 'semanal' && evento.dias_semana && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {evento.dias_semana
                              .map(dia => DIAS_SEMANA.find(d => d.value === dia)?.label.slice(0, 3))
                              .join(', ')}
                          </span>
                        </div>
                      )}
                      {evento.data_inicio_recorrencia && evento.data_fim_recorrencia && (
                        <div className="text-xs">
                          ({format(new Date(evento.data_inicio_recorrencia), "dd/MM/yy", { locale: ptBR })} - {format(new Date(evento.data_fim_recorrencia), "dd/MM/yy", { locale: ptBR })})
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};