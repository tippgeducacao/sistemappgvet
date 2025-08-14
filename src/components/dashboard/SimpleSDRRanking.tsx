import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useNiveis } from '@/hooks/useNiveis';
import { useAgendamentosLeads } from '@/hooks/useAgendamentosLeads';
import { getVendaPeriod } from '@/utils/semanaUtils';

interface SimpleSDRStats {
  id: string;
  nome: string;
  photo_url?: string;
  tipo: 'inbound' | 'outbound';
  vendasCursos: number; // Vendas de cursos que o SDR fez
  reunioesRealizadas: number; // Reuniões com resultado positivo
  metaVendasCursos: number; // Meta de vendas de cursos
  metaReunioes: number; // Meta de reuniões
  nivel: string;
}

const SimpleSDRRanking: React.FC = () => {
  const { vendas } = useAllVendas();
  const { vendedores } = useVendedores();
  const { niveis } = useNiveis();
  const { data: agendamentosData } = useAgendamentosLeads();
  const agendamentos = agendamentosData || [];

  const [selectedPeriod, setSelectedPeriod] = useState<'semana' | 'mes' | 'ano'>('semana');

  // Calcular período da semana atual (quarta a terça)
  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - ((hoje.getDay() + 4) % 7)); // Quarta-feira
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6); // Terça-feira

  // Filtrar apenas SDRs ativos
  const sdrs = useMemo(() => {
    return vendedores.filter(v => 
      (v.user_type === 'sdr') && 
      v.ativo
    );
  }, [vendedores]);

  // Calcular estatísticas simples
  const sdrStats = useMemo(() => {
    const hoje = new Date();
    
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - ((hoje.getDay() + 4) % 7)); // Quarta-feira
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6); // Terça-feira

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

const inicioAno = new Date(hoje.getFullYear(), 0, 1);
const fimAno = new Date(hoje.getFullYear(), 11, 31);

// Usar mesma regra de "mês por semana (qua-ter)" da TV
const { mes: mesAtualSemana, ano: anoAtualSemana } = getVendaPeriod(hoje);

    return sdrs.map(sdr => {
      const isInbound = sdr.nivel?.includes('inbound');
      
      // Buscar configuração do nível
      const nivelConfig = niveis.find(n => 
        n.nivel === (sdr.nivel || 'junior') && 
        n.tipo_usuario === 'sdr'
      );

      // 1. VENDAS DE CURSOS que o SDR fez diretamente
      const vendasSemana = vendas.filter(v => {
        if (v.vendedor_id !== sdr.id || v.status !== 'matriculado') return false;
        
        // Priorizar data_assinatura_contrato
        let dataVenda: Date;
        if (v.data_assinatura_contrato) {
          dataVenda = new Date(v.data_assinatura_contrato);
        } else {
          dataVenda = v.data_aprovacao 
            ? new Date(v.data_aprovacao)
            : new Date(v.enviado_em);
        }
        
        return dataVenda >= inicioSemana && dataVenda <= fimSemana;
      }).length;

const vendasMes = vendas.filter(v => {
        if (v.vendedor_id !== sdr.id || v.status !== 'matriculado') return false;
        // Priorizar data_assinatura_contrato
        let dataVenda: Date;
        if (v.data_assinatura_contrato) {
          dataVenda = new Date(v.data_assinatura_contrato);
        } else {
          dataVenda = v.data_aprovacao 
            ? new Date(v.data_aprovacao)
            : new Date(v.enviado_em);
        }
        const { mes, ano } = getVendaPeriod(dataVenda);
        return mes === mesAtualSemana && ano === anoAtualSemana;
      }).length;

      const vendasAno = vendas.filter(v => {
        if (v.vendedor_id !== sdr.id || v.status !== 'matriculado') return false;
        
        // Priorizar data_assinatura_contrato
        let dataVenda: Date;
        if (v.data_assinatura_contrato) {
          dataVenda = new Date(v.data_assinatura_contrato);
        } else {
          dataVenda = v.data_aprovacao 
            ? new Date(v.data_aprovacao)
            : new Date(v.enviado_em);
        }
        
        return dataVenda >= inicioAno && dataVenda <= fimAno;
      }).length;

      // 2. REUNIÕES REALIZADAS (comprou ou compareceu_nao_comprou)
      const reunioesSemana = agendamentos.filter(a => {
        const dataAgendamento = new Date(a.data_agendamento);
        return a.sdr_id === sdr.id && 
               dataAgendamento >= inicioSemana && 
               dataAgendamento <= fimSemana &&
               (a.resultado_reuniao === 'comprou' || a.resultado_reuniao === 'compareceu_nao_comprou');
      }).length;

const reunioesMes = agendamentos.filter(a => {
        const dataAgendamento = new Date(a.data_agendamento);
        const { mes, ano } = getVendaPeriod(dataAgendamento);
        return a.sdr_id === sdr.id && 
               mes === mesAtualSemana && 
               ano === anoAtualSemana &&
               (a.resultado_reuniao === 'comprou' || a.resultado_reuniao === 'compareceu_nao_comprou');
      }).length;

      const reunioesAno = agendamentos.filter(a => {
        const dataAgendamento = new Date(a.data_agendamento);
        return a.sdr_id === sdr.id && 
               dataAgendamento >= inicioAno && 
               dataAgendamento <= fimAno &&
               (a.resultado_reuniao === 'comprou' || a.resultado_reuniao === 'compareceu_nao_comprou');
      }).length;

      // Metas baseadas no nível
const metaVendasCursos = nivelConfig?.meta_vendas_cursos || 8;
      const metaReunioes = nivelConfig?.meta_semanal_inbound || 55;

      // Valores do período selecionado
      let vendasCursos = vendasSemana;
      let reunioesRealizadas = reunioesSemana;
      let metaVendasPeriodo = metaVendasCursos;
      let metaReunioesPeriodo = metaReunioes;

      if (selectedPeriod === 'mes') {
        vendasCursos = vendasMes;
        reunioesRealizadas = reunioesMes;
        metaVendasPeriodo = metaVendasCursos * 4;
        metaReunioesPeriodo = metaReunioes * 4;
      } else if (selectedPeriod === 'ano') {
        vendasCursos = vendasAno;
        reunioesRealizadas = reunioesAno;
        metaVendasPeriodo = metaVendasCursos * 52;
        metaReunioesPeriodo = metaReunioes * 52;
      }

      return {
        id: sdr.id,
        nome: sdr.name,
        photo_url: sdr.photo_url,
        tipo: (isInbound ? 'inbound' : 'outbound') as 'inbound' | 'outbound',
        vendasCursos,
        reunioesRealizadas,
        metaVendasCursos: metaVendasPeriodo,
        metaReunioes: metaReunioesPeriodo,
        nivel: sdr.nivel || 'junior'
      };
    });
  }, [sdrs, vendas, agendamentos, niveis, selectedPeriod]);

  // Ranking ordenado por vendas de cursos
  const ranking = useMemo(() => {
    return [...sdrStats].sort((a, b) => {
      if (a.vendasCursos !== b.vendasCursos) {
        return b.vendasCursos - a.vendasCursos;
      }
      return a.nome.localeCompare(b.nome);
    });
  }, [sdrStats]);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="h-5 w-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getSDRColor = (tipo: 'inbound' | 'outbound') => {
    return tipo === 'inbound' ? 'bg-blue-500' : 'bg-green-500';
  };

  const periodLabels = {
    semana: 'Semana Atual',
    mes: 'Mês Atual',
    ano: 'Ano Atual'
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ranking de SDRs
            </CardTitle>
            <CardDescription>
              Vendas de cursos - {periodLabels[selectedPeriod]}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
        </div>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum SDR encontrado
          </div>
        ) : (
          <div className="space-y-4">
            {ranking.map((sdr, index) => {
              const position = index + 1;
              const progressoVendas = (sdr.vendasCursos / sdr.metaVendasCursos) * 100;
              const progressoReunioes = (sdr.reunioesRealizadas / sdr.metaReunioes) * 100;

              return (
                <div 
                  key={sdr.id} 
                  className="flex items-center space-x-4 p-4 border rounded-lg bg-background"
                >
                  {/* Posição */}
                  <div className="flex-shrink-0">
                    {getPositionIcon(position)}
                  </div>

                  {/* Avatar e Nome */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={sdr.photo_url} alt={sdr.nome} />
                      <AvatarFallback>
                        {sdr.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{sdr.nome}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge 
                          variant="outline" 
                          className={`${getSDRColor(sdr.tipo)} text-white border-0`}
                        >
                          {sdr.tipo === 'inbound' ? 'Inbound' : 'Outbound'}
                        </Badge>
                        <span className="text-xs">{sdr.nivel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vendas de Cursos */}
                  <div className="text-center min-w-[100px]">
                    <div className="text-lg font-bold text-blue-600">
                      {sdr.vendasCursos}
                    </div>
                    <p className="text-xs text-muted-foreground">vendas cursos</p>
                    <div className="w-20 mx-auto mt-1">
                      <Progress value={Math.min(progressoVendas, 100)} className="h-2" />
                      <p className="text-xs text-center mt-1">
                        {sdr.vendasCursos}/{sdr.metaVendasCursos}
                      </p>
                    </div>
                  </div>

                  {/* Reuniões Realizadas */}
                  <div className="text-center min-w-[100px]">
                    <div className="text-lg font-bold text-green-600">
                      {sdr.reunioesRealizadas}
                    </div>
                    <p className="text-xs text-muted-foreground">reuniões</p>
                    <div className="w-20 mx-auto mt-1">
                      <Progress value={Math.min(progressoReunioes, 100)} className="h-2" />
                      <p className="text-xs text-center mt-1">
                        {sdr.reunioesRealizadas}/{sdr.metaReunioes}
                      </p>
                    </div>
                  </div>

                  {/* Pontuação Ontem e Hoje */}
                  <div className="text-center min-w-[120px]">
                    {(() => {
                      // Calcular pontuação de ontem
                      const ontem = new Date();
                      ontem.setDate(ontem.getDate() - 1);
                      const startOfYesterday = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate());
                      const endOfYesterday = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59, 59);
                      
                      const pontosOntem = vendas.filter(venda => {
                        if (venda.vendedor_id !== sdr.id || venda.status !== 'matriculado') return false;
                        // Para vendas matriculadas, usar data_assinatura_contrato, senão usar enviado_em
                        let vendaDate: Date;
                        if (venda.status === 'matriculado' && venda.data_assinatura_contrato) {
                          vendaDate = new Date(venda.data_assinatura_contrato);
                        } else {
                          vendaDate = new Date(venda.enviado_em);
                        }
                        return vendaDate >= startOfYesterday && vendaDate <= endOfYesterday;
                      }).reduce((sum, venda) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
                      
                      // Calcular pontuação de hoje
                      const hoje = new Date();
                      const startOfToday = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                      const endOfToday = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
                      
                      const pontosHoje = vendas.filter(venda => {
                        if (venda.vendedor_id !== sdr.id || venda.status !== 'matriculado') return false;
                        // Para vendas matriculadas, usar data_assinatura_contrato, senão usar enviado_em
                        let vendaDate: Date;
                        if (venda.status === 'matriculado' && venda.data_assinatura_contrato) {
                          vendaDate = new Date(venda.data_assinatura_contrato);
                        } else {
                          vendaDate = new Date(venda.enviado_em);
                        }
                        return vendaDate >= startOfToday && vendaDate <= endOfToday;
                      }).reduce((sum, venda) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
                      
                      return (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Ontem:</p>
                            <div className="text-sm font-bold text-blue-600">{pontosOntem.toFixed(0)} pts</div>
                            <div className="w-20 mx-auto">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: pontosOntem > 0 ? `${Math.min(pontosOntem * 10, 100)}%` : '2px' }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Hoje:</p>
                            <div className="text-sm font-bold text-green-600">{pontosHoje.toFixed(0)} pts</div>
                            <div className="w-20 mx-auto">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: pontosHoje > 0 ? `${Math.min(pontosHoje * 10, 100)}%` : '2px' }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleSDRRanking;