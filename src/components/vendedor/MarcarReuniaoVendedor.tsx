import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Clock, User, Calendar, Plus, X, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AgendamentosService } from '@/services/agendamentos/AgendamentosService';
import { useCreateLead } from '@/hooks/useCreateLead';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MarcarReuniaoVendedorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MarcarReuniaoVendedor: React.FC<MarcarReuniaoVendedorProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [posGraduacoes, setPosGraduacoes] = useState<any[]>([]);
  const [conflitos, setConflitos] = useState<string[]>([]);
  
  // Lead search state
  const [searchType, setSearchType] = useState<'nome' | 'email' | 'whatsapp'>('nome');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para busca dinâmica de leads
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Busca dinâmica de leads quando há termo de busca
  useEffect(() => {
    const buscarLeadsDinamicamente = async () => {
      if (!searchTerm || searchTerm.length < 2) return;
      
      setSearchLoading(true);
      try {
        let query = supabase
          .from('leads')
          .select('id, nome, email, whatsapp, status')
          .order('created_at', { ascending: false });

        // Aplicar filtro baseado no tipo de busca
        if (searchType === 'nome') {
          query = query.ilike('nome', `%${searchTerm}%`);
        } else if (searchType === 'email') {
          query = query.ilike('email', `%${searchTerm}%`);
        } else if (searchType === 'whatsapp') {
          query = query.ilike('whatsapp', `%${searchTerm}%`);
        }

        const { data: searchResults, error } = await query.limit(50);
        
        if (error) throw error;
        
        console.log(`🔍 Busca por "${searchTerm}" no campo ${searchType}:`, searchResults?.length || 0, 'resultados');
        
        // Combinar resultados da busca com leads já carregados (evitar duplicatas)
        const leadIds = new Set(leads.map(lead => lead.id));
        const newLeads = searchResults?.filter(lead => !leadIds.has(lead.id)) || [];
        
        if (newLeads.length > 0) {
          setLeads(prev => [...searchResults || [], ...prev.filter(lead => 
            !(searchResults || []).some(result => result.id === lead.id)
          )]);
        }
      } catch (error) {
        console.error('Erro na busca dinâmica de leads:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(buscarLeadsDinamicamente, 300); // Debounce de 300ms
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchType]);

  // Filtered leads based on search
  const filteredLeads = useMemo(() => {
    if (searchTerm && searchTerm.length >= 2) {
      return leads.filter(lead => {
        const searchValue = lead[searchType]?.toLowerCase() || '';
        return searchValue.includes(searchTerm.toLowerCase());
      });
    }
    return leads.slice(0, 100); // Mostrar primeiros 100 leads quando não há busca
  }, [leads, searchTerm, searchType]);

  // New lead form state
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    observacoes: '',
    fonte_referencia: 'Reunião Vendedor',
    status: 'novo'
  });
  
  // Form fields
  const [selectedLead, setSelectedLead] = useState('');
  const [selectedPosGraduacao, setSelectedPosGraduacao] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [linkReuniao, setLinkReuniao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const { mutate: createLead, isPending: isCreatingLead } = useCreateLead();

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      if (!isOpen) return;
      
      try {
        // Carregar leads (sem limite para pegar todos)
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('id, nome, email, whatsapp, status')
          .order('created_at', { ascending: false });

        if (leadsError) throw leadsError;
        console.log('📋 Total de leads carregados:', leadsData?.length || 0);
        setLeads(leadsData || []);

        // Carregar pós-graduações que o vendedor pode trabalhar
        const { data: userData } = await supabase
          .from('profiles')
          .select('pos_graduacoes')
          .eq('id', user?.id)
          .single();

        if (userData?.pos_graduacoes && userData.pos_graduacoes.length > 0) {
          const { data: posGradData, error: posGradError } = await supabase
            .from('grupos_pos_graduacoes')
            .select('id, nome, ativo')
            .in('id', userData.pos_graduacoes)
            .eq('ativo', true)
            .order('nome');

          if (posGradError) throw posGradError;
          setPosGraduacoes(posGradData || []);
        } else {
          // Se não tem pós-graduações específicas, carregar todas ativas
          const { data: todasPosGrad, error: todasError } = await supabase
            .from('grupos_pos_graduacoes')
            .select('id, nome, ativo')
            .eq('ativo', true)
            .order('nome');

          if (todasError) throw todasError;
          setPosGraduacoes(todasPosGrad || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados necessários');
      }
    };

    carregarDados();
  }, [isOpen, user?.id]);

  // Verificar conflitos quando data ou horário mudarem
  useEffect(() => {
    const verificarConflitos = async () => {
      if (!user?.id || !selectedDate || !selectedTime) {
        setConflitos([]);
        return;
      }

      try {
        const dataHora = `${selectedDate}T${selectedTime}:00.000-03:00`;
        const dataHoraFim = selectedEndTime 
          ? `${selectedDate}T${selectedEndTime}:00.000-03:00`
          : new Date(new Date(dataHora).getTime() + 60 * 60 * 1000).toISOString();

        const conflitosDetectados = [];

        // Verificar horário de trabalho
        const verificacaoHorario = await AgendamentosService.verificarHorarioTrabalho(
          user.id,
          dataHora,
          dataHoraFim
        );

        if (!verificacaoHorario.valido) {
          conflitosDetectados.push(`Horário fora do expediente: ${verificacaoHorario.motivo}`);
        }

        // Verificar conflitos com eventos especiais
        const temConflitosEventos = await AgendamentosService.verificarConflitosEventosEspeciais(
          dataHora,
          dataHoraFim
        );

        if (temConflitosEventos) {
          conflitosDetectados.push('Horário bloqueado por evento especial');
        }

        // Verificar conflitos de agenda
        const temConflito = await AgendamentosService.verificarConflitosAgenda(
          user.id,
          dataHora,
          dataHoraFim
        );

        if (temConflito) {
          conflitosDetectados.push('Você já possui agendamento neste horário');
        }

        setConflitos(conflitosDetectados);
      } catch (error) {
        console.error('Erro ao verificar conflitos:', error);
        setConflitos(['Erro ao verificar disponibilidade']);
      }
    };

    verificarConflitos();
  }, [user?.id, selectedDate, selectedTime, selectedEndTime]);

  const handleCreateNewLead = () => {
    if (!newLeadData.nome || !newLeadData.whatsapp) {
      toast.error('Nome e WhatsApp são obrigatórios');
      return;
    }

    createLead(newLeadData, {
      onSuccess: (leadCriado) => {
        console.log('✅ Lead criado:', leadCriado);
        setLeads(prev => [leadCriado, ...prev]);
        setSelectedLead(leadCriado.id);
        setShowNewLeadForm(false);
        setNewLeadData({
          nome: '',
          email: '',
          whatsapp: '',
          observacoes: '',
          fonte_referencia: 'Reunião Vendedor',
          status: 'novo'
        });
        toast.success('Lead criado com sucesso!');
      },
      onError: (error) => {
        console.error('❌ Erro ao criar lead:', error);
        toast.error('Erro ao criar lead');
      }
    });
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Usuário não identificado');
      return;
    }

    if (!selectedLead || !selectedPosGraduacao || !selectedDate || !selectedTime || !linkReuniao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (conflitos.length > 0) {
      toast.error('Resolva os conflitos de agenda antes de agendar');
      return;
    }

    setLoading(true);
    try {
      const dataHora = `${selectedDate}T${selectedTime}:00.000-03:00`;
      const dataHoraFim = selectedEndTime 
        ? `${selectedDate}T${selectedEndTime}:00.000-03:00`
        : undefined;

      console.log('🚀 Criando agendamento do vendedor:', {
        lead_id: selectedLead,
        vendedor_id: user.id,
        pos_graduacao_interesse: selectedPosGraduacao,
        data_agendamento: dataHora,
        data_fim_agendamento: dataHoraFim,
        link_reuniao: linkReuniao,
        observacoes: observacoes || 'Reunião agendada pelo próprio vendedor'
      });

      // Usar método especial para vendedor agendar para si mesmo
      const agendamento = await AgendamentosService.criarAgendamentoVendedor({
        lead_id: selectedLead,
        vendedor_id: user.id,
        pos_graduacao_interesse: selectedPosGraduacao,
        data_agendamento: dataHora,
        data_fim_agendamento: dataHoraFim,
        link_reuniao: linkReuniao,
        observacoes: observacoes || 'Reunião agendada pelo próprio vendedor'
      });

      if (agendamento) {
        toast.success('Reunião agendada com sucesso!');
        onSuccess();
        onClose();
        
        // Limpar formulário
        setSelectedLead('');
        setSelectedPosGraduacao('');
        setSelectedDate('');
        setSelectedTime('');
        setSelectedEndTime('');
        setLinkReuniao('');
        setObservacoes('');
        setConflitos([]);
      }
    } catch (error: any) {
      console.error('❌ Erro ao criar agendamento:', error);
      toast.error(error.message || 'Erro ao agendar reunião');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedLead('');
    setSelectedPosGraduacao('');
    setSelectedDate('');
    setSelectedTime('');
    setSelectedEndTime('');
    setLinkReuniao('');
    setObservacoes('');
    setConflitos([]);
    setSearchTerm('');
    setShowNewLeadForm(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Gerar opções de horário
  const timeOptions = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  // Gerar datas disponíveis (próximos 30 dias)
  const dateOptions = [];
  for (let i = 0; i < 30; i++) {
    const date = addDays(new Date(), i);
    // Pular finais de semana
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dateOptions.push({
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, "dd 'de' MMMM (EEEE)", { locale: ptBR })
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Marcar Nova Reunião
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Lead */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Lead para Reunião</Label>
            
            {!showNewLeadForm ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select value={searchType} onValueChange={(value: 'nome' | 'email' | 'whatsapp') => setSearchType(value)}>
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
                    placeholder={`Buscar por ${searchType}... ${searchLoading ? '(buscando...)' : ''}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                    disabled={searchLoading}
                  />
                </div>

                <Select value={selectedLead} onValueChange={setSelectedLead}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      searchLoading ? "Buscando leads..." : 
                      filteredLeads.length === 0 ? "Nenhum lead encontrado" : 
                      `${filteredLeads.length} leads encontrados - Selecione um`
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLeads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{lead.nome}</span>
                          <span className="text-sm text-muted-foreground">
                            {lead.email} • {lead.whatsapp}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => setShowNewLeadForm(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Lead
                </Button>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Criar Novo Lead
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowNewLeadForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={newLeadData.nome}
                        onChange={(e) => setNewLeadData(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp *</Label>
                      <Input
                        id="whatsapp"
                        value={newLeadData.whatsapp}
                        onChange={(e) => setNewLeadData(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newLeadData.email}
                      onChange={(e) => setNewLeadData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="observacoes-lead">Observações</Label>
                    <Textarea
                      id="observacoes-lead"
                      value={newLeadData.observacoes}
                      onChange={(e) => setNewLeadData(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Informações adicionais sobre o lead"
                      rows={3}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleCreateNewLead}
                    disabled={isCreatingLead}
                    className="w-full"
                  >
                    {isCreatingLead ? 'Criando...' : 'Criar Lead'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pós-graduação */}
          <div>
            <Label htmlFor="pos-graduacao">Pós-graduação de Interesse *</Label>
            <Select value={selectedPosGraduacao} onValueChange={setSelectedPosGraduacao}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a pós-graduação" />
              </SelectTrigger>
              <SelectContent>
                {posGraduacoes.map((pos) => (
                  <SelectItem key={pos.id} value={pos.id}>
                    {pos.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="data">Data *</Label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a data" />
                </SelectTrigger>
                <SelectContent>
                  {dateOptions.map((date) => (
                    <SelectItem key={date.value} value={date.value}>
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hora-inicio">Horário Início *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Início" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hora-fim">Horário Fim</Label>
              <Select value={selectedEndTime} onValueChange={setSelectedEndTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Fim (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conflitos */}
          {conflitos.length > 0 && (
            <Card className="border-destructive bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Conflitos Detectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {conflitos.map((conflito, index) => (
                    <li key={index} className="text-sm text-destructive">
                      • {conflito}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Link da Reunião */}
          <div>
            <Label htmlFor="link">Link da Reunião *</Label>
            <Input
              id="link"
              value={linkReuniao}
              onChange={(e) => setLinkReuniao(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
            />
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre a reunião"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || conflitos.length > 0 || !selectedLead || !selectedPosGraduacao || !selectedDate || !selectedTime || !linkReuniao}
              className="flex-1"
            >
              {loading ? 'Agendando...' : 'Agendar Reunião'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarcarReuniaoVendedor;