import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, User, Clock, MapPin, Phone, CheckCircle, Mail, Eye, Grid, List, Edit, X, FileSpreadsheet } from 'lucide-react';
import { AgendamentosService } from '@/services/agendamentos/AgendamentosService';
import { useCreateLead } from '@/hooks/useCreateLead';
import { toast } from 'sonner';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AgendamentosSDRPlanilha from '@/components/sdr/AgendamentosSDRPlanilha';
import AgendaGeral from './AgendaGeral';
import AgendamentoErrorDiagnosis from './AgendamentoErrorDiagnosis';
import { useOverdueAppointments } from '@/hooks/useOverdueAppointments';

const AgendamentosPage: React.FC = () => {
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [posGraduacoes, setPosGraduacoes] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSprintHubForm, setShowSprintHubForm] = useState(false);
  const [selectedVendedorAgenda, setSelectedVendedorAgenda] = useState<any>(null);
  const [agendamentosVendedor, setAgendamentosVendedor] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Form fields
  const [searchType, setSearchType] = useState<'nome' | 'email' | 'whatsapp'>('nome');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState('');
  const [selectedPosGraduacao, setSelectedPosGraduacao] = useState('');
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [selectedDateForm, setSelectedDateForm] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [linkReuniao, setLinkReuniao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Estado para indicar vendedor que será selecionado automaticamente
  const [vendedorIndicado, setVendedorIndicado] = useState<any>(null);
  
  // Edit link form state
  const [editingAgendamento, setEditingAgendamento] = useState<any>(null);
  const [showEditLinkForm, setShowEditLinkForm] = useState(false);
  const [editLinkData, setEditLinkData] = useState({
    link_reuniao: ''
  });
  
  // Edit form state (mantido para compatibilidade)
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    data: '',
    horario_inicio: '',
    horario_fim: '',
    pos_graduacao_interesse: '',
    observacoes: ''
  });
  
  // Calendar state for main page
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  
  // Agenda Geral state
  const [showAgendaGeral, setShowAgendaGeral] = useState(false);
  
  // Error diagnosis state
  const [lastError, setLastError] = useState<string | null>(null);
  const [showErrorDiagnosis, setShowErrorDiagnosis] = useState(false);
  
  // Force scheduling state
  const [showForceScheduleForm, setShowForceScheduleForm] = useState(false);
  const [forceScheduleData, setForceScheduleData] = useState({
    vendedor_id: '',
    lead_id: '',
    data_agendamento: '',
    data_fim_agendamento: '',
    pos_graduacao_interesse: '',
    link_reuniao: '',
    observacoes: 'Agendamento forçado fora do horário normal'
  });
  
  // SprintHub form fields
  const [sprintHubLead, setSprintHubLead] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    profissao: ''
  });

  // New lead form fields
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    observacoes: '',
    fonte_referencia: 'Agendamentos',
    status: 'novo'
  });


  const { mutate: createLead, isPending: isCreatingLead } = useCreateLead();

  // Hook para verificar agendamentos atrasados automaticamente
  useOverdueAppointments();

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (selectedPosGraduacao) {
      carregarVendedoresPorPosGraduacao();
    } else {
      setVendedores([]);
      setSelectedVendedor('');
      setVendedorIndicado(null);
    }
  }, [selectedPosGraduacao]);

  // Calcular vendedor indicado automaticamente quando dados mudam
  useEffect(() => {
    const calcularVendedorIndicado = async () => {
      console.log('🎯 Calculando vendedor indicado:', {
        vendedoresLength: vendedores.length,
        selectedDateForm,
        selectedTime,
        vendedores: vendedores.map(v => ({ id: v.id, name: v.name }))
      });
      
      if (vendedores.length > 0 && selectedDateForm && selectedTime) {
        const dataHora = `${selectedDateForm}T${selectedTime}:00.000-03:00`;
        console.log('🎯 DataHora formatada:', dataHora);
        const vendedor = await selecionarVendedorAutomatico(vendedores, dataHora);
        console.log('🎯 Vendedor selecionado:', vendedor);
        setVendedorIndicado(vendedor);
      } else {
        console.log('🎯 Condições não atendidas, limpando vendedor indicado');
        setVendedorIndicado(null);
      }
    };

    calcularVendedorIndicado();
  }, [vendedores, selectedDateForm, selectedTime, agendamentos]);

  const carregarDados = async (): Promise<void> => {
    setLoading(true);
    try {
      const [agendamentosData, posGraduacoesData, leadsData] = await Promise.all([
        AgendamentosService.buscarAgendamentos(),
        AgendamentosService.buscarPosGraduacoes(),
        AgendamentosService.buscarLeads()
      ]);

      setAgendamentos(agendamentosData);
      setPosGraduacoes(posGraduacoesData);
      setLeads(leadsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const carregarVendedoresPorPosGraduacao = async (): Promise<void> => {
    if (!selectedPosGraduacao) return;

    try {
      console.log('🔍 Carregando vendedores para pós-graduação:', selectedPosGraduacao);
      const vendedoresData = await AgendamentosService.buscarVendedoresPorPosGraduacao(selectedPosGraduacao);
      console.log('✅ Vendedores carregados:', vendedoresData);
      setVendedores(vendedoresData);
      
      if (vendedoresData.length === 0) {
        toast.error('Nenhum vendedor especializado encontrado para esta pós-graduação');
      }
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
      toast.error('Erro ao carregar vendedores');
    }
  };

  // Função para selecionar vendedor automaticamente
  const selecionarVendedorAutomatico = async (vendedoresList: any[], dataHora: string) => {
    console.log('🎯 selecionarVendedorAutomatico chamada:', { vendedoresList: vendedoresList.length, dataHora });
    
    // Buscar agendamentos existentes para contar distribuição
    const agendamentosVendedores = new Map();
    
    // Inicializar contadores para todos os vendedores
    vendedoresList.forEach(vendedor => {
      agendamentosVendedores.set(vendedor.id, 0);
    });
    
    // Contar agendamentos existentes
    agendamentos.forEach(agendamento => {
      if (agendamentosVendedores.has(agendamento.vendedor_id)) {
        agendamentosVendedores.set(
          agendamento.vendedor_id, 
          agendamentosVendedores.get(agendamento.vendedor_id) + 1
        );
      }
    });
    
    console.log('🎯 Contadores de agendamentos:', Array.from(agendamentosVendedores.entries()));
    
    // Encontrar vendedor com menor número de agendamentos e sem conflito de horário
    let vendedorSelecionado = null;
    let menorNumeroAgendamentos = Infinity;
    
    for (const vendedor of vendedoresList) {
      const numAgendamentos = agendamentosVendedores.get(vendedor.id);
      
      console.log(`🎯 Verificando vendedor ${vendedor.name} (${vendedor.id}):`, {
        numAgendamentos,
        menorNumeroAgendamentos
      });
      
      // Verificar conflito de agenda
      const temConflito = await AgendamentosService.verificarConflitosAgenda(
        vendedor.id,
        dataHora
      );
      
      console.log(`🎯 Conflito para ${vendedor.name}:`, temConflito);
      
      if (!temConflito && numAgendamentos < menorNumeroAgendamentos) {
        menorNumeroAgendamentos = numAgendamentos;
        vendedorSelecionado = vendedor;
        console.log(`🎯 Novo vendedor selecionado: ${vendedor.name}`);
      }
    }
    
    console.log('🎯 Vendedor final selecionado:', vendedorSelecionado);
    return vendedorSelecionado;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!selectedLead || !selectedPosGraduacao || !selectedDateForm || !selectedTime || !selectedEndTime || !linkReuniao.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar se horário final é após horário inicial
    if (selectedEndTime <= selectedTime) {
      toast.error('O horário final deve ser posterior ao horário inicial');
      return;
    }

    if (vendedores.length === 0) {
      toast.error('Nenhum vendedor especializado disponível para esta pós-graduação');
      return;
    }

    const dataHoraAgendamento = `${selectedDateForm}T${selectedTime}:00.000-03:00`; // Fuso horário brasileiro
    const dataHoraFim = `${selectedDateForm}T${selectedEndTime}:00.000-03:00`; // Fuso horário brasileiro
    
    console.log('🔍 DADOS PARA CRIAR AGENDAMENTO:', {
      selectedLead,
      selectedPosGraduacao,
      selectedDateForm,
      selectedTime,
      selectedEndTime,
      dataHoraAgendamento,
      dataHoraFim,
      observacoes
    });
    
    try {
      // Selecionar vendedor automaticamente
      const vendedorSelecionado = await selecionarVendedorAutomatico(vendedores, dataHoraAgendamento);
      
      console.log('👤 VENDEDOR SELECIONADO:', vendedorSelecionado);
      
      if (!vendedorSelecionado) {
        toast.error('Nenhum vendedor disponível neste horário. Todos os vendedores já possuem reuniões marcadas neste horário.');
        return;
      }

      // Verificar novamente se há conflito antes de criar o agendamento
      const temConflito = await AgendamentosService.verificarConflitosAgenda(
        vendedorSelecionado.id,
        dataHoraAgendamento
      );
      
      if (temConflito) {
        toast.error(`${vendedorSelecionado.name} já possui agendamento neste horário. Tente outro horário.`);
        return;
      }

      const agendamento = await AgendamentosService.criarAgendamento({
        lead_id: selectedLead,
        vendedor_id: vendedorSelecionado.id,
        pos_graduacao_interesse: selectedPosGraduacao,
        data_agendamento: dataHoraAgendamento,
        data_fim_agendamento: dataHoraFim,
        link_reuniao: linkReuniao,
        observacoes
      });

      if (agendamento) {
        // Atualizar status do lead para "reuniao_marcada"
        await AgendamentosService.atualizarStatusLead(selectedLead, 'reuniao_marcada');
        
        toast.success(`Agendamento criado com ${vendedorSelecionado.name}!`);
        resetForm();
        setShowForm(false);
        carregarDados();
      } else {
        throw new Error('Erro ao criar agendamento');
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      
      // Mostrar mensagem de erro mais específica e diagnóstico
      if (error instanceof Error) {
        setLastError(error.message);
        setShowErrorDiagnosis(true);
        toast.error(error.message);
      } else {
        toast.error('Erro ao criar agendamento');
      }
    }
  };


  const resetForm = () => {
    setSearchType('nome');
    setSearchTerm('');
    setSelectedLead('');
    setSelectedPosGraduacao('');
    setSelectedVendedor('');
    setSelectedDateForm('');
    setSelectedTime('');
    setSelectedEndTime('');
    setLinkReuniao('');
    setObservacoes('');
    setShowForm(false);
  };

  const resetSprintHubForm = () => {
    setSprintHubLead({
      nome: '',
      email: '',
      whatsapp: '',
      profissao: ''
    });
    setShowSprintHubForm(false);
  };

  // Função para iniciar o processo de forçar agendamento
  const handleForcarAgendamento = () => {
    // Preencher dados do agendamento forçado com os dados do formulário atual
    const dataHora = selectedDateForm && selectedTime ? `${selectedDateForm}T${selectedTime}:00` : '';
    const dataFim = selectedDateForm && selectedEndTime ? `${selectedDateForm}T${selectedEndTime}:00` : '';
    
    setForceScheduleData({
      vendedor_id: '',
      lead_id: selectedLead,
      data_agendamento: dataHora,
      data_fim_agendamento: dataFim,
      pos_graduacao_interesse: selectedPosGraduacao,
      link_reuniao: '',
      observacoes: `Agendamento forçado fora do horário normal. ${observacoes}`
    });
    
    setShowErrorDiagnosis(false);
    setShowForceScheduleForm(true);
  };

  // Função para criar agendamento forçado
  const handleCreateForceSchedule = async () => {
    if (!forceScheduleData.vendedor_id || !forceScheduleData.lead_id || !forceScheduleData.link_reuniao.trim()) {
      toast.error('Selecione um vendedor e preencha o link da reunião');
      return;
    }

    try {
      setLoading(true);
      
      const result = await AgendamentosService.criarAgendamento({
        lead_id: forceScheduleData.lead_id,
        vendedor_id: forceScheduleData.vendedor_id,
        data_agendamento: forceScheduleData.data_agendamento,
        data_fim_agendamento: forceScheduleData.data_fim_agendamento,
        pos_graduacao_interesse: forceScheduleData.pos_graduacao_interesse,
        link_reuniao: forceScheduleData.link_reuniao,
        observacoes: forceScheduleData.observacoes
      }, true);

      if (result) {
        toast.success('Agendamento forçado criado com sucesso!');
        setShowForceScheduleForm(false);
        resetForm();
        await carregarDados();
      } else {
        toast.error('Erro ao criar agendamento forçado');
      }
    } catch (error) {
      console.error('Erro ao criar agendamento forçado:', error);
      toast.error('Erro ao criar agendamento forçado');
    } finally {
      setLoading(false);
    }
  };

  // Extrair profissões únicas dos leads existentes
  const extractProfissao = (observacoes?: string) => {
    if (!observacoes) return null;
    const match = observacoes.match(/Profissão\/Área:\s*([^\n]+)/);
    return match ? match[1].trim() : null;
  };

  const profissoesUnicas = [...new Set(
    leads.map(l => extractProfissao(l.observacoes))
      .filter(Boolean)
  )];

  // Filtrar leads baseado na busca ou mostrar os 5 últimos por padrão
  const filteredLeads = leads
    .filter(lead => lead.status !== 'reuniao_marcada') // Excluir leads com reunião já marcada
    .filter(lead => {
      if (!searchTerm) {
        // Se não há termo de busca, mostrar todos os leads disponíveis
        return true;
      }
      
      // Se há termo de busca, filtrar conforme o tipo
      switch (searchType) {
        case 'nome':
          return lead.nome?.toLowerCase().includes(searchTerm.toLowerCase());
        case 'email':
          return lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
        case 'whatsapp':
          return lead.whatsapp?.includes(searchTerm);
        default:
          return false;
      }
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5); // Limitar a 5 leads

  const createLeadMutation = useCreateLead();

  const handleCreateSprintHubLead = async () => {
    try {
      if (!sprintHubLead.nome || !sprintHubLead.email || !sprintHubLead.whatsapp || !sprintHubLead.profissao) {
        toast.error('Todos os campos são obrigatórios');
        return;
      }

      const observacoesFormatadas = `Profissão/Área: ${sprintHubLead.profissao}`;
      
      const novoLead = {
        nome: sprintHubLead.nome,
        email: sprintHubLead.email,
        whatsapp: sprintHubLead.whatsapp,
        observacoes: observacoesFormatadas,
        fonte_referencia: 'SprintHub',
        status: 'novo'
      };

      const leadCriado = await createLeadMutation.mutateAsync(novoLead);
      
      // Atualizar lista de leads
      await carregarDados();
      
      // Selecionar o lead criado automaticamente
      setSelectedLead(leadCriado.id);
      
      resetSprintHubForm();
    } catch (error) {
      console.error('Erro ao criar lead:', error);
    }
  };

  const verAgendaVendedor = async (vendedor: any) => {
    try {
      setSelectedVendedorAgenda(vendedor);
      setViewMode('list');
      setSelectedDate(new Date());
      // Filtrar agendamentos do vendedor específico
      const agendamentosDoVendedor = agendamentos.filter(agendamento => 
        agendamento.vendedor_id === vendedor.id
      );
      setAgendamentosVendedor(agendamentosDoVendedor);
    } catch (error) {
      console.error('Erro ao carregar agenda do vendedor:', error);
      toast.error('Erro ao carregar agenda do vendedor');
    }
  };

  // Filtrar agendamentos por data selecionada no calendário
  const agendamentosDoCalendario = agendamentosVendedor.filter(agendamento => 
    selectedDate && isSameDay(parseISO(agendamento.data_agendamento), selectedDate)
  );

  // Verificar se uma data tem agendamentos
  const dateHasAppointments = (date: Date) => {
    return agendamentosVendedor.some(agendamento => 
      isSameDay(parseISO(agendamento.data_agendamento), date)
    );
  };

  const handleEditAgendamento = (agendamento: any) => {
    setEditingAgendamento(agendamento);
    setEditLinkData({
      link_reuniao: agendamento.link_reuniao || ''
    });
    setShowEditLinkForm(true);
  };

  const handleUpdateLink = async () => {
    if (!editingAgendamento || !editLinkData.link_reuniao.trim()) {
      toast.error('O link da reunião é obrigatório');
      return;
    }

    try {
      const success = await AgendamentosService.atualizarLinkReuniao(
        editingAgendamento.id,
        editLinkData.link_reuniao
      );

      if (success) {
        toast.success('Link da reunião atualizado com sucesso!');
        setShowEditLinkForm(false);
        setEditingAgendamento(null);
        carregarDados();
      } else {
        toast.error('Erro ao atualizar link da reunião');
      }
    } catch (error) {
      console.error('Erro ao atualizar link:', error);
      toast.error('Erro ao atualizar link da reunião');
    }
  };


  const handleCancelAgendamento = async (agendamentoId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    try {
      const success = await AgendamentosService.cancelarAgendamento(agendamentoId);

      if (success) {
        toast.success('Agendamento cancelado com sucesso!');
        carregarDados();
      } else {
        toast.error('Erro ao cancelar agendamento');
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error('Erro ao cancelar agendamento');
    }
  };

  const handleCreateNewLead = async () => {
    try {
      if (!newLeadData.nome || !newLeadData.email || !newLeadData.whatsapp) {
        toast.error('Nome, email e WhatsApp são obrigatórios');
        return;
      }

      createLead(newLeadData, {
        onSuccess: (leadCriado) => {
          toast.success('Lead criado com sucesso!');
          setNewLeadData({
            nome: '',
            email: '',
            whatsapp: '',
            observacoes: '',
            fonte_referencia: 'Agendamentos',
            status: 'novo'
          });
          setShowNewLeadForm(false);
          // Selecionar automaticamente o lead criado
          setSelectedLead(leadCriado.id);
          // Atualizar a lista de leads
          carregarDados();
        },
        onError: (error) => {
          console.error('Erro ao criar lead:', error);
          toast.error('Erro ao criar lead');
        }
      });
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
    }
  };

  const getStatusBadge = (status: string): JSX.Element => {
    const statusConfig = {
      agendado: { label: 'Agendado', variant: 'default' as const },
      atrasado: { label: 'Atrasado', variant: 'destructive' as const },
      realizado: { label: 'Realizado', variant: 'secondary' as const },
      cancelado: { label: 'Cancelado', variant: 'destructive' as const },
      reagendado: { label: 'Reagendado', variant: 'outline' as const }
    };

    // Validação e padronização de status
    const normalizedStatus = status?.toLowerCase().trim();
    
    // Se receber "pendente" ou status inválido, corrigir para "agendado"
    if (!normalizedStatus || normalizedStatus === 'pendente' || !statusConfig[normalizedStatus as keyof typeof statusConfig]) {
      console.warn(`Status inválido detectado: "${status}". Corrigindo para "agendado".`);
      return <Badge variant="default">Agendado</Badge>;
    }

    const config = statusConfig[normalizedStatus as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie reuniões entre SDRs, leads e vendedores</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAgendaGeral(true)} 
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Agenda Geral
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
            <CardDescription>
              Agende uma reunião entre um lead e um vendedor especializado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lead Search */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="lead">Buscar Lead *</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNewLeadForm(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Novo Lead
                </Button>
              </div>
              
              {/* Formulário de novo lead */}
              {showNewLeadForm && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Criar Novo Lead</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowNewLeadForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="newLeadNome">Nome *</Label>
                      <Input
                        id="newLeadNome"
                        value={newLeadData.nome}
                        onChange={(e) => setNewLeadData(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newLeadEmail">Email *</Label>
                      <Input
                        id="newLeadEmail"
                        type="email"
                        value={newLeadData.email}
                        onChange={(e) => setNewLeadData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newLeadWhatsapp">WhatsApp *</Label>
                      <Input
                        id="newLeadWhatsapp"
                        value={newLeadData.whatsapp}
                        onChange={(e) => setNewLeadData(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newLeadObservacoes">Observações</Label>
                      <Textarea
                        id="newLeadObservacoes"
                        value={newLeadData.observacoes}
                        onChange={(e) => setNewLeadData(prev => ({ ...prev, observacoes: e.target.value }))}
                        placeholder="Informações adicionais..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowNewLeadForm(false);
                        setNewLeadData({
                          nome: '',
                          email: '',
                          whatsapp: '',
                          observacoes: '',
                          fonte_referencia: 'Agendamentos',
                          status: 'novo'
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleCreateNewLead}
                      disabled={isCreatingLead}
                    >
                      {isCreatingLead ? 'Criando...' : 'Criar Lead'}
                    </Button>
                  </div>
                </div>
              )}
              
              {!showNewLeadForm && (
                <>
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
                      placeholder={`Buscar por ${searchType}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  {/* Lista de leads com scroll - sempre visível se há leads */}
                  {filteredLeads.length > 0 && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
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
                </>
              )}
            </div>

            {/* Pós-graduação Selection */}
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

            {/* Vendedor Selection - Sistema distribui automaticamente */}
            <div className="space-y-2">
              <Label>Vendedor Especializado</Label>
              <div className="p-3 bg-muted/50 rounded-lg border">
                {!selectedPosGraduacao ? (
                  <p className="text-sm text-muted-foreground">Selecione primeiro a pós-graduação</p>
                ) : vendedores.length === 0 ? (
                  <p className="text-sm text-destructive">Nenhum vendedor disponível para esta pós-graduação</p>
                ) : !selectedDateForm || !selectedTime ? (
                  <div>
                    <p className="text-sm font-medium mb-2">Vendedores especializados disponíveis:</p>
                    <p className="text-sm text-muted-foreground mb-2">Selecione data e horário para ver quem será selecionado automaticamente</p>
                    <div className="space-y-2">
                      {vendedores.map((vendedor) => {
                        const contadorAgendamentos = agendamentos.filter(
                          ag => ag.vendedor_id === vendedor.id && ['agendado', 'atrasado'].includes(ag.status)
                        ).length;
                        
                        return (
                        <div key={vendedor.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3" />
                            <span>{vendedor.name}</span>
                            <span className="text-xs text-muted-foreground">({vendedor.email})</span>
                            <Badge variant={contadorAgendamentos === 0 ? "outline" : "secondary"} className="text-xs">
                              {contadorAgendamentos} agendamento{contadorAgendamentos !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => verAgendaVendedor(vendedor)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver Agenda
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <User className="h-5 w-5" />
                                  Agenda de {vendedor.name}
                                </DialogTitle>
                              </DialogHeader>
                              
                              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}>
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="list" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Lista
                                  </TabsTrigger>
                                  <TabsTrigger value="calendar" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Calendário
                                  </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="list" className="mt-4 max-h-[50vh] overflow-y-auto">
                                  <div className="space-y-2">
                                    {agendamentosVendedor.length === 0 ? (
                                      <p className="text-center text-muted-foreground py-4">
                                        Nenhum agendamento encontrado para este vendedor
                                      </p>
                                    ) : (
                                      agendamentosVendedor.map((agendamento) => (
                                        <div key={agendamento.id} className="p-3 border rounded-lg">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Calendar className="h-4 w-4 text-muted-foreground" />
                                              <span className="font-medium">
                                                {new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')}
                                              </span>
                                              <span className="text-muted-foreground">
                                                às {new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', { 
                                                  hour: '2-digit', 
                                                  minute: '2-digit' 
                                                })}
                                              </span>
                                            </div>
                                            <Badge variant={
                                              agendamento.status === 'agendado' ? 'default' :
                                              agendamento.status === 'realizado' ? 'secondary' :
                                              agendamento.status === 'cancelado' ? 'destructive' :
                                              agendamento.status === 'atrasado' ? 'destructive' : 'outline'
                                            }>
                                              {agendamento.status}
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            {agendamento.pos_graduacao_interesse}
                                          </p>
                                          {agendamento.observacoes && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                              <strong>Observações:</strong> {agendamento.observacoes}
                                            </p>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="calendar" className="mt-4">
                                  <div className="space-y-4">
                                    <CalendarComponent
                                      mode="single"
                                      selected={selectedDate}
                                      onSelect={setSelectedDate}
                                      className="rounded-md border w-full"
                                      modifiers={{
                                        agendado: agendamentosVendedor.map(a => new Date(a.data_agendamento))
                                      }}
                                      modifiersStyles={{
                                        agendado: {
                                          backgroundColor: 'hsl(var(--primary))',
                                          color: 'white'
                                        }
                                      }}
                                    />
                                    
                                    {selectedDate && (
                                      <div className="space-y-2">
                                        <h4 className="font-medium">
                                          Agendamentos para {selectedDate.toLocaleDateString('pt-BR')}:
                                        </h4>
                                        {agendamentosVendedor
                                          .filter(a => {
                                            const agendamentoDate = new Date(a.data_agendamento);
                                            return agendamentoDate.toDateString() === selectedDate.toDateString();
                                          })
                                          .map((agendamento) => (
                                            <div key={agendamento.id} className="p-2 border rounded">
                                              <div className="flex items-center justify-between">
                                                <span className="text-sm">
                                                  {new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                  })} - {agendamento.pos_graduacao_interesse}
                                                </span>
                                                <Badge variant={
                                                  agendamento.status === 'agendado' ? 'default' :
                                                  agendamento.status === 'realizado' ? 'secondary' :
                                                  'destructive'
                                                }>
                                                  {agendamento.status}
                                                </Badge>
                                              </div>
                                            </div>
                                          ))
                                        }
                                        {agendamentosVendedor.filter(a => {
                                          const agendamentoDate = new Date(a.data_agendamento);
                                          return agendamentoDate.toDateString() === selectedDate.toDateString();
                                        }).length === 0 && (
                                          <p className="text-sm text-muted-foreground">
                                            Nenhum agendamento para esta data
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                     <div className="flex items-center justify-between mb-2">
                       <p className="text-sm font-medium">Vendedores especializados disponíveis:</p>
                       {vendedorIndicado ? (
                         <div className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                           <span>🎯</span>
                           <span>Será agendado com: {vendedorIndicado.name}</span>
                         </div>
                       ) : selectedDateForm && selectedTime ? (
                         <div className="text-xs text-muted-foreground">
                           Calculando vendedor disponível...
                         </div>
                       ) : (
                         <div className="text-xs text-muted-foreground">
                           Selecione data e horário para ver indicação
                         </div>
                       )}
                     </div>
                    <div className="space-y-2">
                      {vendedores.map((vendedor) => {
                        // Contar agendamentos ativos e atrasados do vendedor
                        const contadorAgendamentos = agendamentos.filter(
                          ag => ag.vendedor_id === vendedor.id && ['agendado', 'atrasado'].includes(ag.status)
                        ).length;
                        
                        // Quando data e horário estão preenchidos, destacar o vendedor com menos agendamentos
                        let isIndicado = false;
                        if (selectedDateForm && selectedTime && vendedores.length > 0) {
                          // Encontrar o menor número de agendamentos
                          const agendamentosPorVendedor = vendedores.map(v => ({
                            id: v.id,
                            count: agendamentos.filter(ag => ag.vendedor_id === v.id && ['agendado', 'atrasado'].includes(ag.status)).length
                          }));
                          
                          const menorCount = Math.min(...agendamentosPorVendedor.map(v => v.count));
                          
                          // Se este vendedor tem o menor número de agendamentos, destacar
                          isIndicado = contadorAgendamentos === menorCount;
                        }
                        
                        console.log(`Vendedor ${vendedor.name}: ${contadorAgendamentos} agendamentos, indicado: ${isIndicado}`);
                        
                        return (
                        <div 
                          key={vendedor.id} 
                          className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-200 ${
                            isIndicado ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20' : 'border-border'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm">
                            {isIndicado && <span className="text-primary text-xl animate-pulse">🎯</span>}
                            <User className="h-3 w-3" />
                            <span className={isIndicado ? 'font-bold text-primary' : ''}>{vendedor.name}</span>
                            <span className="text-xs text-muted-foreground">({vendedor.email})</span>
                            <Badge variant={contadorAgendamentos === 0 ? "outline" : "secondary"} className="text-xs">
                              {contadorAgendamentos} agendamento{contadorAgendamentos !== 1 ? 's' : ''}
                            </Badge>
                            {isIndicado && (
                              <Badge variant="default" className="text-xs bg-primary font-semibold animate-pulse">
                                SELECIONADO
                              </Badge>
                            )}
                         </div>
                       </div>
                       );
                     })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      O sistema selecionará automaticamente o vendedor com menor número de agendamentos
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Data e Horário */}
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
                          // Automaticamente definir horário final com 1 hora de diferença
                          if (e.target.value) {
                            const [hours, minutes] = e.target.value.split(':');
                            const startTime = new Date();
                            startTime.setHours(parseInt(hours), parseInt(minutes));
                            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Adicionar 1 hora
                            const endTimeString = endTime.toTimeString().slice(0, 5);
                            console.log('🎯 Definindo horário final:', endTimeString);
                            setSelectedEndTime(endTimeString);
                          }
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

            {/* Vendedor Selecionado Automaticamente */}
            {selectedDateForm && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-medium">🎯 Vendedor Selecionado:</span>
                  {(() => {
                    try {
                      console.log('🔍 Debug vendedor selecionado interface:', {
                        vendedores: vendedores?.length,
                        selectedDateForm,
                        selectedTime,
                        agendamentos: agendamentos?.length
                      });

                      // Verificar se temos dados necessários
                      if (!vendedores || vendedores.length === 0 || !selectedDateForm || !selectedTime) {
                        console.log('⚠️ Dados insuficientes para seleção');
                        return <span className="text-gray-500">Aguardando seleção de data e horário</span>;
                      }

                      // Usar a mesma lógica da função selecionarVendedorAutomatico
                      const dataHoraForm = `${selectedDateForm}T${selectedTime}:00.000-03:00`;
                      
                      // Buscar agendamentos existentes para contar distribuição
                      const agendamentosVendedores = new Map();
                      
                      // Inicializar contadores para todos os vendedores
                      vendedores.forEach(vendedor => {
                        agendamentosVendedores.set(vendedor.id, 0);
                      });
                      
                      // Contar agendamentos ativos e atrasados
                      agendamentos.forEach(agendamento => {
                        if (['agendado', 'atrasado'].includes(agendamento.status)) {
                          const currentCount = agendamentosVendedores.get(agendamento.vendedor_id) || 0;
                          agendamentosVendedores.set(agendamento.vendedor_id, currentCount + 1);
                        }
                      });
                      
                      console.log('🔍 Contadores interface:', Array.from(agendamentosVendedores.entries()));
                      
                      // Encontrar vendedor com menor número de agendamentos e verificar conflitos
                      let vendedorSelecionado = null;
                      let menorNumeroAgendamentos = Infinity;
                      
                      for (const vendedor of vendedores) {
                        const numAgendamentos = agendamentosVendedores.get(vendedor.id) || 0;
                        
                        // Verificar conflito com mais precisão
                        const temConflito = agendamentos.some(ag => {
                          if (ag.vendedor_id !== vendedor.id || !['agendado', 'atrasado'].includes(ag.status)) return false;
                          
                          try {
                            const agendamentoInicio = new Date(ag.data_agendamento);
                            const agendamentoFim = new Date(ag.data_fim_agendamento || ag.data_agendamento);
                            const novoAgendamento = new Date(dataHoraForm);
                            const novoAgendamentoFim = selectedEndTime ? new Date(`${selectedDateForm}T${selectedEndTime}:00.000-03:00`) : novoAgendamento;
                            
                            console.log(`🔍 Verificando conflito ${vendedor.name}:`, {
                              agendamentoExistente: `${agendamentoInicio.toLocaleString()} - ${agendamentoFim.toLocaleString()}`,
                              novoAgendamento: `${novoAgendamento.toLocaleString()} - ${novoAgendamentoFim.toLocaleString()}`,
                              temSobreposicao: (novoAgendamento < agendamentoFim && novoAgendamentoFim > agendamentoInicio)
                            });
                            
                            // Verificar se há sobreposição de horários - condição mais rigorosa
                            return (novoAgendamento < agendamentoFim && novoAgendamentoFim > agendamentoInicio);
                          } catch (e) {
                            console.error('❌ Erro ao verificar conflito:', e);
                            return false;
                          }
                        });
                        
                        console.log(`🔍 Vendedor ${vendedor.name}: ${numAgendamentos} agendamentos, conflito: ${temConflito}`);
                        
                        if (!temConflito && numAgendamentos < menorNumeroAgendamentos) {
                          menorNumeroAgendamentos = numAgendamentos;
                          vendedorSelecionado = vendedor;
                        }
                      }
                      
                      console.log('🎯 Vendedor interface selecionado:', vendedorSelecionado);
                      
                      if (!vendedorSelecionado) {
                        return <span className="text-red-500">Nenhum vendedor disponível neste horário</span>;
                      }
                      
                      return (
                        <span className="text-blue-800 font-semibold">
                          {vendedorSelecionado.name} ({menorNumeroAgendamentos} agendamentos)
                        </span>
                      );
                    } catch (error) {
                      console.error('❌ Erro crítico na seleção do vendedor:', error);
                      return <span className="text-red-500">Erro na seleção do vendedor</span>;
                    }
                  })()}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  * Sistema selecionou automaticamente o vendedor com menor número de agendamentos
                </p>
              </div>
            )}

            {/* Link da Reunião */}
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
                Insira o link da reunião online (Zoom, Google Meet, Teams, etc.)
              </p>
            </div>


            {/* Observações */}
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

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                Criar Agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Link Modal */}
      {showEditLinkForm && editingAgendamento && (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Editar Link da Reunião</CardTitle>
            <CardDescription>
              Atualize o link da reunião com {editingAgendamento.lead?.nome}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editLinkReuniao">Link da Reunião *</Label>
              <Input
                id="editLinkReuniao"
                type="url"
                placeholder="https://zoom.us/j/123456789 ou https://meet.google.com/abc-def-ghi"
                value={editLinkData.link_reuniao}
                onChange={(e) => setEditLinkData({ link_reuniao: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Insira o link da reunião online (Zoom, Google Meet, Teams, etc.)
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Data:</strong> {format(new Date(editingAgendamento.data_agendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Vendedor:</strong> {editingAgendamento.vendedor?.name}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditLinkForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateLink}>
                Atualizar Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SprintHub Lead Form Modal */}
      {showSprintHubForm && (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Novo Lead - SprintHub</CardTitle>
            <CardDescription>
              Cadastre um novo lead rapidamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={sprintHubLead.nome}
                onChange={(e) => setSprintHubLead(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={sprintHubLead.email}
                onChange={(e) => setSprintHubLead(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                value={sprintHubLead.whatsapp}
                onChange={(e) => setSprintHubLead(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profissao">Profissão *</Label>
              <Select 
                value={sprintHubLead.profissao} 
                onValueChange={(value) => setSprintHubLead(prev => ({ ...prev, profissao: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a profissão" />
                </SelectTrigger>
                <SelectContent>
                  {profissoesUnicas.map((profissao) => (
                    <SelectItem key={profissao} value={profissao}>
                      {profissao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetSprintHubForm}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSprintHubLead}>
              Criar Lead
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Visualizations Tabs */}
      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="cancelados" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Cancelados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <AgendamentosSDRPlanilha 
            agendamentos={agendamentos.filter(ag => ag.status !== 'cancelado')}
            onRecarregarDados={carregarDados}
          />
        </TabsContent>

        <TabsContent value="calendario">
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium mb-4">
              <div>Dom</div>
              <div>Seg</div>
              <div>Ter</div>
              <div>Qua</div>
              <div>Qui</div>
              <div>Sex</div>
              <div>Sáb</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }, (_, i) => {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const startOfCalendar = new Date(startOfMonth);
                startOfCalendar.setDate(startOfCalendar.getDate() - startOfMonth.getDay());
                
                const currentDate = new Date(startOfCalendar);
                currentDate.setDate(currentDate.getDate() + i);
                
                const isCurrentMonth = currentDate.getMonth() === now.getMonth();
                const isToday = currentDate.toDateString() === new Date().toDateString();
                const dayAgendamentos = agendamentos
                  .filter(ag => ag.status !== 'cancelado') // Filtrar cancelados do calendário
                  .filter(ag => 
                    new Date(ag.data_agendamento).toDateString() === currentDate.toDateString()
                  );
                
                return (
                  <div
                    key={i}
                    className={`
                      min-h-[80px] p-1 border rounded cursor-pointer transition-colors
                      ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                      ${isToday ? 'bg-primary/10 border-primary' : 'border-border'}
                      ${dayAgendamentos.length > 0 ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                      hover:bg-muted/50
                    `}
                    onClick={() => {
                      if (dayAgendamentos.length > 0) {
                        setSelectedCalendarDate(currentDate);
                      }
                    }}
                  >
                    <div className={`text-sm ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {currentDate.getDate()}
                    </div>
                    {dayAgendamentos.length > 0 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {dayAgendamentos.length} reuniã{dayAgendamentos.length === 1 ? 'o' : 'ões'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {selectedCalendarDate && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Agendamentos para {selectedCalendarDate.toLocaleDateString('pt-BR')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {agendamentos
                    .filter(ag => ag.status !== 'cancelado') // Filtrar cancelados
                    .filter(ag => new Date(ag.data_agendamento).toDateString() === selectedCalendarDate.toDateString())
                    .map((agendamento) => (
                      <div key={agendamento.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-medium">{agendamento.lead?.nome}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-sm">{agendamento.pos_graduacao_interesse}</p>
                            <p className="text-sm text-muted-foreground">
                              Vendedor: {agendamento.vendedor?.name}
                            </p>
                          </div>
                          {getStatusBadge(agendamento.status)}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelados">
          <div className="grid gap-4">
            {agendamentos.filter(ag => ag.status === 'cancelado').length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <X className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum agendamento cancelado</h3>
                    <p className="text-muted-foreground">Todos os agendamentos estão ativos</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              agendamentos
                .filter(ag => ag.status === 'cancelado') // Apenas cancelados
                .map((agendamento) => (
                  <Card key={agendamento.id}>
                    <CardContent className="p-6 bg-destructive/5 border-destructive/20 dark:bg-destructive/10">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-destructive" />
                            <div>
                              <p className="font-semibold text-foreground">{agendamento.lead?.nome}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {agendamento.lead?.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {agendamento.lead.email}
                                  </span>
                                )}
                                {agendamento.lead?.whatsapp && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {agendamento.lead.whatsapp}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Pós-graduação</p>
                              <p className="font-medium text-foreground">{agendamento.pos_graduacao_interesse}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Vendedor</p>
                              <p className="font-medium text-foreground">{agendamento.vendedor?.name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Data/Horário</p>
                              <p className="font-medium text-foreground">
                                {format(new Date(agendamento.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })} {' '}
                                {format(new Date(agendamento.data_agendamento), 'HH:mm', { locale: ptBR })}
                                {agendamento.data_fim_agendamento && (
                                  <>
                                    {' - '}
                                    {format(new Date(agendamento.data_fim_agendamento), 'HH:mm', { locale: ptBR })}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {agendamento.observacoes && (
                            <div>
                              <p className="text-muted-foreground text-sm">Observações</p>
                              <p className="text-sm text-foreground">{agendamento.observacoes}</p>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Cancelado em: {format(new Date(agendamento.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col items-end gap-2">
                          {getStatusBadge(agendamento.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Diagnosis Modal */}
      {showErrorDiagnosis && lastError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <AgendamentoErrorDiagnosis 
              error={lastError}
              vendedor={vendedores.find(v => v.id === selectedVendedor)}
              dataAgendamento={selectedDateForm && selectedTime ? `${selectedDateForm}T${selectedTime}:00` : undefined}
              onForcarAgendamento={handleForcarAgendamento}
            />
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowErrorDiagnosis(false);
                  setLastError(null);
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Forçar Agendamento */}
      {showForceScheduleForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4 text-orange-600 dark:text-orange-400">
              Forçar Agendamento
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Este agendamento será criado fora do horário normal de trabalho. 
              Selecione manualmente o vendedor especializado.
            </p>
            
            <div className="space-y-4">
              {/* Seleção de Vendedor */}
              <div>
                <label className="text-sm font-medium dark:text-foreground">Vendedor Especializado *</label>
                <select
                  value={forceScheduleData.vendedor_id}
                  onChange={(e) => setForceScheduleData(prev => ({ ...prev, vendedor_id: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md bg-background dark:bg-background dark:border-border dark:text-foreground"
                >
                  <option value="">Selecione um vendedor</option>
                  {vendedores
                    .filter(v => {
                      // Filtrar vendedores que vendem a pós-graduação selecionada
                      const posGradIds = Array.isArray(v.pos_graduacoes) ? v.pos_graduacoes : [];
                      const posGradSelecionada = posGraduacoes.find(p => p.nome === selectedPosGraduacao);
                      return posGradSelecionada && posGradIds.includes(posGradSelecionada.id);
                    })
                    .map(vendedor => (
                      <option key={vendedor.id} value={vendedor.id}>
                        {vendedor.name} ({vendedor.email})
                      </option>
                    ))
                  }
                 </select>
               </div>
               
               {/* Link da Reunião */}
               <div>
                 <label className="text-sm font-medium dark:text-foreground">Link da Reunião *</label>
                 <input
                   type="text"
                   value={forceScheduleData.link_reuniao}
                   onChange={(e) => setForceScheduleData(prev => ({ ...prev, link_reuniao: e.target.value }))}
                   placeholder="https://meet.google.com/..."
                   className="w-full mt-1 p-2 border rounded-md bg-background dark:bg-background dark:border-border dark:text-foreground"
                 />
               </div>
               
               {/* Informações do Agendamento */}
               <div className="bg-muted/50 dark:bg-muted/30 p-3 rounded-lg text-sm border dark:border-border">
                 <div className="dark:text-foreground"><strong>Pós-graduação:</strong> {selectedPosGraduacao}</div>
                 <div className="dark:text-foreground"><strong>Data/Hora:</strong> {forceScheduleData.data_agendamento ? new Date(forceScheduleData.data_agendamento).toLocaleString('pt-BR') : 'Não definido'}</div>
                 <div className="dark:text-foreground"><strong>Lead:</strong> {leads.find(l => l.id === selectedLead)?.nome}</div>
               </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowForceScheduleForm(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateForceSchedule}
                className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white"
                disabled={!forceScheduleData.vendedor_id || !forceScheduleData.link_reuniao.trim()}
              >
                Criar Agendamento Forçado
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Agenda Geral Modal */}
      <AgendaGeral 
        isOpen={showAgendaGeral} 
        onClose={() => setShowAgendaGeral(false)} 
      />
    </div>
  );
};

export default AgendamentosPage;