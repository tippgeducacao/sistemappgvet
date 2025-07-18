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
import { Calendar, Plus, User, Clock, MapPin, Phone, CheckCircle, Mail, Eye, Grid, List } from 'lucide-react';
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
  
  // SprintHub form fields
  const [sprintHubLead, setSprintHubLead] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    profissao: ''
  });

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

  // Filtrar leads baseado na busca
  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return false;
    if (lead.status === 'reuniao_marcada') return false;
    
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
  });

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
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
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

              {/* Lista de leads com scroll */}
              {searchTerm && filteredLeads.length > 0 && (
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {filteredLeads.slice(0, 5).map((lead) => (
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

      {/* Agendamentos List */}
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

                  <div className="ml-4">
                    {getStatusBadge(agendamento.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AgendamentosPage;