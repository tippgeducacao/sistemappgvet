import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AgendamentosService } from '@/services/agendamentos/AgendamentosService';

export interface EditarHorarioSDRDialogAgendamento {
  id: string;
  data_agendamento: string;
  data_fim_agendamento?: string;
  observacoes?: string;
}

interface EditarHorarioSDRDialogProps {
  agendamento: EditarHorarioSDRDialogAgendamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const EditarHorarioSDRDialog: React.FC<EditarHorarioSDRDialogProps> = ({
  agendamento,
  open,
  onOpenChange,
  onSaved,
}) => {
  const [data, setData] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!agendamento) return;
    const inicio = new Date(agendamento.data_agendamento);
    const fim = agendamento.data_fim_agendamento ? new Date(agendamento.data_fim_agendamento) : null;
    setData(inicio.toISOString().split('T')[0]);
    setHorarioInicio(inicio.toTimeString().slice(0, 5));
    setHorarioFim(fim ? fim.toTimeString().slice(0, 5) : '');
    setObservacoes(agendamento.observacoes || '');
  }, [agendamento, open]);

  const handleSave = async () => {
    if (!agendamento) return;
    if (!data || !horarioInicio) {
      toast.error('Preencha data e horário de início');
      return;
    }
    if (horarioFim && horarioFim <= horarioInicio) {
      toast.error('O horário final deve ser posterior ao início');
      return;
    }

    setSaving(true);
    try {
      // Sempre usar timezone do Brasil (-03:00) para consistência no back
      const dataAgendamento = `${data}T${horarioInicio}:00.000-03:00`;
      const dataFimAgendamento = horarioFim ? `${data}T${horarioFim}:00.000-03:00` : undefined;

      const ok = await AgendamentosService.atualizarAgendamentoSDR(agendamento.id, {
        data_agendamento: dataAgendamento,
        data_fim_agendamento: dataFimAgendamento,
        observacoes,
      });

      if (ok) {
        toast.success('Horário atualizado com sucesso! Validações de agenda aplicadas.');
        onOpenChange(false);
        onSaved?.();
      } else {
        toast.error('Não foi possível atualizar o agendamento');
      }
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Erro ao atualizar agendamento';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar horário da reunião</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="inicio">Horário início</Label>
              <Input id="inicio" type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="fim">Horário fim</Label>
              <Input id="fim" type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Motivo da alteração, info para o vendedor..." />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditarHorarioSDRDialog;
