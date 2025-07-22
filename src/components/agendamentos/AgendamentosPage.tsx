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
import { Calendar, Plus, User, Clock, MapPin, Phone, CheckCircle, Mail, Eye, Grid, List, Edit, X } from 'lucide-react';
import { AgendamentosService } from '@/services/agendamentos/AgendamentosService';
import { useCreateLead } from '@/hooks/useCreateLead';
import { toast } from 'sonner';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [observacoes, setObservacoes] = useState('');
  
  // Edit form state
  const [editingAgendamento, setEditingAgendamento] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    data_agendamento: '',
    pos_graduacao_interesse: '',
    observacoes: ''
  });
  
  // Calendar state for main page
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  
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

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (selectedPosGraduacao) {
      carregarVendedoresPorPosGraduacao();
    } else {
      setVendedores([]);
      setSelectedVendedor('');
    }
  }, [selectedPosGraduacao]);

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
    
    // Encontrar vendedor com menor número de agendamentos e sem conflito de horário
    let vendedorSelecionado = null;
    let menorNumeroAgendamentos = Infinity;
    
    for (const vendedor of vendedoresList) {
      const numAgendamentos = agendamentosVendedores.get(vendedor.id);
      
      // Verificar conflito de agenda
      const temConflito = await AgendamentosService.verificarConflitosAgenda(
        vendedor.id,
        dataHora
      );
      
      if (!temConflito && numAgendamentos < menorNumeroAgendamentos) {
        menorNumeroAgendamentos = numAgendamentos;
        vendedorSelecionado = vendedor;
      }
    }
    
    return vendedorSelecionado;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!selectedLead || !selectedPosGraduacao || !selectedDateForm || !selectedTime) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (vendedores.length === 0) {
      toast.error('Nenhum vendedor especializado disponível para esta pós-graduação');
      return;
    }

    const dataHoraAgendamento = `${selectedDateForm}T${selectedTime}:00`;
    
    try {
      // Selecionar vendedor automaticamente
      const vendedorSelecionado = await selecionarVendedorAutomatico(vendedores, dataHoraAgendamento);
      
      if (!vendedorSelecionado) {
        toast.error('Nenhum vendedor disponível neste horário. Tente outro horário.');
        return;
      }

      const agendamento = await AgendamentosService.criarAgendamento({
        lead_id: selectedLead,
        vendedor_id: vendedorSelecionado.id,
        pos_graduacao_interesse: selectedPosGraduacao,
        data_agendamento: dataHoraAgendamento,
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
      toast.error('Erro ao criar agendamento');
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
    setEditFormData({
      data_agendamento: agendamento.data_agendamento.split('T')[0] + 'T' + agendamento.data_agendamento.split('T')[1].split('.')[0],
      pos_graduacao_interesse: agendamento.pos_graduacao_interesse,
      observacoes: agendamento.observacoes || ''
    });
    setShowEditForm(true);
  };

  const handleUpdateAgendamento = async () => {
    if (!editingAgendamento || !editFormData.data_agendamento || !editFormData.pos_graduacao_interesse) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const success = await AgendamentosService.atualizarAgendamentoSDR(
        editingAgendamento.id,
        editFormData
      );

      if (success) {
        toast.success('Agendamento atualizado com sucesso!');
        setShowEditForm(false);
        setEditingAgendamento(null);
        carregarDados();
      } else {
        toast.error('Erro ao atualizar agendamento');
      }
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
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
      realizado: { label: 'Realizado', variant: 'secondary' as const },
      cancelado: { label: 'Cancelado', variant: 'destructive' as const },
      reagendado: { label: 'Reagendado', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.agendado;
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
            onClick={() => setShowNewLeadForm(true)} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Lead
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
              <Label htmlFor="lead">Buscar Lead *</Label>
              
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
                ) : (
                  <div>
                    <p className="text-sm font-medium mb-2">Vendedores especializados disponíveis:</p>
                    <div className="space-y-2">
                      {vendedores.map((vendedor) => (
                        <div key={vendedor.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3" />
                            <span>{vendedor.name}</span>
                            <span className="text-xs text-muted-foreground">({vendedor.email})</span>
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
                                    <List className="h-4 w-4" />
                                    Lista
                                  </TabsTrigger>
                                  <TabsTrigger value="calendar" className="flex items-center gap-2">
                                    <Grid className="h-4 w-4" />
                                    Calendário
                                  </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="list" className="overflow-y-auto max-h-[60vh]">
                                  <div className="space-y-4">
                                    {agendamentosVendedor.length === 0 ? (
                                      <p className="text-center text-muted-foreground py-8">
                                        Nenhum agendamento encontrado
                                      </p>
                                    ) : (
                                      <div className="space-y-3">
                                        {agendamentosVendedor.map((agendamento) => (
                                          <div key={agendamento.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span className="font-medium">
                                                  {format(new Date(agendamento.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })}
                                                </span>
                                                <Clock className="h-4 w-4 ml-2" />
                                                <span>
                                                  {format(new Date(agendamento.data_agendamento), 'HH:mm', { locale: ptBR })}
                                                </span>
                                              </div>
                                              {getStatusBadge(agendamento.status)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              <p><strong>Lead:</strong> {agendamento.lead?.nome}</p>
                                              <p><strong>Pós-graduação:</strong> {agendamento.pos_graduacao_interesse}</p>
                                              {agendamento.observacoes && (
                                                <p><strong>Observações:</strong> {agendamento.observacoes}</p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="calendar" className="overflow-y-auto max-h-[60vh]">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <CalendarComponent
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        className="rounded-md border pointer-events-auto"
                                        modifiers={{
                                          hasAppointments: (date) => dateHasAppointments(date)
                                        }}
                                        modifiersStyles={{
                                          hasAppointments: {
                                            backgroundColor: 'hsl(var(--primary))',
                                            color: 'white',
                                            fontWeight: 'bold'
                                          }
                                        }}
                                      />
                                      <p className="text-xs text-muted-foreground mt-2 text-center">
                                        Datas com agendamentos estão destacadas
                                      </p>
                                    </div>
                                    
                                    <div>
                                      <h3 className="font-medium mb-3">
                                        {selectedDate ? 
                                          `Agendamentos - ${format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}` : 
                                          'Selecione uma data'
                                        }
                                      </h3>
                                      <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {agendamentosDoCalendario.length === 0 ? (
                                          <p className="text-muted-foreground text-sm">
                                            {selectedDate ? 'Nenhum agendamento nesta data' : 'Selecione uma data para ver os agendamentos'}
                                          </p>
                                        ) : (
                                          agendamentosDoCalendario.map((agendamento) => (
                                            <div key={agendamento.id} className="border rounded-lg p-3">
                                              <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1">
                                                  <Clock className="h-3 w-3" />
                                                  <span className="text-sm font-medium">
                                                    {format(new Date(agendamento.data_agendamento), 'HH:mm', { locale: ptBR })}
                                                  </span>
                                                </div>
                                                {getStatusBadge(agendamento.status)}
                                              </div>
                                              <p className="text-xs text-muted-foreground">
                                                <strong>Lead:</strong> {agendamento.lead?.nome}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                <strong>Pós-graduação:</strong> {agendamento.pos_graduacao_interesse}
                                              </p>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      O sistema selecionará automaticamente o vendedor com menor número de agendamentos
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Data e Horário */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={selectedDateForm}
                  onChange={(e) => setSelectedDateForm(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario">Horário *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="horario"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
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

      {/* Edit Agendamento Modal */}
      {showEditForm && editingAgendamento && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Editar Agendamento</CardTitle>
            <CardDescription>
              Atualize as informações do agendamento com {editingAgendamento.lead?.nome}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Data e Horário */}
            <div className="space-y-2">
              <Label>Data e Horário *</Label>
              <Input
                type="datetime-local"
                value={editFormData.data_agendamento}
                onChange={(e) => setEditFormData(prev => ({ ...prev, data_agendamento: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            {/* Pós-graduação Selection */}
            <div className="space-y-2">
              <Label>Pós-graduação de Interesse *</Label>
              <Select 
                value={editFormData.pos_graduacao_interesse} 
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, pos_graduacao_interesse: value }))}
              >
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

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Adicione observações sobre o agendamento..."
                value={editFormData.observacoes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> O vendedor não pode ser alterado após o agendamento ser criado.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateAgendamento}>
                Atualizar Agendamento
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

      {/* New Lead Form Modal */}
      {showNewLeadForm && (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Novo Lead</CardTitle>
            <CardDescription>
              Cadastre um novo lead no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                placeholder="Informações adicionais sobre o lead..."
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
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
              onClick={handleCreateNewLead}
              disabled={isCreatingLead}
            >
              {isCreatingLead ? 'Criando...' : 'Criar Lead'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Visualizations Tabs */}
      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <div className="grid gap-4">
            {agendamentos.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum agendamento encontrado</h3>
                    <p className="text-muted-foreground">Crie seu primeiro agendamento para começar</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              agendamentos.map((agendamento) => (
                <Card key={agendamento.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-semibold">{agendamento.lead?.nome}</p>
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
                            <p className="font-medium">{agendamento.pos_graduacao_interesse}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Vendedor</p>
                            <p className="font-medium">{agendamento.vendedor?.name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Data/Horário</p>
                            <p className="font-medium">
                              {new Date(agendamento.data_agendamento).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        {agendamento.observacoes && (
                          <div>
                            <p className="text-muted-foreground text-sm">Observações</p>
                            <p className="text-sm">{agendamento.observacoes}</p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col items-end gap-2">
                        {getStatusBadge(agendamento.status)}
                        
                        {agendamento.status === 'agendado' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAgendamento(agendamento)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelAgendamento(agendamento.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
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
                const dayAgendamentos = agendamentos.filter(ag => 
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
      </Tabs>
    </div>
  );
};

export default AgendamentosPage;