import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, User, Phone, Mail, ExternalLink, Edit, X } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AgendamentosService } from '@/services/agendamentos/AgendamentosService';
import { toast } from 'sonner';

interface AgendamentoSDR {
  id: string;
  lead_id: string;
  vendedor_id: string;
  data_agendamento: string;
  data_fim_agendamento?: string;
  pos_graduacao_interesse: string;
  link_reuniao: string;
  observacoes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  lead?: {
    nome: string;
    email?: string;
    whatsapp?: string;
  };
  vendedor?: {
    name: string;
    email: string;
  };
}

interface AgendamentosSDRPlanilhaProps {
  agendamentos: AgendamentoSDR[];
  onRecarregarDados: () => void;
}

const AgendamentosSDRPlanilha: React.FC<AgendamentosSDRPlanilhaProps> = ({
  agendamentos,
  onRecarregarDados
}) => {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoSDR | null>(null);
  const [editandoAgendamento, setEditandoAgendamento] = useState<AgendamentoSDR | null>(null);
  const [dialogEdicaoAberto, setDialogEdicaoAberto] = useState(false);
  
  // Estados para edição
  const [editFormData, setEditFormData] = useState({
    data: '',
    horario_inicio: '',
    horario_fim: '',
    observacoes: ''
  });

  const getStatusBadge = (agendamento: AgendamentoSDR) => {
    const dataReuniao = new Date(agendamento.data_agendamento);
    const agora = new Date();
    
    // Validação de status - garantir que apenas status válidos sejam exibidos
    const statusValidos = ['agendado', 'atrasado', 'cancelado', 'realizado', 'reagendado'];
    const status = agendamento.status?.toLowerCase().trim();
    
    // Se status inválido, considerar como agendado
    if (!status || !statusValidos.includes(status)) {
      console.warn(`Status inválido detectado: "${agendamento.status}". Tratando como "agendado".`);
      return <Badge variant="default">Agendado</Badge>;
    }
    
    switch (status) {
      case 'agendado':
        // Não criar status "pendente" visual - manter sempre como "agendado" mesmo se passou do horário
        return <Badge variant="default">Agendado</Badge>;
      case 'atrasado':
        return <Badge variant="destructive">Atrasado</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'realizado':
        return <Badge variant="secondary">Realizado</Badge>;
      case 'reagendado':
        return <Badge variant="outline">Reagendado</Badge>;
      default:
        return <Badge variant="default">Agendado</Badge>;
    }
  };

  const isReuniaoPassada = (agendamento: AgendamentoSDR) => {
    if (agendamento.status !== 'agendado') return false;
    
    const dataFim = agendamento.data_fim_agendamento 
      ? new Date(agendamento.data_fim_agendamento)
      : new Date(new Date(agendamento.data_agendamento).getTime() + 60 * 60 * 1000); // 1 hora depois se não tiver fim
    
    return isAfter(new Date(), dataFim);
  };

  const formatarHorario = (agendamento: AgendamentoSDR) => {
    const inicio = format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR });
    
    if (agendamento.data_fim_agendamento) {
      const fim = format(new Date(agendamento.data_fim_agendamento), "HH:mm", { locale: ptBR });
      return `${inicio} - ${fim}`;
    }
    
    return inicio;
  };

  const abrirDialog = (agendamento: AgendamentoSDR) => {
    setAgendamentoSelecionado(agendamento);
    setDialogAberto(true);
  };

  const abrirDialogEdicao = (agendamento: AgendamentoSDR) => {
    setEditandoAgendamento(agendamento);
    
    const dataInicio = new Date(agendamento.data_agendamento);
    const dataFim = agendamento.data_fim_agendamento ? new Date(agendamento.data_fim_agendamento) : null;
    
    setEditFormData({
      data: dataInicio.toISOString().split('T')[0],
      horario_inicio: dataInicio.toTimeString().slice(0, 5),
      horario_fim: dataFim ? dataFim.toTimeString().slice(0, 5) : '',
      observacoes: agendamento.observacoes || ''
    });
    
    setDialogEdicaoAberto(true);
  };

  const handleUpdateAgendamento = async () => {
    if (!editandoAgendamento || !editFormData.data || !editFormData.horario_inicio) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar se horário final é posterior ao inicial
    if (editFormData.horario_fim && editFormData.horario_fim <= editFormData.horario_inicio) {
      toast.error('O horário final deve ser posterior ao horário inicial');
      return;
    }

    try {
      const dataAgendamento = `${editFormData.data}T${editFormData.horario_inicio}:00.000-03:00`;
      const dataFimAgendamento = editFormData.horario_fim ? `${editFormData.data}T${editFormData.horario_fim}:00.000-03:00` : undefined;

      const success = await AgendamentosService.atualizarAgendamentoSDR(
        editandoAgendamento.id,
        {
          data_agendamento: dataAgendamento,
          data_fim_agendamento: dataFimAgendamento,
          observacoes: editFormData.observacoes
        }
      );

      if (success) {
        toast.success('Agendamento atualizado com sucesso! O vendedor foi notificado.');
        setDialogEdicaoAberto(false);
        setEditandoAgendamento(null);
        onRecarregarDados();
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
        onRecarregarDados();
      } else {
        toast.error('Erro ao cancelar agendamento');
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error('Erro ao cancelar agendamento');
    }
  };

  return (
    <div className="space-y-4">
      {agendamentos.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Pós-Graduação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reunião</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentos.map((agendamento) => (
                  <TableRow 
                    key={agendamento.id}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      isReuniaoPassada(agendamento) ? 'bg-warning/10 border-l-4 border-l-warning dark:bg-warning/5' : ''
                    }`}
                    onClick={() => abrirDialog(agendamento)}
                  >
                    <TableCell className="font-medium">
                      {agendamento.lead?.nome}
                    </TableCell>
                    <TableCell>
                      {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {formatarHorario(agendamento)}
                    </TableCell>
                    <TableCell>
                      {agendamento.vendedor?.name}
                    </TableCell>
                    <TableCell>
                      {agendamento.pos_graduacao_interesse}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(agendamento)}
                    </TableCell>
                    <TableCell>
                      {agendamento.link_reuniao && (
                        <span className="text-sm text-muted-foreground">
                          Link disponível
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1">
                        {(agendamento.status === 'agendado' || agendamento.status === 'atrasado') && (
                          <>
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDialogEdicao(agendamento);
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="Editar agendamento"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelAgendamento(agendamento.id);
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Cancelar agendamento"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          
          {agendamentoSelecionado && (
            <div className="space-y-6">
              {/* Informações do Lead */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Lead
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Nome:</strong> {agendamentoSelecionado.lead?.nome}
                  </div>
                  {agendamentoSelecionado.lead?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <strong>Email:</strong> {agendamentoSelecionado.lead.email}
                    </div>
                  )}
                  {agendamentoSelecionado.lead?.whatsapp && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <strong>WhatsApp:</strong> {agendamentoSelecionado.lead.whatsapp}
                    </div>
                  )}
                  <div>
                    <strong>Interesse:</strong> {agendamentoSelecionado.pos_graduacao_interesse}
                  </div>
                </div>
              </div>

              {/* Informações do Agendamento */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informações do Agendamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Data:</strong> {format(new Date(agendamentoSelecionado.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div>
                    <strong>Horário:</strong> {formatarHorario(agendamentoSelecionado)}
                  </div>
                  <div>
                    <strong>Vendedor:</strong> {agendamentoSelecionado.vendedor?.name}
                  </div>
                  <div>
                    <strong>Status:</strong> {getStatusBadge(agendamentoSelecionado)}
                  </div>
                </div>

                {agendamentoSelecionado.link_reuniao && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    <a 
                      href={agendamentoSelecionado.link_reuniao.startsWith('http') 
                        ? agendamentoSelecionado.link_reuniao 
                        : `https://${agendamentoSelecionado.link_reuniao}`
                      } 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Acessar Reunião
                    </a>
                  </div>
                )}

                {agendamentoSelecionado.observacoes && (
                  <div className="text-sm">
                    <strong>Observações:</strong> 
                    <p className="mt-1 text-muted-foreground">{agendamentoSelecionado.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={dialogEdicaoAberto} onOpenChange={setDialogEdicaoAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={editFormData.data}
                onChange={(e) => setEditFormData(prev => ({ ...prev, data: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="horario_inicio">Horário Início</Label>
                <Input
                  id="horario_inicio"
                  type="time"
                  value={editFormData.horario_inicio}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, horario_inicio: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="horario_fim">Horário Fim</Label>
                <Input
                  id="horario_fim"
                  type="time"
                  value={editFormData.horario_fim}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, horario_fim: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={editFormData.observacoes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações sobre o agendamento..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateAgendamento} className="flex-1">
                Salvar Alterações
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDialogEdicaoAberto(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendamentosSDRPlanilha;