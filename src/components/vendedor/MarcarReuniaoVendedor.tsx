import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Plus, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { AgendamentosService } from '@/services/agendamentos/AgendamentosService';

interface MarcarReuniaoVendedorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Lead {
  id: string;
  nome: string;
  email?: string;
  whatsapp?: string;
  status: string;
}

interface PosGraduacao {
  id: string;
  nome: string;
}

export const MarcarReuniaoVendedor: React.FC<MarcarReuniaoVendedorProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Estados do formulário - EXATAMENTE como no SDR
  const [posGraduacoes, setPosGraduacoes] = useState<PosGraduacao[]>([]);
  const [searchType, setSearchType] = useState<'nome' | 'email' | 'whatsapp'>('nome');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState('');
  const [selectedPosGraduacao, setSelectedPosGraduacao] = useState('');
  const [selectedDateForm, setSelectedDateForm] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [linkReuniao, setLinkReuniao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Estados para busca e criação de leads - EXATAMENTE como no SDR
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    observacoes: '',
    fonte_referencia: 'Vendedor',
    status: 'novo'
  });

  // Carregar dados iniciais
  useEffect(() => {
    if (isOpen) {
      carregarPosGraduacoes();
      resetForm();
    }
  }, [isOpen]);

  // Buscar leads com debounce - EXATAMENTE como no SDR
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        buscarLeads();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setFilteredLeads([]);
    }
  }, [searchTerm, searchType]);

  // Auto-calcular horário final - EXATAMENTE como no SDR
  useEffect(() => {
    if (selectedTime && selectedDateForm) {
      const [hours, minutes] = selectedTime.split(':');
      const startTime = new Date();
      startTime.setHours(parseInt(hours), parseInt(minutes));
      
      // Verificar se é depois das 17h ou se é sábado
      const isAfter17h = parseInt(hours) >= 17;
      const selectedDay = selectedDateForm ? new Date(selectedDateForm + 'T00:00:00').getDay() : null;
      const isSaturday = selectedDay === 6;
      
      // 30 minutos se for depois das 17h ou sábado, senão 45 minutos
      const durationMinutes = (isAfter17h || isSaturday) ? 30 : 45;
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
      const endTimeString = endTime.toTimeString().slice(0, 5);
      
      console.log('🎯 Definindo horário final:', {
        horario: selectedTime,
        isAfter17h,
        isSaturday,
        duracao: `${durationMinutes}min`,
        horarioFinal: endTimeString
      });
      
      setSelectedEndTime(endTimeString);
    }
  }, [selectedTime, selectedDateForm]);

  const carregarPosGraduacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('id, nome')
        .eq('ativo', true)
        .eq('modalidade', 'Pós-Graduação')
        .order('nome');

      if (error) throw error;
      setPosGraduacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar pós-graduações:', error);
      toast.error('Erro ao carregar pós-graduações');
    }
  };

  const buscarLeads = async () => {
    setIsSearching(true);
    try {
      let query = supabase
        .from('leads')
        .select('id, nome, email, whatsapp, status');

      // Aplicar filtro baseado no tipo de busca
      if (searchType === 'nome') {
        query = query.ilike('nome', `%${searchTerm}%`);
      } else if (searchType === 'email') {
        query = query.ilike('email', `%${searchTerm}%`);
      } else if (searchType === 'whatsapp') {
        query = query.ilike('whatsapp', `%${searchTerm}%`);
      }

      const { data, error } = await query
        .order('nome')
        .limit(100);

      if (error) throw error;
      
      // Remover duplicatas baseado no ID
      const uniqueLeads = data?.filter((lead, index, self) => 
        index === self.findIndex(l => l.id === lead.id)
      ) || [];
      
      setFilteredLeads(uniqueLeads);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast.error('Erro ao buscar leads');
    } finally {
      setIsSearching(false);
    }
  };

  const criarNovoLead = async () => {
    if (!newLeadData.nome || !newLeadData.email || !newLeadData.whatsapp) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          nome: newLeadData.nome,
          email: newLeadData.email,
          whatsapp: newLeadData.whatsapp,
          observacoes: newLeadData.observacoes,
          fonte_referencia: newLeadData.fonte_referencia,
          status: newLeadData.status,
          vendedor_atribuido: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Lead criado com sucesso!');
      setSelectedLead(data.id);
      setShowNewLeadForm(false);
      setNewLeadData({
        nome: '',
        email: '',
        whatsapp: '',
        observacoes: '',
        fonte_referencia: 'Vendedor',
        status: 'novo'
      });
      
      // Adicionar o novo lead aos resultados
      setFilteredLeads(prev => [data, ...prev]);
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
    }
  };

  const handleSubmit = async () => {
    if (!selectedLead || !selectedPosGraduacao || !selectedDateForm || !selectedTime || !selectedEndTime || !linkReuniao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!user?.id) {
      toast.error('Erro: usuário não identificado');
      return;
    }

    try {
      setLoading(true);

      // Formar as datas completas - EXATAMENTE como no SDR
      const dataHoraAgendamento = `${selectedDateForm}T${selectedTime}:00.000-03:00`;
      const dataHoraFim = `${selectedDateForm}T${selectedEndTime}:00.000-03:00`;

      console.log('🎯 Tentando agendar:', {
        dataHoraAgendamento,
        dataHoraFim,
        vendedorId: user.id
      });

      // Vendedores podem agendar fora do horário de trabalho - apenas verificar eventos especiais
      const temConflitosEventos = await AgendamentosService.verificarConflitosEventosEspeciais(
        dataHoraAgendamento,
        dataHoraFim
      );

      if (temConflitosEventos) {
        toast.error('Este horário conflita com um evento especial');
        return;
      }

      // Verificar conflitos de agenda
      const temConflito = await AgendamentosService.verificarConflitosAgenda(
        user.id,
        dataHoraAgendamento,
        dataHoraFim
      );

      if (temConflito) {
        toast.error('Você já tem um agendamento neste horário');
        return;
      }

      // Criar agendamento usando o serviço
      await AgendamentosService.criarAgendamentoVendedor({
        lead_id: selectedLead,
        vendedor_id: user.id,
        data_agendamento: dataHoraAgendamento,
        data_fim_agendamento: dataHoraFim,
        pos_graduacao_interesse: selectedPosGraduacao,
        link_reuniao: linkReuniao,
        observacoes: observacoes
      });

      toast.success('Reunião agendada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao agendar reunião:', error);
      toast.error('Erro ao agendar reunião');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchTerm('');
    setSelectedLead('');
    setSelectedPosGraduacao('');
    setSelectedDateForm('');
    setSelectedTime('');
    setSelectedEndTime('');
    setLinkReuniao('');
    setObservacoes('');
    setFilteredLeads([]);
    setShowNewLeadForm(false);
    setSearchType('nome');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Marcar Reunião
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Buscar Lead - EXATAMENTE como no SDR */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Buscar Lead *</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewLeadForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Lead
              </Button>
            </div>

            {showNewLeadForm ? (
              <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                <h4 className="font-medium">Criar Novo Lead</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome *</Label>
                    <Input
                      value={newLeadData.nome}
                      onChange={(e) => setNewLeadData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newLeadData.email}
                      onChange={(e) => setNewLeadData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>WhatsApp *</Label>
                    <Input
                      value={newLeadData.whatsapp}
                      onChange={(e) => setNewLeadData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Input
                      value={newLeadData.observacoes}
                      onChange={(e) => setNewLeadData(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Observações sobre o lead"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={criarNovoLead} size="sm">
                    Criar Lead
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewLeadForm(false)} size="sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nome">Nome</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={`Buscar por ${searchType}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>

                {isSearching && (
                  <p className="text-sm text-muted-foreground">(buscando...)</p>
                )}

                {filteredLeads.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    <p className="text-xs text-muted-foreground p-2 border-b bg-muted/50">
                      {filteredLeads.length} lead(s) encontrado(s)
                    </p>
                    {filteredLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedLead === lead.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                        }`}
                        onClick={() => setSelectedLead(lead.id)}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{lead.nome}</p>
                            {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                            {lead.whatsapp && <p className="text-xs text-muted-foreground">{lead.whatsapp}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pós-graduação Selection - EXATAMENTE como no SDR */}
          <div className="space-y-2">
            <Label htmlFor="pos-graduacao">Pós-graduação de Interesse *</Label>
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

          {/* Data e Horário - EXATAMENTE como no SDR */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={selectedDateForm}
                onChange={(e) => {
                  console.log('🎯 Data alterada:', e.target.value);
                  setSelectedDateForm(e.target.value);
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horario-inicio">Horário Início *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="horario-inicio"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => {
                      console.log('🎯 Horário alterado:', e.target.value);
                      setSelectedTime(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario-fim">Horário Fim *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="horario-fim"
                    type="time"
                    value={selectedEndTime}
                    onChange={(e) => setSelectedEndTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Link da Reunião - EXATAMENTE como no SDR */}
          <div className="space-y-2">
            <Label htmlFor="linkReuniao">Link da Reunião *</Label>
            <Input
              id="linkReuniao"
              type="url"
              placeholder="https://zoom.us/j/123456789 ou https://meet.google.com/abc-def-ghi"
              value={linkReuniao}
              onChange={(e) => setLinkReuniao(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Insira o link da Reunião online (Zoom, Google Meet, Teams, etc.)
            </p>
          </div>

          {/* Observações - EXATAMENTE como no SDR */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre o agendamento..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions - EXATAMENTE como no SDR */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { onClose(); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Criando...' : 'Criar Agendamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarcarReuniaoVendedor;