import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAvaliacaoSemanal } from '@/hooks/useAvaliacaoSemanal';
import { AvaliacaoSemanalService } from '@/services/vendedores/AvaliacaoSemanalService';
import { AlertTriangle, Calendar, TrendingUp, Users, CheckCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AvaliacaoSemanalVendedor = () => {
  const { 
    minhasAvaliacoes, 
    loadingMinhas, 
    calcularAvaliacao,
    calculandoAvaliacao,
    adicionarObservacao,
    adicionandoObservacao
  } = useAvaliacaoSemanal();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [observacao, setObservacao] = useState('');
  const [editingObservacao, setEditingObservacao] = useState<string | null>(null);

  // Filtrar avaliações do ano selecionado
  const avaliacoesFiltradas = minhasAvaliacoes.filter(av => av.ano === parseInt(selectedYear));

  // Avaliação mais recente
  const avaliacaoRecente = avaliacoesFiltradas[0];

  // Calcular estatísticas
  const estatisticas = avaliacoesFiltradas.reduce((acc, av) => ({
    totalReunioes: acc.totalReunioes + av.total_reunioes_realizadas,
    totalMatriculas: acc.totalMatriculas + av.total_matriculas,
    semanasExcelente: acc.semanasExcelente + (av.classificacao === 'excelente' ? 1 : 0),
    semanasRecuperacao: acc.semanasRecuperacao + (av.classificacao === 'recuperacao' ? 1 : 0)
  }), { totalReunioes: 0, totalMatriculas: 0, semanasExcelente: 0, semanasRecuperacao: 0 });

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
    
    calcularAvaliacao({ vendedorId: '', ano, semana: semanaAtual });
  };

  const handleAdicionarObservacao = (avaliacaoId: string) => {
    if (observacao.trim()) {
      adicionarObservacao({ avaliacaoId, observacao });
      setObservacao('');
      setEditingObservacao(null);
    }
  };

  if (loadingMinhas) {
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
          <h2 className="text-2xl font-bold text-foreground">📊 Avaliação Semanal</h2>
          <p className="text-muted-foreground">Taxa de conversão por reunião realizada</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleCalcularSemanaAtual}
            disabled={calculandoAvaliacao}
            size="sm"
          >
            {calculandoAvaliacao ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-muted-foreground">Reuniões</p>
                <p className="text-lg font-bold">{estatisticas.totalReunioes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Matrículas</p>
                <p className="text-lg font-bold">{estatisticas.totalMatriculas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Semanas Avaliadas</p>
                <p className="text-lg font-bold">{avaliacoesFiltradas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Status Atual */}
      {avaliacaoRecente && (
        <Alert className={avaliacaoRecente.status_risco === 'critico' ? 'border-red-500 bg-red-50' : 
                           avaliacaoRecente.status_risco === 'risco' ? 'border-orange-500 bg-orange-50' : 
                           'border-green-500 bg-green-50'}>
          <AlertTriangle className={`h-4 w-4 ${
            avaliacaoRecente.status_risco === 'critico' ? 'text-red-600' :
            avaliacaoRecente.status_risco === 'risco' ? 'text-orange-600' :
            'text-green-600'
          }`} />
          <AlertDescription className="font-medium">
            {AvaliacaoSemanalService.getStatusRiscoInfo(avaliacaoRecente.status_risco).label} - {' '}
            {AvaliacaoSemanalService.getStatusRiscoInfo(avaliacaoRecente.status_risco).description}
            {avaliacaoRecente.semanas_consecutivas_abaixo_meta > 0 && (
              <span className="block text-sm mt-1">
                {avaliacaoRecente.semanas_consecutivas_abaixo_meta} semana(s) consecutiva(s) abaixo da meta de 30%
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Avaliações */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Histórico de Avaliações - {selectedYear}</h3>
        
        {avaliacoesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="text-center p-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma avaliação encontrada para {selectedYear}</p>
              <Button onClick={handleCalcularSemanaAtual} className="mt-4" size="sm">
                Calcular Semana Atual
              </Button>
            </CardContent>
          </Card>
        ) : (
          avaliacoesFiltradas.map((avaliacao) => {
            const classificacaoInfo = AvaliacaoSemanalService.getClassificacaoInfo(avaliacao);
            const statusInfo = AvaliacaoSemanalService.getStatusRiscoInfo(avaliacao.status_risco);

            return (
              <Card key={avaliacao.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Semana {avaliacao.semana} - {avaliacao.ano}</CardTitle>
                      <CardDescription>
                        {format(new Date(avaliacao.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={classificacaoInfo.color}>
                        {classificacaoInfo.label}
                      </Badge>
                      {avaliacao.status_risco !== 'normal' && (
                        <Badge variant="outline" className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Reuniões</p>
                      <p className="text-lg font-semibold">{avaliacao.total_reunioes_realizadas}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Matrículas</p>
                      <p className="text-lg font-semibold">{avaliacao.total_matriculas}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                      <p className={`text-lg font-semibold ${
                        avaliacao.taxa_conversao >= 30 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {avaliacao.taxa_conversao.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Semanas Consecutivas</p>
                      <p className="text-lg font-semibold">{avaliacao.semanas_consecutivas_abaixo_meta}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Descrição:</p>
                    <p className="text-sm text-muted-foreground">{classificacaoInfo.description}</p>
                    
                    {avaliacao.observacoes && (
                      <div className="mt-3">
                        <p className="text-sm font-medium">Observações:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded mt-1">
                          {avaliacao.observacoes}
                        </p>
                      </div>
                    )}

                    {editingObservacao === avaliacao.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          value={observacao}
                          onChange={(e) => setObservacao(e.target.value)}
                          placeholder="Adicionar observação..."
                          className="resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleAdicionarObservacao(avaliacao.id)}
                            disabled={adicionandoObservacao}
                          >
                            {adicionandoObservacao ? 'Salvando...' : 'Salvar'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setEditingObservacao(null);
                              setObservacao('');
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {!avaliacao.observacoes && editingObservacao !== avaliacao.id && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-3"
                        onClick={() => setEditingObservacao(avaliacao.id)}
                      >
                        Adicionar Observação
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};