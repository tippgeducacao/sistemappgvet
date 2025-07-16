import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, User, Clock, MapPin, Phone, CheckCircle, Mail } from 'lucide-react';
import { AgendamentosService } from '@/services/agendamentos/AgendamentosService';
import { useCreateLead } from '@/hooks/useCreateLead';
import { toast } from 'sonner';

const AgendamentosPage: React.FC = () => {
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [posGraduacoes, setPosGraduacoes] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSprintHubForm, setShowSprintHubForm] = useState(false);
  
  // Form fields
  const [searchType, setSearchType] = useState<'nome' | 'email' | 'whatsapp'>('nome');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState('');
  const [selectedPosGraduacao, setSelectedPosGraduacao] = useState('');
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
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

  const handleSubmit = async (): Promise<void> => {
    if (!selectedLead || !selectedPosGraduacao || !selectedVendedor || !selectedDate || !selectedTime) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Verificar disponibilidade do vendedor
    const vendedorSelecionado = vendedores.find(v => v.id === selectedVendedor);
    if (vendedorSelecionado) {
      // Verificar conflitos de agenda
      const temConflito = await AgendamentosService.verificarConflitosAgenda(
        selectedVendedor,
        `${selectedDate}T${selectedTime}:00`
      );

      if (temConflito) {
        toast.error(`O vendedor ${vendedorSelecionado.name} já possui uma reunião agendada neste horário. Escolha outro horário.`);
        return;
      }
    }

    try {
      const agendamento = await AgendamentosService.criarAgendamento({
        lead_id: selectedLead,
        vendedor_id: selectedVendedor,
        pos_graduacao_interesse: selectedPosGraduacao,
        data_agendamento: `${selectedDate}T${selectedTime}:00`,
        observacoes
      });

      if (agendamento) {
        // Atualizar status do lead para "reuniao_marcada"
        await AgendamentosService.atualizarStatusLead(selectedLead, 'reuniao_marcada');
        
        toast.success('Agendamento criado com sucesso!');
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
    setSelectedDate('');
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
              <div className="flex items-center justify-between">
                <Label htmlFor="lead">Buscar Lead *</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSprintHubForm(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  SprintHub
                </Button>
              </div>
              
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

              {searchTerm && (
                <Select value={selectedLead} onValueChange={setSelectedLead}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead dos resultados" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLeads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{lead.nome}</span>
                          {lead.email && <span className="text-xs text-muted-foreground">({lead.email})</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Vendedor Selection */}
            <div className="space-y-2">
              <Label htmlFor="vendedor">Vendedor Especializado *</Label>
              <Select 
                value={selectedVendedor} 
                onValueChange={setSelectedVendedor}
                disabled={!selectedPosGraduacao}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedPosGraduacao 
                      ? "Selecione primeiro a pós-graduação" 
                      : vendedores.length === 0 
                        ? "Nenhum vendedor disponível para esta pós-graduação" 
                        : "Selecione um vendedor"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {vendedores.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{vendedor.name}</span>
                        <span className="text-xs text-muted-foreground">({vendedor.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data e Horário */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
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