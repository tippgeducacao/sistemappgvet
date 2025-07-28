import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Calendar, Target, TrendingUp, History } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useNiveis } from '@/hooks/useNiveis';
import { useAgendamentosSDR } from '@/hooks/useAgendamentosSDR';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SDRHistoryModal from './SDRHistoryModal';

interface SDRStats {
  id: string;
  nome: string;
  photo_url?: string;
  tipo: 'inbound' | 'outbound';
  pontosVendas: number; // 1 ponto por curso vendido
  metaReunioesSemanal: number; // Meta de reuniões
  metaReunioesdiaria: number; // Meta diária de reuniões
  metaVendasSemanal: number; // Sempre 10 pontos
  agendamentosHoje: number;
  agendamentosSemana: number;
  nivel: string;
  pontuacaoEvoluicao: number; // Para evolução de carreira (0-120)
}

const SDRRanking: React.FC = () => {
  const { vendas } = useAllVendas();
  const { vendedores } = useVendedores();
  const { niveis } = useNiveis();
  const { agendamentos = [] } = useAgendamentosSDR();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'semana' | 'mes' | 'ano'>('semana');
  const [showHistory, setShowHistory] = useState(false);

  // Filtrar apenas SDRs ativos
  const sdrs = useMemo(() => {
    return vendedores.filter(v => 
      (v.user_type === 'sdr_inbound' || v.user_type === 'sdr_outbound') && 
      v.ativo
    );
  }, [vendedores]);

  // Calcular estatísticas de cada SDR
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

    return sdrs.map(sdr => {
      // Determinar se é inbound ou outbound baseado no nível
      const isInbound = sdr.nivel?.includes('inbound') || false;
      const isOutbound = sdr.nivel?.includes('outbound') || false;
      
      // Buscar configuração do nível
      const nivelConfig = niveis.find(n => n.nivel === sdr.nivel);

      // Vendas de cursos (cada curso = 1 ponto para SDR)
      const vendasSemana = vendas.filter(v => {
        const dataVenda = new Date(v.enviado_em);
        return v.vendedor_id === sdr.id && 
               v.status === 'matriculado' &&
               dataVenda >= inicioSemana && 
               dataVenda <= fimSemana;
      }).length; // Cada venda = 1 ponto

      const vendasMes = vendas.filter(v => {
        const dataVenda = new Date(v.enviado_em);
        return v.vendedor_id === sdr.id && 
               v.status === 'matriculado' &&
               dataVenda >= inicioMes && 
               dataVenda <= fimMes;
      }).length;

      const vendasAno = vendas.filter(v => {
        const dataVenda = new Date(v.enviado_em);
        return v.vendedor_id === sdr.id && 
               v.status === 'matriculado' &&
               dataVenda >= inicioAno && 
               dataVenda <= fimAno;
      }).length;

      // Agendamentos hoje
      const agendamentosHoje = agendamentos.filter(a => {
        const dataAgendamento = new Date(a.data_agendamento);
        return a.sdr_id === sdr.id && 
               dataAgendamento.toDateString() === hoje.toDateString();
      }).length;

      // Agendamentos na semana
      const agendamentosSemana = agendamentos.filter(a => {
        const dataAgendamento = new Date(a.data_agendamento);
        return a.sdr_id === sdr.id && 
               dataAgendamento >= inicioSemana && 
               dataAgendamento <= fimSemana;
      }).length;

      // Metas baseadas no tipo de SDR (reuniões, não vendas)
      const metaSemanaltReunioes = isInbound ? 
        (nivelConfig?.meta_semanal_inbound || 10) : 
        (nivelConfig?.meta_semanal_outbound || 10);

      const metaDiariaReunioes = Math.ceil(metaSemanaltReunioes / 7);

      // Meta fixa de pontos por vendas de cursos (sempre 10 pontos por semana)
      const metaSemanaltVendas = 10;

      // Calcular pontuação para evolução (baseada em vendas totais)
      const pontuacaoEvoluicao = Math.min(vendasAno, 120); // Máximo 120 pontos

      // Pontos do período selecionado
      let pontosVendas = vendasSemana;
      if (selectedPeriod === 'mes') pontosVendas = vendasMes;
      if (selectedPeriod === 'ano') pontosVendas = vendasAno;

      return {
        id: sdr.id,
        nome: sdr.name,
        photo_url: sdr.photo_url,
        tipo: isInbound ? 'inbound' : 'outbound',
        pontosVendas,
        metaReunioesSemanal: metaSemanaltReunioes,
        metaReunioesdiaria: metaDiariaReunioes,
        metaVendasSemanal: metaSemanaltVendas,
        agendamentosHoje,
        agendamentosSemana,
        nivel: sdr.nivel || 'junior',
        pontuacaoEvoluicao
      };
    });
  }, [sdrs, vendas, agendamentos, niveis, selectedPeriod]);

  // Ranking ordenado por pontos de vendas
  const ranking = useMemo(() => {
    return [...sdrStats].sort((a, b) => {
      if (a.pontosVendas !== b.pontosVendas) {
        return b.pontosVendas - a.pontosVendas;
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

  const getSDRColorText = (tipo: 'inbound' | 'outbound') => {
    return tipo === 'inbound' ? 'text-blue-600' : 'text-green-600';
  };

  const getEvolutionLevel = (pontuacao: number) => {
    if (pontuacao >= 120) return 'Pronto para Vendedor';
    if (pontuacao >= 80) return 'Sênior';
    if (pontuacao >= 40) return 'Pleno';
    return 'Júnior';
  };

  const getEvolutionProgress = (pontuacao: number) => {
    return Math.min((pontuacao / 120) * 100, 100);
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
              Pontuação por vendas de cursos - {periodLabels[selectedPeriod]}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Histórico
            </Button>
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
              const progressoMeta = selectedPeriod === 'semana' ? 
                (sdr.pontosVendas / sdr.metaVendasSemanal) * 100 : 
                selectedPeriod === 'mes' ?
                (sdr.pontosVendas / (sdr.metaVendasSemanal * 4)) * 100 :
                (sdr.pontosVendas / (sdr.metaVendasSemanal * 52)) * 100;

              return (
                <div key={sdr.id} className="flex items-center space-x-4 p-4 bg-background border rounded-lg">
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
                          className={`${getSDRColor(sdr.tipo as 'inbound' | 'outbound')} text-white border-0`}
                        >
                          {sdr.tipo === 'inbound' ? 'Inbound' : 'Outbound'}
                        </Badge>
                        <span className="text-xs">{sdr.nivel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pontuação */}
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getSDRColorText(sdr.tipo as 'inbound' | 'outbound')}`}>
                        {sdr.pontosVendas}
                      </span>
                      <span className="text-sm text-muted-foreground">pts</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Meta: {selectedPeriod === 'semana' ? sdr.metaVendasSemanal : 
                            selectedPeriod === 'mes' ? sdr.metaVendasSemanal * 4 :
                            sdr.metaVendasSemanal * 52}
                    </p>
                  </div>

                  {/* Progresso da Meta */}
                  <div className="w-24">
                    <Progress value={Math.min(progressoMeta, 100)} className="h-2" />
                    <p className="text-xs text-center mt-1 text-muted-foreground">
                      {Math.round(progressoMeta)}%
                    </p>
                  </div>

                  {/* Agendamentos */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{sdr.agendamentosHoje}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">hoje</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center gap-1 text-sm">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">{sdr.agendamentosSemana}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">semana</p>
                  </div>

                  {/* Evolução de Carreira */}
                  <div className="text-right min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {sdr.pontuacaoEvoluicao}/120
                      </span>
                    </div>
                    <Progress value={getEvolutionProgress(sdr.pontuacaoEvoluicao)} className="h-1 mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {getEvolutionLevel(sdr.pontuacaoEvoluicao)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Modal de Histórico */}
        <SDRHistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      </CardContent>
    </Card>
  );
};

export default SDRRanking;