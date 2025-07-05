
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import LoadingSpinner from '@/components/LoadingSpinner';

const Matriculas: React.FC = () => {
  const { vendas, isLoading, error } = useAllVendas();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar vendas: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const vendasRejeitadas = vendas.filter(v => v.status === 'desistiu' && v.motivo_pendencia);
  const vendasDesistentes = vendas.filter(v => v.status === 'desistiu' && !v.motivo_pendencia);

  const stats = {
    total: vendas.length,
    matriculados: vendas.filter(v => v.status === 'matriculado').length,
    pendentes: vendas.filter(v => v.status === 'pendente').length,
    rejeitados: vendasRejeitadas.length,
    desistentes: vendasDesistentes.length,
    receitaTotal: vendas.filter(v => v.status === 'matriculado').reduce((sum, v) => sum + (v.pontuacao_esperada || 0), 0) * 100 // Simulando valor em reais
  };

  const getStatusBadgeVariant = (venda: any) => {
    if (venda.status === 'desistiu' && venda.motivo_pendencia) {
      return 'destructive';
    }
    switch (venda.status) {
      case 'matriculado':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'desistiu':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (venda: any) => {
    if (venda.status === 'desistiu' && venda.motivo_pendencia) {
      return 'Rejeitado';
    }
    switch (venda.status) {
      case 'matriculado':
        return 'Matriculado';
      case 'pendente':
        return 'Pendente';
      case 'desistiu':
        return 'Desistiu';
      default:
        return venda.status;
    }
  };

  const getStatusIcon = (venda: any) => {
    if (venda.status === 'desistiu' && venda.motivo_pendencia) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    switch (venda.status) {
      case 'matriculado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'desistiu':
        return <XCircle className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ppgvet-teal">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Todas as vendas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {DataFormattingService.formatCurrency(stats.receitaTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando primeiras vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matrículas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ppgvet-magenta">{stats.matriculados}</div>
            <p className="text-xs text-muted-foreground">
              Alunos matriculados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando validação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejeitados}</div>
            <p className="text-xs text-muted-foreground">
              Rejeitados pela secretaria
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Vendas</CardTitle>
          <CardDescription>
            {vendas.length === 0 
              ? "As vendas aparecerão aqui quando forem enviadas pelos vendedores"
              : `${vendas.length} ${vendas.length === 1 ? 'venda' : 'vendas'} no sistema`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma venda cadastrada ainda.</p>
              <p className="text-sm text-muted-foreground mt-2">
                As vendas dos vendedores aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {vendas.map((venda) => (
                <div key={venda.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(venda)}
                        <h3 className="font-semibold text-lg">{venda.aluno?.nome || 'Nome não informado'}</h3>
                        <Badge variant={getStatusBadgeVariant(venda)}>
                          {getStatusLabel(venda)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Email:</span> {venda.aluno?.email || 'Não informado'}
                        </div>
                        <div>
                          <span className="font-medium">Curso:</span> {venda.curso?.nome || 'Não informado'}
                        </div>
                        <div>
                          <span className="font-medium">Vendedor:</span> {venda.vendedor_id.slice(0, 8)}...
                        </div>
                        <div>
                          <span className="font-medium">Data:</span> {venda.enviado_em ? DataFormattingService.formatDate(venda.enviado_em) : 'Não informada'}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="font-medium">Pontuação:</span> 
                          <span className="ml-1 text-ppgvet-teal font-bold">{venda.pontuacao_esperada || 0} pts</span>
                        </div>
                        {venda.pontuacao_validada && (
                          <div>
                            <span className="font-medium">Validada:</span> 
                            <span className="ml-1 text-green-600 font-bold">{venda.pontuacao_validada} pts</span>
                          </div>
                        )}
                        {venda.observacoes && (
                          <div>
                            <span className="font-medium">Obs:</span> 
                            <span className="ml-1 text-gray-600">{venda.observacoes}</span>
                          </div>
                        )}
                        {venda.motivo_pendencia && (
                          <div>
                            <span className="font-medium">Motivo:</span> 
                            <span className="ml-1 text-red-600">{venda.motivo_pendencia}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Matriculas;
