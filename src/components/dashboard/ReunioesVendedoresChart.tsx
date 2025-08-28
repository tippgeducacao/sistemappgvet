import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Eye } from 'lucide-react';
import { useResultadosReunioesVendedores } from '@/hooks/useResultadosReunioesVendedores';
import { useAgendamentosDetalhados } from '@/hooks/useAgendamentosDetalhados';
import LoadingState from '@/components/ui/loading-state';
import VendedorReunioesModal from './VendedorReunioesModal';
import { getWeekRange } from '@/utils/semanaUtils';
import { supabase } from '@/integrations/supabase/client';

interface ReunioesVendedoresChartProps {
  selectedVendedor?: string;
}

const COLORS = {
  convertidas: '#10b981', // Verde para vendas convertidas (aprovadas)
  pendentes: '#3b82f6', // Azul para reuniões marcadas como comprou mas pendentes
  compareceram: '#f59e0b', // Amarelo para compareceram mas não compraram
  naoCompareceram: '#ef4444' // Vermelho para não compareceram
};

export const ReunioesVendedoresChart: React.FC<ReunioesVendedoresChartProps> = ({ selectedVendedor }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [modalVendedor, setModalVendedor] = useState<{ id: string; name: string } | null>(null);
  const { statsData, isLoading } = useResultadosReunioesVendedores(selectedVendedor, selectedWeek);
  
  // Hook para dados detalhados corretos do resumo (mesmos dados do modal)
  const [detailedStatsData, setDetailedStatsData] = useState<any[]>([]);
  const [loadingDetailed, setLoadingDetailed] = useState(false);

  // Função para buscar dados detalhados corretos para o resumo
  const fetchDetailedStats = async () => {
    if (!statsData.length) return;
    
    setLoadingDetailed(true);
    const detailedResults = [];
    
    for (const vendedor of statsData) {
      // Para cada vendedor, buscar os dados detalhados corretos (mesma lógica do modal)
      try {
        const { start: startOfWeek, end: endOfWeek } = getWeekRange(selectedWeek);

        // Buscar agendamentos com resultado na semana
        const { data: agendamentos } = await supabase
          .from('agendamentos')
          .select(`
            id,
            lead_id,
            data_agendamento,
            data_resultado,
            resultado_reuniao,
            form_entry_id
          `)
          .eq('vendedor_id', vendedor.vendedor_id)
          .not('resultado_reuniao', 'is', null)
          .gte('data_resultado', startOfWeek.toISOString())
          .lte('data_resultado', endOfWeek.toISOString());

        // Buscar vendas convertidas da semana
        const { data: vendas } = await supabase
          .from('form_entries')
          .select('id')
          .eq('vendedor_id', vendedor.vendedor_id)
          .eq('status', 'matriculado')
          .not('data_assinatura_contrato', 'is', null)
          .gte('data_assinatura_contrato', startOfWeek.toISOString().split('T')[0])
          .lte('data_assinatura_contrato', endOfWeek.toISOString().split('T')[0]);

        // Filtrar "comprou" já convertidos globalmente
        const agendamentosComprou = agendamentos?.filter(a => a.resultado_reuniao === 'comprou' && a.form_entry_id) || [];
        const agendamentosComprouSemFormEntry = agendamentos?.filter(a => a.resultado_reuniao === 'comprou' && !a.form_entry_id) || [];
        const formEntryIds = agendamentosComprou.map(a => a.form_entry_id).filter(Boolean);
        
        let convertidasGlobal = new Set<string>();
        if (formEntryIds.length > 0) {
          const { data: vendasGlobal } = await supabase
            .from('form_entries')
            .select('id')
            .in('id', formEntryIds)
            .eq('status', 'matriculado')
            .not('data_assinatura_contrato', 'is', null);
          
          vendasGlobal?.forEach(v => convertidasGlobal.add(v.id));
        }

        // Fazer matching por leads para agendamentos sem form_entry_id (IGUAL AO MODAL)
        let agendamentosMatchingLeads = new Set<string>();
        if (agendamentosComprouSemFormEntry.length > 0 && vendas && vendas.length > 0) {
          // Buscar dados dos leads
          const leadIds = agendamentosComprouSemFormEntry.map(a => a.lead_id).filter(Boolean);
          
          if (leadIds.length > 0) {
            const { data: leadsData } = await supabase
              .from('leads')
              .select('id, whatsapp, email')
              .in('id', leadIds);

            // Buscar dados dos alunos das vendas para matching
            const vendaIds = vendas.map(v => v.id);
            const { data: alunosVendas } = await supabase
              .from('alunos')
              .select('form_entry_id, nome, email, telefone')
              .in('form_entry_id', vendaIds);
            
            if (leadsData && alunosVendas && alunosVendas.length > 0) {
              // Matching simples por telefone e email (mesma lógica básica do modal)
              agendamentosComprouSemFormEntry.forEach(agendamento => {
                const lead = leadsData.find(l => l.id === agendamento.lead_id);
                if (lead) {
                  const matchingAluno = alunosVendas.find(aluno => {
                    // Normalizar telefones
                    const leadPhone = lead.whatsapp?.replace(/\D/g, '') || '';
                    const alunoPhone = aluno.telefone?.replace(/\D/g, '') || '';
                    
                    // Normalizar emails
                    const leadEmail = lead.email?.toLowerCase().trim() || '';
                    const alunoEmail = aluno.email?.toLowerCase().trim() || '';
                    
                    return (leadPhone && alunoPhone && leadPhone === alunoPhone) ||
                           (leadEmail && alunoEmail && leadEmail === alunoEmail);
                  });
                  
                  if (matchingAluno) {
                    agendamentosMatchingLeads.add(agendamento.id);
                  }
                }
              });
            }
          }
        }

        // Contar por categoria (mesma lógica do modal COM MATCHING)
        let pendentes = 0, compareceram = 0, naoCompareceram = 0;
        
        agendamentos?.forEach(agendamento => {
          switch (agendamento.resultado_reuniao) {
            case 'comprou':
              // Só conta como pendente se NÃO foi convertido globalmente OU por matching de lead
              const jaConvertidoPorFormEntry = agendamento.form_entry_id && convertidasGlobal.has(agendamento.form_entry_id);
              const jaConvertidoPorLead = agendamentosMatchingLeads.has(agendamento.id);
              const jaConvertido = jaConvertidoPorFormEntry || jaConvertidoPorLead;
              
              if (!jaConvertido) {
                pendentes++;
              }
              break;
            case 'compareceu_nao_comprou':
            case 'presente':
            case 'compareceu':
              compareceram++;
              break;
            case 'nao_compareceu':
            case 'ausente':
              naoCompareceram++;
              break;
          }
        });

        detailedResults.push({
          vendedor_id: vendedor.vendedor_id,
          vendedor_name: vendedor.vendedor_name,
          convertidas: vendas?.length || 0,
          pendentes,
          compareceram,
          naoCompareceram,
          total: (vendas?.length || 0) + pendentes + compareceram + naoCompareceram
        });
        
      } catch (error) {
        console.error('Erro ao buscar dados detalhados para', vendedor.vendedor_name, error);
        // Fallback para dados originais
        detailedResults.push(vendedor);
      }
    }
    
    console.log('📊 DADOS DETALHADOS CORRETOS (mesma lógica do modal):', detailedResults);
    setDetailedStatsData(detailedResults);
    setLoadingDetailed(false);
  };

  // Executar busca detalhada quando statsData mudar
  useEffect(() => {
    if (statsData.length > 0) {
      fetchDetailedStats();
    }
  }, [statsData, selectedWeek]);

  // Usar função unificada de cálculo de semana
  const { start: weekStart, end: weekEnd } = getWeekRange(selectedWeek);

  const goToPreviousWeek = () => {
    const previousWeek = new Date(selectedWeek);
    previousWeek.setDate(selectedWeek.getDate() - 7);
    setSelectedWeek(previousWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(selectedWeek);
    nextWeek.setDate(selectedWeek.getDate() + 7);
    setSelectedWeek(nextWeek);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
    setSelectedMonth(new Date());
  };

  const isCurrentWeek = () => {
    const now = new Date();
    const { start: currentStart } = getWeekRange(now);
    return weekStart.getTime() === currentStart.getTime();
  };

  const goToPreviousMonth = () => {
    const previousMonth = new Date(selectedMonth);
    previousMonth.setMonth(selectedMonth.getMonth() - 1);
    setSelectedMonth(previousMonth);
    // Ajustar a semana para o início do mês anterior
    const firstWeekOfMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
    setSelectedWeek(firstWeekOfMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(selectedMonth.getMonth() + 1);
    setSelectedMonth(nextMonth);
    // Ajustar a semana para o início do próximo mês
    const firstWeekOfMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    setSelectedWeek(firstWeekOfMonth);
  };

  console.log('🔍 ReunioesVendedoresChart renderizando com selectedWeek:', selectedWeek);

  // Preparar dados para o gráfico
  const chartData = statsData.map(stats => {
    // Taxa de conversão baseada em reuniões finalizadas
    const reunioesFinalizadas = stats.convertidas + stats.pendentes + stats.compareceram;
    return {
      vendedor: stats.vendedor_name.split(' ')[0], // Apenas primeiro nome
      convertidas: stats.convertidas,
      pendentes: stats.pendentes,
      compareceram: stats.compareceram,
      naoCompareceram: stats.naoCompareceram,
      total: stats.total,
      taxaConversao: reunioesFinalizadas > 0 ? (((stats.convertidas + stats.pendentes) / reunioesFinalizadas) * 100).toFixed(1) : '0'
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-green-600">Convertidas:</span> {data.convertidas}
            </p>
            <p className="text-sm">
              <span className="text-blue-600">Pendentes:</span> {data.pendentes}
            </p>
            <p className="text-sm">
              <span className="text-yellow-600">Compareceram:</span> {data.compareceram}
            </p>
            <p className="text-sm">
              <span className="text-red-600">Não Compareceram:</span> {data.naoCompareceram}
            </p>
            <p className="text-sm font-medium border-t pt-1">
              Total: {data.total} | Taxa: {data.taxaConversao}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resultados das Reuniões por Vendedor</span>
          
          <div className="flex items-center gap-3">
            {/* Filtro de Mês */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-lg shadow-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                ←
              </Button>
              
              <span className="text-sm font-semibold text-white px-3 min-w-[120px] text-center">
                {selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                →
              </Button>
            </div>

            {/* Filtro de Semana */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-orange-600 p-2 rounded-lg shadow-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousWeek}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                ←
              </Button>
              
              <span className="text-sm font-semibold text-white px-3 min-w-[140px] text-center">
                {weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>

              {!isCurrentWeek() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToCurrentWeek}
                  className="text-sm h-8 px-3 text-white hover:bg-white/20 font-medium"
                >
                  Atual
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextWeek}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                →
              </Button>
            </div>
          </div>
        </CardTitle>
        
        <CardDescription>
          Performance dos vendedores nas reuniões agendadas desta semana (quarta a terça)
          {selectedVendedor && selectedVendedor !== 'todos' && ' (filtrado)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState message="Carregando estatísticas..." />
        ) : statsData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">Nenhuma reunião finalizada ainda</p>
              <p className="text-sm">Aguarde os vendedores completarem as reuniões agendadas</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="vendedor" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="convertidas" 
                    name="Convertidas" 
                    fill={COLORS.convertidas}
                    stackId="a"
                  />
                  <Bar 
                    dataKey="pendentes" 
                    name="Pendentes" 
                    fill={COLORS.pendentes}
                    stackId="a"
                  />
                  <Bar 
                    dataKey="compareceram" 
                    name="Compareceram" 
                    fill={COLORS.compareceram}
                    stackId="a"
                  />
                  <Bar 
                    dataKey="naoCompareceram" 
                    name="Não Compareceram" 
                    fill={COLORS.naoCompareceram}
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Resumo por Vendedor - USANDO DADOS CORRETOS */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Resumo Detalhado:</h4>
              <div className="grid gap-3">
                {(loadingDetailed ? statsData : detailedStatsData).map((stats) => {
                  // Taxa de conversão baseada em reuniões finalizadas
                  const reunioesFinalizadas = stats.convertidas + stats.pendentes + stats.compareceram;
                  return (
                    <div key={stats.vendedor_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="font-medium">{stats.vendedor_name}</div>
                      <div className="flex gap-4 text-sm items-center">
                        <span className="text-green-600">{stats.convertidas} convertidas</span>
                        <span className="text-blue-600">{stats.pendentes} pendentes</span>
                        <span className="text-yellow-600">{stats.compareceram} compareceram</span>
                        <span className="text-red-600">{stats.naoCompareceram} não compareceram</span>
                        <span className="font-medium">
                          Taxa: {reunioesFinalizadas > 0 ? (((stats.convertidas + stats.pendentes) / reunioesFinalizadas) * 100).toFixed(1) : 0}%
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModalVendedor({ id: stats.vendedor_id, name: stats.vendedor_name })}
                          className="ml-2"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Modal de Reuniões Detalhadas */}
        {modalVendedor && (
          <VendedorReunioesModal
            vendedorId={modalVendedor.id}
            vendedorName={modalVendedor.name}
            weekDate={selectedWeek}
            isOpen={!!modalVendedor}
            onClose={() => setModalVendedor(null)}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ReunioesVendedoresChart;