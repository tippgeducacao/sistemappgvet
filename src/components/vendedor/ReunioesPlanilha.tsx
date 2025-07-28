import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, User, Phone, Mail, ExternalLink, Plus } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Agendamento } from '@/hooks/useAgendamentos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import NovaVendaForm from '@/components/NovaVendaForm';
import { useFormStore } from '@/store/FormStore';

interface ReunioesPlanilhaProps {
  agendamentos: Agendamento[];
  onAtualizarResultado: (id: string, resultado: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou', observacoes?: string) => Promise<boolean>;
}


const ReunioesPlanilha: React.FC<ReunioesPlanilhaProps> = ({
  agendamentos,
  onAtualizarResultado
}) => {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novaVendaAberto, setNovaVendaAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const { updateField, clearForm } = useFormStore();

  // Separar reuniões em agendadas (sem resultado) e histórico (com resultado)
  const { reunioesAgendadas, reunioesHistorico } = useMemo(() => {
    const agendadas = agendamentos.filter(agendamento => !agendamento.resultado_reuniao);
    const historico = agendamentos.filter(agendamento => agendamento.resultado_reuniao);
    
    return {
      reunioesAgendadas: agendadas,
      reunioesHistorico: historico
    };
  }, [agendamentos]);

  const getStatusBadge = (agendamento: Agendamento) => {
    if (agendamento.resultado_reuniao) {
      switch (agendamento.resultado_reuniao) {
        case 'nao_compareceu':
          return <Badge variant="destructive">Não Compareceu</Badge>;
        case 'compareceu_nao_comprou':
          return <Badge variant="secondary">Compareceu - Não Comprou</Badge>;
        case 'comprou':
          return <Badge variant="default">Comprou</Badge>;
      }
    }
    
    const dataReuniao = new Date(agendamento.data_agendamento);
    const agora = new Date();
    
    if (dataReuniao > agora) {
      return <Badge variant="outline">Agendado</Badge>;
    } else {
      return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const isReuniaoPerdida = (agendamento: Agendamento) => {
    if (agendamento.resultado_reuniao) return false;
    
    const dataFim = agendamento.data_fim_agendamento 
      ? new Date(agendamento.data_fim_agendamento)
      : new Date(new Date(agendamento.data_agendamento).getTime() + 60 * 60 * 1000); // 1 hora depois se não tiver fim
    
    return isAfter(new Date(), dataFim);
  };

  const formatarHorario = (agendamento: Agendamento) => {
    const inicio = format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR });
    
    if (agendamento.data_fim_agendamento) {
      const fim = format(new Date(agendamento.data_fim_agendamento), "HH:mm", { locale: ptBR });
      return `${inicio} - ${fim}`;
    }
    
    return inicio;
  };

  const handleAtualizarResultado = async (resultado: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou') => {
    if (!agendamentoSelecionado) return;
    
    const sucesso = await onAtualizarResultado(agendamentoSelecionado.id, resultado, observacoes);
    if (sucesso) {
      setDialogAberto(false);
      setAgendamentoSelecionado(null);
      setObservacoes('');
    }
  };

  const abrirDialog = (agendamento: Agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setObservacoes(agendamento.observacoes_resultado || '');
    setDialogAberto(true);
  };

  const abrirNovaVenda = (agendamento: Agendamento) => {
    // Limpar formulário primeiro
    clearForm();
    
    // Preencher dados do lead
    if (agendamento.lead) {
      if (agendamento.lead.nome) {
        updateField('nomeAluno', agendamento.lead.nome);
      }
      if (agendamento.lead.email) {
        updateField('emailAluno', agendamento.lead.email);
      }
      if (agendamento.lead.whatsapp) {
        updateField('telefone', agendamento.lead.whatsapp);
      }
    }
    
    // Adicionar observação sobre origem da venda
    const observacaoOrigem = `Venda originada da reunião do dia ${format(new Date(agendamento.data_agendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
    updateField('observacoes', observacaoOrigem);
    
    // Adicionar ID do agendamento para controle
    updateField('agendamentoId', agendamento.id);
    
    setAgendamentoSelecionado(agendamento);
    setNovaVendaAberto(true);
  };

  const renderTabela = (listaAgendamentos: Agendamento[], mostrarAcoes: boolean = true) => (
    listaAgendamentos.length === 0 ? (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-muted-foreground">Nenhuma reunião encontrada</p>
        </CardContent>
      </Card>
    ) : (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reunião</TableHead>
                {mostrarAcoes && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {listaAgendamentos.map((agendamento) => (
                <TableRow 
                  key={agendamento.id}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    isReuniaoPerdida(agendamento) ? 'bg-destructive/10 text-destructive' : ''
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
                    {getStatusBadge(agendamento)}
                  </TableCell>
                  <TableCell>
                    {agendamento.link_reuniao && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            agendamento.link_reuniao.startsWith('http') 
                              ? agendamento.link_reuniao 
                              : `https://${agendamento.link_reuniao}`,
                            '_blank'
                          );
                        }}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Acessar
                      </Button>
                    )}
                  </TableCell>
                  {mostrarAcoes && (
                    <TableCell className="text-right">
                      {!agendamento.resultado_reuniao && (
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirDialog(agendamento);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Marcar Resultado
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="agendadas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agendadas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agendadas ({reunioesAgendadas.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Histórico ({reunioesHistorico.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="agendadas" className="space-y-4">
          {renderTabela(reunioesAgendadas, true)}
        </TabsContent>
        
        <TabsContent value="historico" className="space-y-4">
          {renderTabela(reunioesHistorico, false)}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {agendamentoSelecionado?.resultado_reuniao ? 'Detalhes da Reunião' : 'Marcar Resultado da Reunião'}
            </DialogTitle>
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

              {/* Informações da Reunião */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informações da Reunião
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Data:</strong> {format(new Date(agendamentoSelecionado.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div>
                    <strong>Horário:</strong> {formatarHorario(agendamentoSelecionado)}
                  </div>
                  <div>
                    <strong>SDR Responsável:</strong> {agendamentoSelecionado.sdr?.name}
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
                    <strong>Observações do Agendamento:</strong> 
                    <p className="mt-1 text-muted-foreground">{agendamentoSelecionado.observacoes}</p>
                  </div>
                )}

                {agendamentoSelecionado.observacoes_resultado && (
                  <div className="text-sm">
                    <strong>Observações do Resultado:</strong> 
                    <p className="mt-1 text-muted-foreground">{agendamentoSelecionado.observacoes_resultado}</p>
                  </div>
                )}
              </div>

              {/* Marcar Resultado - só aparece se não tiver resultado ainda */}
              {!agendamentoSelecionado.resultado_reuniao && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-lg">Marcar Resultado</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações (opcional)</Label>
                    <Textarea
                      id="observacoes"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Adicione observações sobre a reunião..."
                      className="min-h-20"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button 
                      onClick={() => handleAtualizarResultado('nao_compareceu')}
                      variant="destructive"
                      size="sm"
                    >
                      Não Compareceu
                    </Button>
                    
                    <Button 
                      onClick={() => handleAtualizarResultado('compareceu_nao_comprou')}
                      variant="secondary"
                      size="sm"
                    >
                      Não Comprou
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        setDialogAberto(false);
                        abrirNovaVenda(agendamentoSelecionado);
                      }}
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      Criar Venda
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Venda */}
      {novaVendaAberto && (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
          <NovaVendaForm 
            onCancel={() => {
              setNovaVendaAberto(false);
              setAgendamentoSelecionado(null);
              clearForm();
            }}
          />
        </div>
      )}
    </div>
  );
};


export default ReunioesPlanilha;