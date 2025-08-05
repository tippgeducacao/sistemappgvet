import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Trophy, Target, TrendingUp, Users } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useAgendamentosSDR } from '@/hooks/useAgendamentosSDR';
import { useSemanasConsecutivas } from '@/hooks/useSemanasConsecutivas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getVendaPeriod } from '@/utils/semanaUtils';

interface SDRProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  sdr: {
    id: string;
    nome: string;
    photo_url?: string;
    tipo: 'inbound' | 'outbound';
    nivel: string;
    metaReunioesSemanal: number;
  } | null;
}

const SDRProfileModal: React.FC<SDRProfileModalProps> = ({ isOpen, onClose, sdr }) => {
  const { vendas } = useAllVendas();
  const { agendamentos = [] } = useAgendamentosSDR();
  const { semanasConsecutivas, loading: loadingSemanas } = useSemanasConsecutivas(sdr?.id);
  const [selectedPeriod, setSelectedPeriod] = useState<'semana' | 'mes' | 'ano'>('mes');

  // Calcular histórico de vendas
  const vendasHistory = useMemo(() => {
    if (!sdr) return [];

    const sdrVendas = vendas.filter(v => 
      v.vendedor_id === sdr.id && 
      v.status === 'matriculado'
    );

    return sdrVendas.map(venda => ({
      id: venda.id,
      alunoNome: venda.aluno?.nome || 'Nome não informado',
      curso: venda.curso?.nome || 'Curso não informado',
      data: venda.enviado_em,
      pontos: 1
    })).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [sdr, vendas]);

  // Calcular histórico de agendamentos
  const agendamentosHistory = useMemo(() => {
    if (!sdr) return [];

    const sdrAgendamentos = agendamentos.filter(a => a.sdr_id === sdr.id);

    return sdrAgendamentos.map(agendamento => ({
      id: agendamento.id,
      leadNome: agendamento.lead?.nome || 'Nome não informado',
      data: agendamento.data_agendamento,
      status: agendamento.status || 'agendado',
      observacoes: agendamento.observacoes
    })).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [sdr, agendamentos]);

  // Estatísticas do período selecionado
  const periodStats = useMemo(() => {
    if (!sdr) return null;

    const hoje = new Date();
    let dataInicio: Date;
    let dataFim: Date;

    if (selectedPeriod === 'semana') {
      dataInicio = new Date(hoje);
      dataInicio.setDate(hoje.getDate() - ((hoje.getDay() + 4) % 7));
      dataFim = new Date(dataInicio);
      dataFim.setDate(dataInicio.getDate() + 6);
    } else if (selectedPeriod === 'mes') {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    } else {
      dataInicio = new Date(hoje.getFullYear(), 0, 1);
      dataFim = new Date(hoje.getFullYear(), 11, 31);
    }

    const vendasPeriodo = vendasHistory.filter(v => {
      const dataVenda = new Date(v.data);
      return dataVenda >= dataInicio && dataVenda <= dataFim;
    });

    const agendamentosPeriodo = agendamentosHistory.filter(a => {
      const dataAgendamento = new Date(a.data);
      return dataAgendamento >= dataInicio && dataAgendamento <= dataFim;
    });

    return {
      vendas: vendasPeriodo.length,
      agendamentos: agendamentosPeriodo.length,
      metaReunioes: selectedPeriod === 'semana' ? sdr.metaReunioesSemanal :
                   selectedPeriod === 'mes' ? sdr.metaReunioesSemanal * 4 :
                   sdr.metaReunioesSemanal * 52
    };
  }, [sdr, selectedPeriod, vendasHistory, agendamentosHistory]);

  const getSDRColor = (tipo: 'inbound' | 'outbound') => {
    return tipo === 'inbound' ? 'bg-blue-500' : 'bg-green-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-green-500';
      case 'cancelado': return 'bg-red-500';
      case 'reagendado': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  if (!sdr) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={sdr.photo_url} alt={sdr.nome} />
              <AvatarFallback>
                {sdr.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                {sdr.nome}
                <Badge 
                  variant="outline" 
                  className={`${getSDRColor(sdr.tipo)} text-white border-0`}
                >
                  {sdr.tipo === 'inbound' ? 'Inbound' : 'Outbound'}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {loadingSemanas ? '...' : semanasConsecutivas} semanas consecutivas
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{sdr.nivel}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtro de Período */}
          <div className="flex justify-end">
            <Select value={selectedPeriod} onValueChange={(value: 'semana' | 'mes' | 'ano') => setSelectedPeriod(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mês</SelectItem>
                <SelectItem value="ano">Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs com Histórico */}
          <Tabs defaultValue="vendas" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vendas">Histórico de Vendas</TabsTrigger>
              <TabsTrigger value="agendamentos">Histórico de Reuniões</TabsTrigger>
            </TabsList>

            <TabsContent value="vendas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Vendas de Cursos</CardTitle>
                  <CardDescription>
                    Total: {vendasHistory.length} vendas ({vendasHistory.length} pontos)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {vendasHistory.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma venda encontrada
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {vendasHistory.map((venda) => (
                          <div key={venda.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                              <p className="font-medium">{venda.alunoNome}</p>
                              <p className="text-sm text-muted-foreground">{venda.curso}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(venda.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-green-500 text-white border-0">
                              +{venda.pontos} pt
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agendamentos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Reuniões Agendadas</CardTitle>
                  <CardDescription>
                    Total: {agendamentosHistory.length} agendamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {agendamentosHistory.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum agendamento encontrado
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {agendamentosHistory.map((agendamento) => (
                          <div key={agendamento.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                              <p className="font-medium">{agendamento.leadNome}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(agendamento.data), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                              {agendamento.observacoes && (
                                <p className="text-xs text-muted-foreground italic">
                                  {agendamento.observacoes}
                                </p>
                              )}
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`${getStatusColor(agendamento.status)} text-white border-0`}
                            >
                              {agendamento.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SDRProfileModal;