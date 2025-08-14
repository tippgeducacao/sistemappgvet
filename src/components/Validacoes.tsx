import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, Clock, Database, AlertCircle } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { VendaValidationService } from '@/services/validation/VendaValidationService';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
const Validacoes: React.FC = () => {
  const {
    vendas,
    isLoading,
    error
  } = useAllVendas();
  const queryClient = useQueryClient();
  const {
    toast
  } = useToast();
  if (isLoading) {
    return <div className="space-y-6">
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="mt-4 text-lg font-medium">Carregando vendas...</p>
          <p className="text-sm text-muted-foreground">Buscando todas as vendas no banco de dados</p>
        </div>
      </div>;
  }
  if (error) {
    return <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Erro ao carregar vendas</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          <Button onClick={() => queryClient.invalidateQueries({
          queryKey: ['all-vendas']
        })} className="mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>;
  }
  console.log('🖥️ COMPONENTE VALIDAÇÕES - Vendas recebidas:', vendas?.length || 0);
  console.log('🖥️ Dados completos das vendas:', vendas);
  const vendasPendentes = vendas.filter(v => v.status === 'pendente');
  const vendasMatriculadas = vendas.filter(v => v.status === 'matriculado');
  const vendasRejeitadas = vendas.filter(v => v.status === 'desistiu');
  const stats = {
    total: vendas.length,
    pendentes: vendasPendentes.length,
    aprovadas: vendasMatriculadas.length,
    rejeitadas: vendasRejeitadas.length
  };
  const handleAprovar = async (vendaId: string) => {
    try {
      await VendaValidationService.aprovarVenda(vendaId);
      await queryClient.invalidateQueries({
        queryKey: ['all-vendas']
      });
      toast({
        title: "Venda Aprovada",
        description: "A venda foi aprovada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao aprovar venda:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar a venda. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  const handleRejeitar = async (vendaId: string) => {
    try {
      await VendaValidationService.rejeitarVenda(vendaId);
      await queryClient.invalidateQueries({
        queryKey: ['all-vendas']
      });
      toast({
        title: "Venda Rejeitada",
        description: "A venda foi rejeitada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao rejeitar venda:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar a venda. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  return <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ppgvet-teal">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Todas as vendas no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              Aguardando implementação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matrículas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ppgvet-magenta">{stats.aprovadas}</div>
            <p className="text-xs text-muted-foreground">
              Vendas aprovadas
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
      </div>

      {/* Card de Debug Detalhado */}
      <Card className="bg-blue-50 border-blue-200">
        
        
      </Card>

      {/* Mensagem se não há vendas */}
      {vendas.length === 0 && <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Nenhuma Venda Encontrada
              </h3>
              <p className="text-yellow-700 mb-4">
                O sistema não encontrou vendas no banco de dados. Isso pode indicar:
              </p>
              <ul className="text-left text-sm text-yellow-700 space-y-1 max-w-md mx-auto">
                <li>• As vendas não estão sendo salvas corretamente</li>
                <li>• Problema de permissão no banco de dados</li>
                <li>• Os vendedores ainda não enviaram vendas</li>
              </ul>
              <Button onClick={() => queryClient.invalidateQueries({
            queryKey: ['all-vendas']
          })} className="mt-4" variant="outline">
                Recarregar Dados
              </Button>
            </div>
          </CardContent>
        </Card>}

      {/* Vendas Pendentes de Validação */}
      {vendasPendentes.length > 0 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Vendas Pendentes de Validação
            </CardTitle>
            <CardDescription>
              {vendasPendentes.length} {vendasPendentes.length === 1 ? 'venda' : 'vendas'} aguardando sua aprovação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendasPendentes.map(venda => <div key={venda.id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{venda.aluno?.nome || 'Nome não informado'}</h3>
                        <Badge variant="secondary">Pendente</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Email:</span> {venda.aluno?.email || 'Não informado'}
                        </div>
                        <div>
                          <span className="font-medium">Curso:</span> {venda.curso?.nome || 'Não informado'}
                        </div>
                        <div>
                          <span className="font-medium">Data:</span> {venda.enviado_em ? DataFormattingService.formatDate(venda.enviado_em) : 'Não informada'}
                        </div>
                        {venda.data_assinatura_contrato && (
                          <div>
                            <span className="font-medium">Data de Assinatura do Contrato:</span> {DataFormattingService.formatDate(venda.data_assinatura_contrato)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="font-medium">Pontuação:</span> 
                          <span className="ml-1 text-ppgvet-teal font-bold">{venda.pontuacao_esperada || 0} pts</span>
                        </div>
                        <div>
                          <span className="font-medium">Vendedor:</span> 
                          <span className="ml-1 text-gray-600">{venda.vendedor?.name || venda.vendedor_id}</span>
                        </div>
                        {venda.observacoes && <div>
                            <span className="font-medium">Observações:</span> 
                            <span className="ml-1 text-gray-600">{venda.observacoes}</span>
                          </div>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleAprovar(venda.id)} className="text-green-600 hover:text-green-700">
                        <Check className="h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRejeitar(venda.id)} className="text-red-600 hover:text-red-700">
                        <X className="h-4 w-4" />
                        Rejeitar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>}

      {/* Histórico de Todas as Vendas */}
      {vendas.length > 0 && <Card>
          <CardHeader>
            <CardTitle>Histórico Completo de Vendas</CardTitle>
            <CardDescription>
              {vendas.length} {vendas.length === 1 ? 'venda' : 'vendas'} encontradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendas.map((venda, index) => <div key={venda.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">#{index + 1}</span>
                        <h3 className="font-semibold text-lg">{venda.aluno?.nome || 'Nome não informado'}</h3>
                        <Badge variant={venda.status === 'matriculado' ? 'default' : venda.status === 'pendente' ? 'secondary' : 'destructive'}>
                          {venda.status === 'matriculado' ? 'Aprovada' : venda.status === 'pendente' ? 'Pendente' : 'Rejeitada'}
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
                          <span className="font-medium">Vendedor:</span> {venda.vendedor?.name || venda.vendedor_id}
                        </div>
                        <div>
                          <span className="font-medium">Data:</span> {venda.enviado_em ? DataFormattingService.formatDate(venda.enviado_em) : 'Não informada'}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="font-medium">ID:</span> 
                          <span className="ml-1 font-mono text-xs">{venda.id}</span>
                        </div>
                        <div>
                          <span className="font-medium">Pontuação:</span> 
                          <span className="ml-1 text-ppgvet-teal font-bold">{venda.pontuacao_esperada || 0} pts</span>
                        </div>
                        {venda.pontuacao_validada && <div>
                            <span className="font-medium">Validada:</span> 
                            <span className="ml-1 text-green-600 font-bold">{venda.pontuacao_validada} pts</span>
                          </div>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default Validacoes;