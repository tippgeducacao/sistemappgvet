
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  MessageSquare,
  Plus,
  Save
} from 'lucide-react';
import { useLeadById, useLeadInteractions, useUpdateLead, useAddLeadInteraction, type Lead } from '@/hooks/useLeads';
import { useVendedores } from '@/hooks/useVendedores';
import { useAuthStore } from '@/stores/AuthStore';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';

interface LeadDetailsDialogProps {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeadDetailsDialog: React.FC<LeadDetailsDialogProps> = ({
  leadId,
  open,
  onOpenChange,
}) => {
  const { data: lead, isLoading: leadLoading } = useLeadById(leadId);
  const { data: interactions = [], isLoading: interactionsLoading } = useLeadInteractions(leadId);
  const { vendedores } = useVendedores();
  const { currentUser } = useAuthStore();
  
  const updateLead = useUpdateLead();
  const addInteraction = useAddLeadInteraction();

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [newInteraction, setNewInteraction] = useState({
    tipo: '',
    descricao: '',
    resultado: '',
    proxima_acao: '',
    data_proxima_acao: '',
  });

  const handleSave = () => {
    if (lead) {
      updateLead.mutate({
        id: lead.id,
        ...editData,
      });
      setEditMode(false);
      setEditData({});
    }
  };

  const handleAddInteraction = () => {
    if (newInteraction.tipo && newInteraction.descricao && currentUser) {
      addInteraction.mutate({
        lead_id: leadId,
        user_id: currentUser.id,
        ...newInteraction,
        data_proxima_acao: newInteraction.data_proxima_acao || undefined,
      });
      setNewInteraction({
        tipo: '',
        descricao: '',
        resultado: '',
        proxima_acao: '',
        data_proxima_acao: '',
      });
    }
  };

  if (leadLoading || !lead) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-3">
            <User className="h-5 w-5" />
            <span>{lead.nome}</span>
            <Badge className={
              lead.status === 'novo' ? 'bg-blue-100 text-blue-800' :
              lead.status === 'contatado' ? 'bg-yellow-100 text-yellow-800' :
              lead.status === 'qualificado' ? 'bg-green-100 text-green-800' :
              lead.status === 'convertido' ? 'bg-purple-100 text-purple-800' :
              'bg-red-100 text-red-800'
            }>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </Badge>
            {lead.convertido_em_venda && (
              <Badge className="bg-green-100 text-green-800">
                Convertido em Venda
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Lead capturado em {DataFormattingService.formatDateTime(lead.data_captura)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="detalhes" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="interacoes">
                Interações ({interactions.length})
              </TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="detalhes" className="space-y-4 h-full overflow-auto p-1">

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {/* Informações Básicas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações Básicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Nome</Label>
                        <p className="font-medium break-words">{lead.nome}</p>
                      </div>

                      <div>
                        <Label>Email</Label>
                        {editMode ? (
                          <Input
                            type="email"
                            value={editData.email || lead.email || ''}
                            onChange={(e) => setEditData({...editData, email: e.target.value})}
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="break-all">{lead.email || 'Não informado'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>WhatsApp</Label>
                        {editMode ? (
                          <Input
                            value={editData.whatsapp || lead.whatsapp || ''}
                            onChange={(e) => setEditData({...editData, whatsapp: e.target.value})}
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span className="break-all">{lead.whatsapp || 'Não informado'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Status</Label>
                        {editMode ? (
                          <Select
                            value={editData.status || lead.status}
                            onValueChange={(value) => setEditData({...editData, status: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="novo">Novo</SelectItem>
                              <SelectItem value="contatado">Contatado</SelectItem>
                              <SelectItem value="qualificado">Qualificado</SelectItem>
                              <SelectItem value="convertido">Convertido</SelectItem>
                              <SelectItem value="perdido">Perdido</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={
                            lead.status === 'novo' ? 'bg-blue-100 text-blue-800' :
                            lead.status === 'contatado' ? 'bg-yellow-100 text-yellow-800' :
                            lead.status === 'qualificado' ? 'bg-green-100 text-green-800' :
                            lead.status === 'convertido' ? 'bg-purple-100 text-purple-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <Label>Vendedor Atribuído</Label>
                        {editMode ? (
                          <Select
                            value={editData.vendedor_atribuido || lead.vendedor_atribuido || ''}
                            onValueChange={(value) => setEditData({...editData, vendedor_atribuido: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um vendedor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Nenhum vendedor</SelectItem>
                              {vendedores.map(vendedor => (
                                <SelectItem key={vendedor.id} value={vendedor.id}>
                                  {vendedor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="break-words">{lead.vendedor_atribuido_profile?.name || 'Não atribuído'}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Informações de Origem */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações de Origem</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Fonte de Referência</Label>
                        <p className="break-words">{lead.fonte_referencia || 'Não informado'}</p>
                      </div>

                      <div>
                        <Label>Página de Captura</Label>
                        <p className="break-all text-sm">{lead.pagina_nome || 'Não informado'}</p>
                      </div>

                      <div>
                        <Label>Dispositivo</Label>
                        <p>{lead.dispositivo || 'Não informado'}</p>
                      </div>

                      <div>
                        <Label>Região</Label>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>{lead.regiao || 'Não informado'}</span>
                        </div>
                      </div>

                      {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
                        <div>
                          <Label>UTM Parameters</Label>
                          <div className="space-y-1 text-sm">
                            {lead.utm_source && <p><strong>Source:</strong> <span className="break-all">{lead.utm_source}</span></p>}
                            {lead.utm_medium && <p><strong>Medium:</strong> <span className="break-all">{lead.utm_medium}</span></p>}
                            {lead.utm_campaign && <p><strong>Campaign:</strong> <span className="break-all">{lead.utm_campaign}</span></p>}
                            {lead.utm_content && <p><strong>Content:</strong> <span className="break-all">{lead.utm_content}</span></p>}
                            {lead.utm_term && <p><strong>Term:</strong> <span className="break-all">{lead.utm_term}</span></p>}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Observações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editMode ? (
                      <Textarea
                        placeholder="Adicione observações sobre este lead..."
                        value={editData.observacoes || lead.observacoes || ''}
                        onChange={(e) => setEditData({...editData, observacoes: e.target.value})}
                        rows={3}
                      />
                    ) : (
                      <p className="break-words whitespace-pre-wrap">{lead.observacoes || 'Nenhuma observação registrada'}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interacoes" className="space-y-4 h-full overflow-auto p-1">
                {/* Nova Interação */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Interação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de Interação</Label>
                        <Select
                          value={newInteraction.tipo}
                          onValueChange={(value) => setNewInteraction({...newInteraction, tipo: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contato_telefonico">Contato Telefônico</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="reuniao">Reunião</SelectItem>
                            <SelectItem value="proposta">Proposta Enviada</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Resultado</Label>
                        <Select
                          value={newInteraction.resultado}
                          onValueChange={(value) => setNewInteraction({...newInteraction, resultado: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Como foi o resultado?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="interessado">Interessado</SelectItem>
                            <SelectItem value="muito_interessado">Muito Interessado</SelectItem>
                            <SelectItem value="nao_interessado">Não Interessado</SelectItem>
                            <SelectItem value="reagendar">Reagendar</SelectItem>
                            <SelectItem value="sem_resposta">Sem Resposta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        placeholder="Descreva o que aconteceu nesta interação..."
                        value={newInteraction.descricao}
                        onChange={(e) => setNewInteraction({...newInteraction, descricao: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label>Próxima Ação</Label>
                        <Input
                          placeholder="O que precisa ser feito?"
                          value={newInteraction.proxima_acao}
                          onChange={(e) => setNewInteraction({...newInteraction, proxima_acao: e.target.value})}
                        />
                      </div>

                      <div>
                        <Label>Data da Próxima Ação</Label>
                        <Input
                          type="datetime-local"
                          value={newInteraction.data_proxima_acao}
                          onChange={(e) => setNewInteraction({...newInteraction, data_proxima_acao: e.target.value})}
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleAddInteraction}
                      disabled={!newInteraction.tipo || !newInteraction.descricao}
                      className="w-full"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Registrar Interação
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de Interações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Histórico de Interações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {interactions.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhuma interação registrada ainda
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {interactions.map((interaction) => (
                          <div key={interaction.id} className="border-l-4 border-blue-200 pl-4 py-2">
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <Badge variant="outline">
                                  {interaction.tipo.replace('_', ' ').toUpperCase()}
                                </Badge>
                                {interaction.resultado && (
                                  <Badge className={
                                    interaction.resultado === 'interessado' || interaction.resultado === 'muito_interessado' 
                                      ? 'bg-green-100 text-green-800'
                                      : interaction.resultado === 'nao_interessado'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }>
                                    {interaction.resultado.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {DataFormattingService.formatDateTime(interaction.created_at)}
                              </span>
                            </div>
                            
                            <p className="text-sm mb-2 break-words">{interaction.descricao}</p>
                            
                            {interaction.proxima_acao && (
                              <div className="text-xs text-muted-foreground">
                                <strong>Próxima ação:</strong> <span className="break-words">{interaction.proxima_acao}</span>
                                {interaction.data_proxima_acao && (
                                  <span> - {DataFormattingService.formatDateTime(interaction.data_proxima_acao)}</span>
                                )}
                              </div>
                            )}
                            
                            <div className="text-xs text-muted-foreground mt-1">
                              Por: {interaction.user?.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historico" className="space-y-4 h-full overflow-auto p-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dados Técnicos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>IP Address</Label>
                        <p className="font-mono break-all">{lead.ip_address || 'Não informado'}</p>
                      </div>
                      
                      <div>
                        <Label>User Agent</Label>
                        <p className="font-mono text-xs break-all">{lead.user_agent || 'Não informado'}</p>
                      </div>
                      
                      <div>
                        <Label>ID da Página</Label>
                        <p className="font-mono break-all">{lead.pagina_id || 'Não informado'}</p>
                      </div>
                      
                      <div>
                        <Label>Data de Criação</Label>
                        <p>{DataFormattingService.formatDateTime(lead.created_at)}</p>
                      </div>
                      
                      <div>
                        <Label>Última Atualização</Label>
                        <p>{DataFormattingService.formatDateTime(lead.updated_at)}</p>
                      </div>
                      
                      <div>
                        <Label>ID do Lead</Label>
                        <p className="font-mono text-xs break-all">{lead.id}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailsDialog;
