import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Clock, User, Phone, Mail, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AgendamentosService, type Agendamento, type PosGraduacao } from '@/services/agendamentos/AgendamentosService';

export default function AgendamentosPage() {
  const { toast } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [posGraduacoes, setPosGraduacoes] = useState<PosGraduacao[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedPosGraduacao, setSelectedPosGraduacao] = useState<string>('');
  const [selectedVendedor, setSelectedVendedor] = useState<string>('');
  const [dataAgendamento, setDataAgendamento] = useState<Date>();
  const [horarioAgendamento, setHorarioAgendamento] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

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

  const carregarDados = async () => {
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
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarVendedoresPorPosGraduacao = async () => {
    if (!selectedPosGraduacao) return;

    try {
      const vendedoresData = await AgendamentosService.buscarVendedoresPorPosGraduacao(selectedPosGraduacao);
      setVendedores(vendedoresData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar vendedores",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedLead || !selectedPosGraduacao || !selectedVendedor || !dataAgendamento || !horarioAgendamento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const dataCompleta = new Date(dataAgendamento);
      const [hora, minuto] = horarioAgendamento.split(':');
      dataCompleta.setHours(parseInt(hora), parseInt(minuto));

      const agendamento = await AgendamentosService.criarAgendamento({
        lead_id: selectedLead,
        vendedor_id: selectedVendedor,
        pos_graduacao_interesse: selectedPosGraduacao,
        data_agendamento: dataCompleta.toISOString(),
        observacoes
      });

      if (agendamento) {
        toast({
          title: "Sucesso",
          description: "Agendamento criado com sucesso!"
        });
        resetForm();
        setShowForm(false);
        carregarDados();
      } else {
        throw new Error('Erro ao criar agendamento');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar agendamento",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedLead('');
    setSelectedPosGraduacao('');
    setSelectedVendedor('');
    setDataAgendamento(undefined);
    setHorarioAgendamento('');
    setObservacoes('');
  };

  const getStatusBadge = (status: string) => {
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
            {/* Lead Selection */}
            <div className="space-y-2">
              <Label htmlFor="lead">Lead *</Label>
              <Select value={selectedLead} onValueChange={setSelectedLead}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataAgendamento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataAgendamento ? format(dataAgendamento, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dataAgendamento}
                      onSelect={setDataAgendamento}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario">Horário *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="horario"
                    type="time"
                    value={horarioAgendamento}
                    onChange={(e) => setHorarioAgendamento(e.target.value)}
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
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Criando...' : 'Criar Agendamento'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agendamentos List */}
      <div className="grid gap-4">
        {agendamentos.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                          {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
}