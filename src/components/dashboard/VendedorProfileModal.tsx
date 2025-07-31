import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, Target, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAgendamentosLeads } from '@/hooks/useAgendamentosLeads';
import { useAllVendas } from '@/hooks/useVendas';
import { useSemanasConsecutivas } from '@/hooks/useSemanasConsecutivas';
import MonthYearFilter from '@/components/common/MonthYearFilter';
import { getVendaPeriod } from '@/utils/semanaUtils';

interface VendedorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendedor: {
    id: string;
    nome: string;
    photo_url?: string;
    nivel?: string;
    user_type: string;
  } | null;
  selectedMonth: number;
  selectedYear: number;
}

const VendedorProfileModal: React.FC<VendedorProfileModalProps> = ({
  isOpen,
  onClose,
  vendedor,
  selectedMonth,
  selectedYear
}) => {
  const [filterMonth, setFilterMonth] = useState(selectedMonth);
  const [filterYear, setFilterYear] = useState(selectedYear);

  const { data: agendamentos = [] } = useAgendamentosLeads();
  const { vendas = [] } = useAllVendas();
  const { semanasConsecutivas, loading: loadingSemanas } = useSemanasConsecutivas(vendedor?.id);

  // Filtrar agendamentos do vendedor
  const vendedorAgendamentos = useMemo(() => {
    if (!vendedor) return [];
    return agendamentos.filter(ag => ag.vendedor_id === vendedor.id);
  }, [agendamentos, vendedor]);

  // Filtrar vendas do vendedor para o período
  const vendasHistory = useMemo(() => {
    if (!vendedor) return [];
    return vendas
      .filter(venda => {
        if (venda.vendedor_id !== vendedor.id || !venda.enviado_em) {
          return false;
        }
        
        // Usar a lógica de semana (quarta a terça) para determinar o período
        const vendaDate = new Date(venda.enviado_em);
        const { mes, ano } = getVendaPeriod(vendaDate);
        
        return mes === filterMonth && ano === filterYear;
      })
      .map(venda => {
        const createdDate = new Date(venda.enviado_em);
        return {
          ...venda,
          data: format(createdDate, 'dd/MM/yyyy', { locale: ptBR }),
          status: venda.status || 'pendente',
          curso_nome: venda.curso?.nome,
          aluno_nome: venda.aluno?.nome
        };
      })
      .sort((a, b) => new Date(b.enviado_em).getTime() - new Date(a.enviado_em).getTime());
  }, [vendas, vendedor, filterMonth, filterYear]);

  // Filtrar agendamentos para o período
  const agendamentosHistory = useMemo(() => {
    return vendedorAgendamentos
      .map(agendamento => {
        const agendamentoDate = new Date(agendamento.data_agendamento);
        return {
          ...agendamento,
          data: format(agendamentoDate, 'dd/MM/yyyy', { locale: ptBR }),
          hora: format(agendamentoDate, 'HH:mm', { locale: ptBR })
        };
      })
      .sort((a, b) => new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime());
  }, [vendedorAgendamentos]);

  if (!vendedor) return null;

  const getVendedorColor = (nivel: string) => {
    switch (nivel?.toLowerCase()) {
      case 'junior': return 'bg-green-100 text-green-800';
      case 'pleno': return 'bg-blue-100 text-blue-800';
      case 'senior': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'agendado': return 'bg-blue-100 text-blue-800';
      case 'realizado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      case 'atrasado': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultadoIcon = (resultado: string | null) => {
    switch (resultado) {
      case 'comprou': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'nao_compareceu': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'compareceu_nao_comprou': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={vendedor.photo_url} alt={vendedor.nome} />
              <AvatarFallback>{vendedor.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{vendedor.nome}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">Vendedor</Badge>
                {vendedor.nivel && (
                  <Badge className={getVendedorColor(vendedor.nivel)}>
                    {vendedor.nivel.charAt(0).toUpperCase() + vendedor.nivel.slice(1)}
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {loadingSemanas ? '...' : semanasConsecutivas} semanas consecutivas
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${vendasHistory.filter(v => v.status === 'matriculado').length >= 5 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {vendasHistory.filter(v => v.status === 'matriculado').length} vendas
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <MonthYearFilter 
            selectedMonth={filterMonth}
            selectedYear={filterYear}
            onMonthChange={setFilterMonth}
            onYearChange={setFilterYear}
          />

          <Tabs defaultValue="reunioes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reunioes" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Agenda de Reuniões
              </TabsTrigger>
              <TabsTrigger value="vendas" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Histórico de Vendas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reunioes">
              <Card>
                <CardHeader>
                  <CardTitle>Reuniões Agendadas</CardTitle>
                  <CardDescription>
                    Histórico de reuniões do vendedor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {agendamentosHistory.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma reunião encontrada para este período
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {agendamentosHistory.map((agendamento) => (
                          <div key={agendamento.id} className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{agendamento.data}</span>
                                <span className="text-muted-foreground">às {agendamento.hora}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {getResultadoIcon(agendamento.resultado_reuniao)}
                                <Badge className={getStatusColor(agendamento.status)}>
                                  {agendamento.status}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm">
                                <strong>Interesse:</strong> {agendamento.pos_graduacao_interesse}
                              </p>
                              {agendamento.observacoes && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  <strong>Observações:</strong> {agendamento.observacoes}
                                </p>
                              )}
                              {agendamento.resultado_reuniao && (
                                <p className="text-sm">
                                  <strong>Resultado:</strong> {
                                    agendamento.resultado_reuniao === 'comprou' ? 'Cliente comprou' :
                                    agendamento.resultado_reuniao === 'nao_compareceu' ? 'Cliente não compareceu' :
                                    'Cliente compareceu mas não comprou'
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vendas">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Vendas</CardTitle>
                  <CardDescription>
                    Vendas realizadas pelo vendedor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {vendasHistory.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma venda encontrada para este período
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {vendasHistory.map((venda) => (
                          <div key={venda.id} className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{venda.data}</span>
                              </div>
                              <Badge className={getStatusColor(venda.status)}>
                                {venda.status}
                              </Badge>
                            </div>
                            <div>
                              {venda.curso_nome && (
                                <p className="text-sm">
                                  <strong>Curso:</strong> {venda.curso_nome}
                                </p>
                              )}
                              {venda.aluno_nome && (
                                <p className="text-sm">
                                  <strong>Aluno:</strong> {venda.aluno_nome}
                                </p>
                              )}
                              {venda.pontuacao_esperada && (
                                <p className="text-sm">
                                  <strong>Pontuação:</strong> {venda.pontuacao_esperada}
                                </p>
                              )}
                            </div>
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

export default VendedorProfileModal;