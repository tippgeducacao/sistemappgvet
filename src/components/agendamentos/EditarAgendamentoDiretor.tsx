import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Clock, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EditarAgendamentoDiretorProps {
  agendamento: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditarAgendamentoDiretor: React.FC<EditarAgendamentoDiretorProps> = ({
  agendamento,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [posGraduacoes, setPosGraduacoes] = useState<any[]>([]);
  
  // Form states
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [selectedLead, setSelectedLead] = useState('');
  const [selectedPosGraduacao, setSelectedPosGraduacao] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [linkReuniao, setLinkReuniao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (isOpen && agendamento) {
      carregarDados();
      preencherFormulario();
    }
  }, [isOpen, agendamento]);

  const carregarDados = async () => {
    try {
      // Carregar vendedores
      const { data: vendedoresData, error: vendedoresError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('user_type', ['vendedor', 'sdr'])
        .eq('ativo', true)
        .order('name');

      if (vendedoresError) throw vendedoresError;
      setVendedores(vendedoresData || []);

      // Carregar leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, nome, email')
        .order('nome');

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

      // Carregar pós-graduações individuais
      const { data: posGraduacoesData, error: posGraduacoesError } = await supabase
        .from('cursos')
        .select('id, nome')
        .eq('ativo', true)
        .eq('modalidade', 'Pós-Graduação')
        .order('nome');

      if (posGraduacoesError) throw posGraduacoesError;
      setPosGraduacoes(posGraduacoesData || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const preencherFormulario = () => {
    if (!agendamento) return;

    console.log('📝 Preenchendo formulário com agendamento:', agendamento);

    setSelectedVendedor(agendamento.vendedor_id || '');
    setSelectedLead(agendamento.lead_id || '');
    setSelectedPosGraduacao(agendamento.pos_graduacao_interesse || '');
    setLinkReuniao(agendamento.link_reuniao || '');
    setObservacoes(agendamento.observacoes || '');

    // Extrair data e hora sem conversões de timezone complicadas
    if (agendamento.data_agendamento) {
      const dataInicio = new Date(agendamento.data_agendamento);
      
      // Usar o horário local diretamente
      const ano = dataInicio.getFullYear();
      const mes = String(dataInicio.getMonth() + 1).padStart(2, '0');
      const dia = String(dataInicio.getDate()).padStart(2, '0');
      const horas = String(dataInicio.getHours()).padStart(2, '0');
      const minutos = String(dataInicio.getMinutes()).padStart(2, '0');
      
      setDataAgendamento(`${ano}-${mes}-${dia}`);
      setHoraInicio(`${horas}:${minutos}`);
    }

    if (agendamento.data_fim_agendamento) {
      const dataFim = new Date(agendamento.data_fim_agendamento);
      const horasFim = String(dataFim.getHours()).padStart(2, '0');
      const minutosFim = String(dataFim.getMinutes()).padStart(2, '0');
      setHoraFim(`${horasFim}:${minutosFim}`);
    }
  };

  const handleSubmit = async () => {
    if (!selectedVendedor || !selectedPosGraduacao || 
        !dataAgendamento || !horaInicio || !horaFim || !linkReuniao.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar se horário final é após horário inicial
    if (horaFim <= horaInicio) {
      toast.error('O horário final deve ser posterior ao horário inicial');
      return;
    }

    try {
      setLoading(true);

      // Construir as datas completas
      const dataHoraInicio = `${dataAgendamento}T${horaInicio}:00.000-03:00`;
      const dataHoraFim = `${dataAgendamento}T${horaFim}:00.000-03:00`;

      console.log('📅 Atualizando agendamento:', {
        id: agendamento.id,
        vendedor_id: selectedVendedor,
        pos_graduacao_interesse: selectedPosGraduacao,
        data_agendamento: dataHoraInicio,
        data_fim_agendamento: dataHoraFim,
        link_reuniao: linkReuniao,
        observacoes: observacoes
      });

      // Atualizar o agendamento (sem alterar o lead_id)
      const { error } = await supabase
        .from('agendamentos')
        .update({
          vendedor_id: selectedVendedor,
          pos_graduacao_interesse: selectedPosGraduacao,
          data_agendamento: dataHoraInicio,
          data_fim_agendamento: dataHoraFim,
          link_reuniao: linkReuniao,
          observacoes: observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', agendamento.id);

      if (error) throw error;

      toast.success('Agendamento atualizado com sucesso!');
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Agendamento (Diretor)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead - Não editável */}
          <div className="space-y-2">
            <Label>Lead *</Label>
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {agendamento?.lead?.nome || 'Lead não encontrado'}
              </span>
              {agendamento?.lead?.email && (
                <span className="text-muted-foreground">
                  ({agendamento.lead.email})
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              O lead não pode ser alterado em agendamentos existentes
            </p>
          </div>

          {/* Vendedor */}
          <div className="space-y-2">
            <Label>Vendedor *</Label>
            <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o vendedor" />
              </SelectTrigger>
              <SelectContent>
                {vendedores.map((vendedor) => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {vendedor.name} ({vendedor.email})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pós-graduação */}
          <div className="space-y-2">
            <Label>Pós-graduação *</Label>
            <Select value={selectedPosGraduacao} onValueChange={setSelectedPosGraduacao}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a pós-graduação" />
              </SelectTrigger>
              <SelectContent>
                {posGraduacoes.map((pos) => (
                  <SelectItem key={pos.id} value={pos.nome}>
                    {pos.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label>Data *</Label>
            <Input
              type="date"
              value={dataAgendamento}
              onChange={(e) => setDataAgendamento(e.target.value)}
            />
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário Início *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Horário Fim *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Link da Reunião */}
          <div className="space-y-2">
            <Label>Link da Reunião *</Label>
            <Input
              value={linkReuniao}
              onChange={(e) => setLinkReuniao(e.target.value)}
              placeholder="https://meet.google.com/umx-qbss-wrg"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre o agendamento..."
              rows={3}
            />
          </div>

          {/* Status do agendamento */}
          {agendamento && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Status atual:</span>
                <Badge variant={
                  agendamento.status === 'agendado' ? 'default' :
                  agendamento.status === 'finalizado' ? 'secondary' :
                  agendamento.status === 'cancelado' ? 'destructive' :
                  'outline'
                }>
                  {agendamento.status}
                </Badge>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};