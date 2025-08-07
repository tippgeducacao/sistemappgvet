import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Clock, User, Calendar, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AgendamentosService } from '@/services/agendamentos/AgendamentosService';
import { useCreateLead } from '@/hooks/useCreateLead';
import { toast } from 'sonner';

interface ForcarNovoAgendamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leads: any[];
  posGraduacoes: any[];
}

const ForcarNovoAgendamento: React.FC<ForcarNovoAgendamentoProps> = ({
  isOpen,
  onClose,
  onSuccess,
  leads,
  posGraduacoes
}) => {
  const [loading, setLoading] = useState(false);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [conflitos, setConflitos] = useState<string[]>([]);
  
  // Lead search state
  const [searchType, setSearchType] = useState<'nome' | 'email' | 'whatsapp'>('nome');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtered leads based on search
  const filteredLeads = searchTerm 
    ? leads.filter(lead => {
        const searchValue = lead[searchType]?.toLowerCase() || '';
        return searchValue.includes(searchTerm.toLowerCase());
      })
    : leads;
  
  // New lead form state
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    observacoes: '',
    fonte_referencia: 'Agendamentos Forçados',
    status: 'novo'
  });
  
  // Form fields
  const [selectedLead, setSelectedLead] = useState('');
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [selectedPosGraduacao, setSelectedPosGraduacao] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [linkReuniao, setLinkReuniao] = useState('');
  const [observacoes, setObservacoes] = useState('Agendamento forçado - ignora restrições de pós-graduação');

  const { mutate: createLead, isPending: isCreatingLead } = useCreateLead();

  // Carregar todos os vendedores ativos
  useEffect(() => {
    const carregarVendedores = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, pos_graduacoes')
          .eq('user_type', 'vendedor')
          .eq('ativo', true)
          .order('name');

        if (error) throw error;
        setVendedores(data || []);
      } catch (error) {
        console.error('Erro ao carregar vendedores:', error);
        toast.error('Erro ao carregar vendedores');
      }
    };

    if (isOpen) {
      carregarVendedores();
    }
  }, [isOpen]);

  // Verificar conflitos quando vendedor, data ou horário mudarem
  useEffect(() => {
    const verificarConflitos = async () => {
      if (selectedVendedor && selectedDate && selectedTime) {
        try {
          const dataHora = `${selectedDate}T${selectedTime}:00.000-03:00`;
          const dataHoraFim = selectedEndTime 
            ? `${selectedDate}T${selectedEndTime}:00.000-03:00`
            : new Date(new Date(dataHora).getTime() + 60 * 60 * 1000).toISOString();

          const temConflito = await AgendamentosService.verificarConflitosAgenda(
            selectedVendedor,
            dataHora,
            dataHoraFim
          );

          if (temConflito) {
            setConflitos(['Este horário conflita com outro agendamento do vendedor']);
          } else {
            setConflitos([]);
          }
        } catch (error) {
          console.error('Erro ao verificar conflitos:', error);
        }
      }
    };

    verificarConflitos();
  }, [selectedVendedor, selectedDate, selectedTime, selectedEndTime]);

  const handleCreateNewLead = async () => {
    try {
      if (!newLeadData.nome || !newLeadData.email || !newLeadData.whatsapp) {
        toast.error('Nome, email e WhatsApp são obrigatórios');
        return;
      }

      createLead(newLeadData, {
        onSuccess: (leadCriado) => {
          toast.success('Lead criado com sucesso!');
          setSelectedLead(leadCriado.id);
          setShowNewLeadForm(false);
          setNewLeadData({
            nome: '',
            email: '',
            whatsapp: '',
            observacoes: '',
            fonte_referencia: 'Agendamentos Forçados',
            status: 'novo'
          });
          onSuccess(); // Recarregar leads
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (conflitos.length > 0) {
      toast.error('Não é possível agendar: existe conflito de horário');
      return;
    }

    if (!selectedLead || !selectedVendedor || !selectedPosGraduacao || !selectedDate || !selectedTime || !linkReuniao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    
    try {
      const dataHora = `${selectedDate}T${selectedTime}:00.000-03:00`;
      const dataHoraFim = selectedEndTime 
        ? `${selectedDate}T${selectedEndTime}:00.000-03:00`
        : undefined;

      const agendamento = await AgendamentosService.criarAgendamento({
        lead_id: selectedLead,
        vendedor_id: selectedVendedor,
        pos_graduacao_interesse: selectedPosGraduacao,
        data_agendamento: dataHora,
        data_fim_agendamento: dataHoraFim,
        link_reuniao: linkReuniao,
        observacoes
      }, true); // forçar agendamento = true

      if (agendamento) {
        toast.success('Agendamento forçado criado com sucesso!');
        onSuccess();
        onClose();
        resetForm();
      } else {
        toast.error('Erro ao criar agendamento');
      }
    } catch (error: any) {
      console.error('Erro ao criar agendamento forçado:', error);
      toast.error(error.message || 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedLead('');
    setSelectedVendedor('');
    setSelectedPosGraduacao('');
    setSelectedDate('');
    setSelectedTime('');
    setSelectedEndTime('');
    setLinkReuniao('');
    setObservacoes('Agendamento forçado - ignora restrições de pós-graduação');
    setConflitos([]);
    setShowNewLeadForm(false);
    setSearchType('nome');
    setSearchTerm('');
    setNewLeadData({
      nome: '',
      email: '',
      whatsapp: '',
      observacoes: '',
      fonte_referencia: 'Agendamentos Forçados',
      status: 'novo'
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Forçar Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-orange-700 font-medium">
              ⚠️ Este recurso permite agendar reuniões ignorando as restrições de pós-graduação do vendedor.
              Use apenas em casos excepcionais!
            </CardDescription>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lead Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="lead">Lead *</Label>
              <Button 
                type="button"
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
                    type="button"
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
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowNewLeadForm(false);
                      setNewLeadData({
                        nome: '',
                        email: '',
                        whatsapp: '',
                        observacoes: '',
                        fonte_referencia: 'Agendamentos Forçados',
                        status: 'novo'
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="button"
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

                {/* Mensagem quando não há leads */}
                {filteredLeads.length === 0 && searchTerm && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Nenhum lead encontrado para "{searchTerm}"</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Vendedor Selection */}
          <div className="space-y-2">
            <Label htmlFor="vendedor">Vendedor *</Label>
            <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um vendedor" />
              </SelectTrigger>
              <SelectContent>
                {vendedores.map((vendedor) => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {vendedor.name}
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
                <SelectValue placeholder="Selecione uma pós-graduação" />
              </SelectTrigger>
              <SelectContent>
                {posGraduacoes.map((pg) => (
                  <SelectItem key={pg.id} value={pg.nome}>
                    {pg.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horario">Horário Início *</Label>
              <Input
                id="horario"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horario-fim">Horário Fim</Label>
              <Input
                id="horario-fim"
                type="time"
                value={selectedEndTime}
                onChange={(e) => setSelectedEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Conflict Warning */}
          {conflitos.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Conflito de Horário</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  {conflitos[0]}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Meeting Link */}
          <div className="space-y-2">
            <Label htmlFor="link">Link da Reunião *</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://meet.google.com/abc-defg-hij"
              value={linkReuniao}
              onChange={(e) => setLinkReuniao(e.target.value)}
            />
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || conflitos.length > 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Agendando...' : 'Forçar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForcarNovoAgendamento;