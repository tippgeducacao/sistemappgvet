import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/AuthStore';

interface EventoEspecial {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  is_recorrente: boolean;
  tipo_recorrencia?: string;
  dias_semana?: number[];
  data_inicio_recorrencia?: string;
  data_fim_recorrencia?: string;
  hora_inicio: string;
  hora_fim: string;
}

const DIAS_SEMANA = [
  { id: 0, nome: 'Domingo' },
  { id: 1, nome: 'Segunda' },
  { id: 2, nome: 'Terça' },
  { id: 3, nome: 'Quarta' },
  { id: 4, nome: 'Quinta' },
  { id: 5, nome: 'Sexta' },
  { id: 6, nome: 'Sábado' }
];

export const GerenciarEventosRecorrentes = () => {
  const { profile } = useAuthStore();
  const [eventos, setEventos] = useState<EventoEspecial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<EventoEspecial | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    is_recorrente: false,
    tipo_recorrencia: 'semanal',
    dias_semana: [] as number[],
    data_inicio_recorrencia: '',
    data_fim_recorrencia: '',
    hora_inicio: '',
    hora_fim: ''
  });

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('eventos_especiais')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast.error('Erro ao carregar eventos recorrentes');
    } finally {
      setIsLoading(false);
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
      data_inicio_recorrencia: '',
      data_fim_recorrencia: '',
      hora_inicio: '',
      hora_fim: ''
    });
    setEventoEditando(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      setIsLoading(true);

      const dadosEvento = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data_inicio: formData.is_recorrente ? `${formData.data_inicio_recorrencia}T${formData.hora_inicio}:00` : `${formData.data_inicio}T${formData.hora_inicio}:00`,
        data_fim: formData.is_recorrente ? `${formData.data_inicio_recorrencia}T${formData.hora_fim}:00` : `${formData.data_fim}T${formData.hora_fim}:00`,
        is_recorrente: formData.is_recorrente,
        tipo_recorrencia: formData.is_recorrente ? formData.tipo_recorrencia : null,
        dias_semana: formData.is_recorrente ? formData.dias_semana : null,
        data_inicio_recorrencia: formData.is_recorrente ? formData.data_inicio_recorrencia : null,
        data_fim_recorrencia: formData.is_recorrente ? formData.data_fim_recorrencia : null,
        hora_inicio: formData.hora_inicio,
        hora_fim: formData.hora_fim,
        created_by: profile.id
      };

      let response;
      if (eventoEditando) {
        response = await supabase
          .from('eventos_especiais')
          .update(dadosEvento)
          .eq('id', eventoEditando.id);
      } else {
        response = await supabase
          .from('eventos_especiais')
          .insert([dadosEvento]);
      }

      if (response.error) throw response.error;

      toast.success(eventoEditando ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      await fetchEventos();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (evento: EventoEspecial) => {
    setEventoEditando(evento);
    setFormData({
      titulo: evento.titulo,
      descricao: evento.descricao || '',
      data_inicio: evento.data_inicio.split('T')[0],
      data_fim: evento.data_fim.split('T')[0],
      is_recorrente: evento.is_recorrente,
      tipo_recorrencia: evento.tipo_recorrencia || 'semanal',
      dias_semana: evento.dias_semana || [],
      data_inicio_recorrencia: evento.data_inicio_recorrencia || '',
      data_fim_recorrencia: evento.data_fim_recorrencia || '',
      hora_inicio: evento.hora_inicio,
      hora_fim: evento.hora_fim
    });
    setIsDialogOpen(true);
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
      await fetchEventos();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento');
    }
  };

  const handleDiasSemanaChange = (dia: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dias_semana: checked 
        ? [...prev.dias_semana, dia]
        : prev.dias_semana.filter(d => d !== dia)
    }));
  };

  const formatarDiasSemana = (dias: number[]) => {
    if (!dias?.length) return '';
    return dias.map(dia => DIAS_SEMANA.find(d => d.id === dia)?.nome).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Eventos Recorrentes</h2>
          <p className="text-muted-foreground">Gerencie reuniões e eventos que bloqueiam horários de agendamento</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {eventoEditando ? 'Editar Evento' : 'Novo Evento Recorrente'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    placeholder="Ex: Reunião Comercial"
                    required
                  />
                </div>
                
                <div>
                  <Label>Tipo</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox 
                      id="is_recorrente"
                      checked={formData.is_recorrente}
                      onCheckedChange={(checked) => setFormData({...formData, is_recorrente: !!checked})}
                    />
                    <Label htmlFor="is_recorrente">Evento Recorrente</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descrição do evento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hora_inicio">Horário de Início *</Label>
                  <Input
                    id="hora_inicio"
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="hora_fim">Horário de Fim *</Label>
                  <Input
                    id="hora_fim"
                    type="time"
                    value={formData.hora_fim}
                    onChange={(e) => setFormData({...formData, hora_fim: e.target.value})}
                    required
                  />
                </div>
              </div>

              {formData.is_recorrente ? (
                <>
                  <div>
                    <Label>Dias da Semana *</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {DIAS_SEMANA.map(dia => (
                        <div key={dia.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`dia-${dia.id}`}
                            checked={formData.dias_semana.includes(dia.id)}
                            onCheckedChange={(checked) => handleDiasSemanaChange(dia.id, !!checked)}
                          />
                          <Label htmlFor={`dia-${dia.id}`} className="text-sm">{dia.nome}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="data_inicio_recorrencia">Data de Início *</Label>
                      <Input
                        id="data_inicio_recorrencia"
                        type="date"
                        value={formData.data_inicio_recorrencia}
                        onChange={(e) => setFormData({...formData, data_inicio_recorrencia: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="data_fim_recorrencia">Data de Fim</Label>
                      <Input
                        id="data_fim_recorrencia"
                        type="date"
                        value={formData.data_fim_recorrencia}
                        onChange={(e) => setFormData({...formData, data_fim_recorrencia: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data_inicio">Data de Início *</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="data_fim">Data de Fim *</Label>
                    <Input
                      id="data_fim"
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) => setFormData({...formData, data_fim: e.target.value})}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : eventoEditando ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Carregando eventos...</p>
            </CardContent>
          </Card>
        ) : eventos.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Nenhum evento recorrente cadastrado</p>
                <p className="text-sm text-muted-foreground">
                  Crie eventos recorrentes para bloquear horários específicos nos agendamentos
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          eventos.map(evento => (
            <Card key={evento.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{evento.titulo}</CardTitle>
                    {evento.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">{evento.descricao}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(evento)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(evento.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {evento.is_recorrente ? (
                    <Badge variant="secondary">
                      <Calendar className="w-3 h-3 mr-1" />
                      Recorrente
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Calendar className="w-3 h-3 mr-1" />
                      Único
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {evento.hora_inicio} - {evento.hora_fim}
                  </Badge>
                </div>
                
                {evento.is_recorrente ? (
                  <div className="space-y-2 text-sm">
                    <p><strong>Dias:</strong> {formatarDiasSemana(evento.dias_semana || [])}</p>
                    <p><strong>Período:</strong> {evento.data_inicio_recorrencia} 
                      {evento.data_fim_recorrencia && ` até ${evento.data_fim_recorrencia}`}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p><strong>Data:</strong> {new Date(evento.data_inicio).toLocaleDateString('pt-BR')} 
                      {evento.data_inicio !== evento.data_fim && ` até ${new Date(evento.data_fim).toLocaleDateString('pt-BR')}`}
                    </p>
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