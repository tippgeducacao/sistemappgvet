import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/AuthStore';
import { useVendas } from '@/hooks/useVendas';
import { useAllLeads } from '@/hooks/useLeads';
import { useAgendamentosSDR } from '@/hooks/useAgendamentosSDR';
import MonthYearFilter from '@/components/common/MonthYearFilter';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import ReunioesCanceladasSDR from './ReunioesCanceladasSDR';
import HistoricoReunioes from './HistoricoReunioes';
import { SDRMetasSemanais } from './SDRMetasSemanais';

import { ReunioesVendedoresChart } from '@/components/dashboard/ReunioesVendedoresChart';
import SDRAgendamentosComparativo from './SDRAgendamentosComparativo';
import { SDRComissionamentoSemanal } from './SDRComissionamentoSemanal';
import { GerenciarComissionamentoSDR } from './GerenciarComissionamentoSDR';
import { FileText, Users, Calendar, TrendingUp, X, History, DollarSign, Settings } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
const SDRDashboard: React.FC = () => {
  const { profile } = useAuthStore();
  const { vendas } = useVendas();
  const leadsQuery = useAllLeads();
  const { agendamentos, fetchAgendamentosCancelados } = useAgendamentosSDR();

  const { isSDR } = useUserRoles();
  const leads = leadsQuery.data || [];
  // Usar lógica de semanas consistente
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  const { mes: mesCorreto, ano: anoCorreto } = getMesAnoSemanaAtual();
  const [selectedMonth, setSelectedMonth] = useState(mesCorreto);
  const [selectedYear, setSelectedYear] = useState(anoCorreto);

  // Filtrar dados do mês/ano selecionado
  const vendasDoMes = vendas.filter(venda => {
    if (!venda.enviado_em) return false;
    const dataVenda = new Date(venda.enviado_em);
    return dataVenda.getMonth() + 1 === selectedMonth && dataVenda.getFullYear() === selectedYear;
  });

  const leadsDoMes = leads.filter(lead => {
    if (!lead.created_at) return false;
    const dataLead = new Date(lead.created_at);
    return dataLead.getMonth() + 1 === selectedMonth && dataLead.getFullYear() === selectedYear;
  });

  const agendamentosDoMes = agendamentos.filter(agendamento => {
    const dataAgendamento = new Date(agendamento.data_agendamento);
    return dataAgendamento.getMonth() + 1 === selectedMonth && dataAgendamento.getFullYear() === selectedYear;
  });

  const vendasMatriculadas = vendasDoMes.filter(v => v.status === 'matriculado').length;
  const vendasPendentes = vendasDoMes.filter(v => v.status === 'pendente').length;
  const agendamentosRealizados = agendamentosDoMes.filter(a => a.status === 'realizado').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Olá, {profile?.name || 'SDR'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus leads, agendamentos e vendas de cursos
          </p>
        </div>
      </div>

      {/* Filtro por período */}
      <MonthYearFilter
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />



      {/* Meta de Agendamentos e Comparativo */}
      <SDRAgendamentosComparativo />

      {/* Metas Semanais Detalhadas */}
      <SDRMetasSemanais />

      {/* Gráfico de Resultados das Reuniões */}
      {/* {!isSDR && <ReunioesVendedoresChart selectedVendedor={profile?.id} />} */}

      {/* Gráfico de Pizza das Reuniões */}
      {/* <ReunioesChart /> */}

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="vendas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendas" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Vendas Recentes
          </TabsTrigger>
          {!isSDR && (
            <>
              <TabsTrigger value="comissionamento" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Comissionamento
              </TabsTrigger>
              <TabsTrigger value="gerenciar-comissionamento" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Gerenciar Comissionamento
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="canceladas" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Agendamentos Cancelados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendas">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Vendas de Cursos Recentes</CardTitle>
              <CardDescription>
                Suas últimas vendas de cursos cadastradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendasDoMes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma venda de curso cadastrada ainda</p>
                  <p className="text-sm">Acesse a aba "Nova Venda" para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vendasDoMes.slice(0, 5).map((venda) => (
                    <div key={venda.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{venda.aluno?.nome || 'Nome não informado'}</p>
                        <p className="text-sm text-muted-foreground">
                          {venda.curso?.nome || 'Curso não informado'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {venda.enviado_em ? new Date(venda.enviado_em).toLocaleDateString('pt-BR') : 'Data não informada'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          venda.status === 'matriculado' ? 'bg-green-100 text-green-800' :
                          venda.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {venda.status === 'matriculado' ? 'Matriculado' :
                           venda.status === 'pendente' ? 'Pendente' : 'Rejeitado'}
                        </div>
                        <p className="text-sm font-medium mt-1">
                          {venda.pontuacao_esperada || 0} pts
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

{!isSDR && (
          <>
            <TabsContent value="comissionamento">
              <SDRComissionamentoSemanal />
            </TabsContent>

            <TabsContent value="gerenciar-comissionamento">
              <GerenciarComissionamentoSDR />
            </TabsContent>
          </>
        )}
        <TabsContent value="historico">
          <HistoricoReunioes />
        </TabsContent>

        <TabsContent value="canceladas">
          <ReunioesCanceladasSDR 
            fetchAgendamentosCancelados={fetchAgendamentosCancelados}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SDRDashboard;