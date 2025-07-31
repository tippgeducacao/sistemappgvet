import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAvaliacaoSemanal, useAvaliacoesSemanaisFiltradas } from '@/hooks/useAvaliacaoSemanal';
import { AvaliacaoSemanalService } from '@/services/vendedores/AvaliacaoSemanalService';
import { 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  RefreshCw,
  UserX,
  Award,
  Target
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AvaliacoesSemanaisAdmin = () => {
  const { 
    todasAvaliacoes,
    vendedoresEmRisco,
    loadingTodas,
    loadingRisco,
    calcularAvaliacoesDaSemana,
    calculandoSemana
  } = useAvaliacaoSemanal();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedWeek, setSelectedWeek] = useState('');

  // Usar hook filtrado se houver filtros
  const { data: avaliacoesFiltradas, isLoading: loadingFiltradas } = useAvaliacoesSemanaisFiltradas(
    parseInt(selectedYear),
    selectedWeek ? parseInt(selectedWeek) : undefined
  );

  // Usar dados filtrados se disponíveis, senão usar todas as avaliações
  const avaliacoes = avaliacoesFiltradas && avaliacoesFiltradas.length > 0 
    ? avaliacoesFiltradas 
    : todasAvaliacoes.filter(av => av.ano === parseInt(selectedYear));

  const isLoading = loadingTodas || loadingFiltradas;

  // Estatísticas gerais
  const vendedoresUnicos = new Set(avaliacoes.map(av => av.vendedor_id));
  const totalReunioes = avaliacoes.reduce((sum, av) => sum + av.total_reunioes_realizadas, 0);
  const totalMatriculas = avaliacoes.reduce((sum, av) => sum + av.total_matriculas, 0);
  const vendedoresExcelentes = avaliacoes.filter(av => av.classificacao === 'excelente').length;
  const vendedoresRecuperacao = avaliacoes.filter(av => av.classificacao === 'recuperacao').length;
  const vendedoresCriticos = avaliacoes.filter(av => av.status_risco === 'critico').length;

  const estatisticas = {
    totalVendedores: vendedoresUnicos.size,
    totalReunioes,
    totalMatriculas,
    vendedoresExcelentes,
    vendedoresRecuperacao,
    vendedoresCriticos
  };

  const taxaConversaoGeral = estatisticas.totalReunioes > 0 
    ? (estatisticas.totalMatriculas / estatisticas.totalReunioes * 100).toFixed(1)
    : '0';

  const handleCalcularSemanaAtual = () => {
    const agora = new Date();
    const ano = agora.getFullYear();
    
    // Calcular número da semana atual (aproximado)
    const inicioAno = new Date(ano, 0, 1);
    const diasPassados = Math.floor((agora.getTime() - inicioAno.getTime()) / (24 * 60 * 60 * 1000));
    const semanaAtual = Math.ceil(diasPassados / 7);
    
    calcularAvaliacoesDaSemana({ ano, semana: semanaAtual });
  };

  // Agrupar por vendedor para mostrar o status atual
  const vendedoresPorStatus = avaliacoes.reduce((acc, av) => {
    const vendedorId = av.vendedor_id;
    if (!acc[vendedorId] || new Date(av.created_at) > new Date(acc[vendedorId].created_at)) {
      acc[vendedorId] = av;
    }
    return acc;
  }, {} as Record<string, typeof avaliacoes[0]>);

  const vendedoresComStatus = Object.values(vendedoresPorStatus).sort((a, b) => {
    // Ordenar por risco primeiro, depois por taxa de conversão
    if (a.status_risco === 'critico' && b.status_risco !== 'critico') return -1;
    if (b.status_risco === 'critico' && a.status_risco !== 'critico') return 1;
    if (a.status_risco === 'risco' && b.status_risco === 'normal') return -1;
    if (b.status_risco === 'risco' && a.status_risco === 'normal') return 1;
    return a.taxa_conversao - b.taxa_conversao;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando avaliações...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">📊 Avaliações Semanais - Gestão</h2>
          <p className="text-muted-foreground">Monitoramento da taxa de conversão por reunião de todos os vendedores</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Semana" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {Array.from({ length: 52 }, (_, i) => i + 1).map(week => (
                <SelectItem key={week} value={week.toString()}>
                  Semana {week}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleCalcularSemanaAtual}
            disabled={calculandoSemana}
            size="sm"
          >
            {calculandoSemana ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Calcular Semana
          </Button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Taxa Geral</p>
                <p className="text-lg font-bold">{taxaConversaoGeral}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Vendedores</p>
                <p className="text-lg font-bold">{estatisticas.totalVendedores}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Excelentes</p>
                <p className="text-lg font-bold text-green-600">{estatisticas.vendedoresExcelentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Recuperação</p>
                <p className="text-lg font-bold text-orange-600">{estatisticas.vendedoresRecuperacao}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Críticos</p>
                <p className="text-lg font-bold text-red-600">{estatisticas.vendedoresCriticos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Matrículas</p>
                <p className="text-lg font-bold">{estatisticas.totalMatriculas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Vendedores em Risco */}
      {vendedoresEmRisco.length > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <span className="font-medium text-red-800">
              {vendedoresEmRisco.length} vendedor(es) em situação de risco ou crítica
            </span>
            <div className="mt-2 text-sm">
              {vendedoresEmRisco.slice(0, 3).map(v => (
                <span key={v.id} className="inline-block mr-4">
                  • {v.vendedor?.name} ({v.semanas_consecutivas_abaixo_meta} semanas)
                </span>
              ))}
              {vendedoresEmRisco.length > 3 && (
                <span>... e mais {vendedoresEmRisco.length - 3} vendedor(es)</span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabela de Vendedores e Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle>Status Atual dos Vendedores</CardTitle>
          <CardDescription>
            Última avaliação de cada vendedor no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendedoresComStatus.length === 0 ? (
            <div className="text-center p-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma avaliação encontrada para os filtros selecionados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Semana</TableHead>
                  <TableHead>Reuniões</TableHead>
                  <TableHead>Matrículas</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Consecutivas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendedoresComStatus.map((avaliacao) => {
                  const classificacaoInfo = AvaliacaoSemanalService.getClassificacaoInfo(avaliacao);
                  const statusInfo = AvaliacaoSemanalService.getStatusRiscoInfo(avaliacao.status_risco);

                  return (
                    <TableRow key={avaliacao.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={avaliacao.vendedor?.photo_url} />
                            <AvatarFallback>
                              {avaliacao.vendedor?.name?.split(' ').map(n => n[0]).join('') || 'V'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{avaliacao.vendedor?.name || 'Nome não encontrado'}</p>
                            <p className="text-xs text-muted-foreground">{avaliacao.vendedor?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">S{avaliacao.semana}</p>
                          <p className="text-xs text-muted-foreground">{avaliacao.ano}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{avaliacao.total_reunioes_realizadas}</TableCell>
                      <TableCell className="text-center">{avaliacao.total_matriculas}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          avaliacao.taxa_conversao >= 30 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {avaliacao.taxa_conversao.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={classificacaoInfo.color}>
                          {avaliacao.classificacao === 'excelente' ? '🟢 Excelente' : '🔴 Recuperação'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={avaliacao.semanas_consecutivas_abaixo_meta >= 4 ? 'text-red-600 font-bold' : 
                                       avaliacao.semanas_consecutivas_abaixo_meta >= 2 ? 'text-orange-600 font-medium' : ''}>
                          {avaliacao.semanas_consecutivas_abaixo_meta}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Regras da Avaliação */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Regras de Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-700">🟢 Vendedor Excelente</h4>
              <p className="text-sm text-muted-foreground">Taxa de conversão ≥ 30%</p>
              <p className="text-sm">• Mantém leads qualificados</p>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-red-700">🔴 Plano de Recuperação</h4>
              <p className="text-sm text-muted-foreground">Taxa de conversão &lt; 30%</p>
              <p className="text-sm">• Acompanhamento com coordenador e supervisor</p>
              <p className="text-sm">• Avaliação de roteiro e gaps</p>
              <p className="text-sm font-medium text-red-600">
                • Se mantido por 4 semanas consecutivas: Desligamento do time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};