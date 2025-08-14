
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, CheckCircle } from 'lucide-react';
import { useUltraSimpleVendas } from '@/hooks/useUltraSimpleVendas';
import LoadingSpinner from '@/components/LoadingSpinner';

const UltraSimpleGerenciarVendas: React.FC = () => {
  const { 
    vendasPendentes, 
    vendasMatriculadas, 
    isLoading, 
    isUpdating, 
    updateStatus 
  } = useUltraSimpleVendas();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="mt-4 text-lg font-medium">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Vendas (Ultra Simples)</CardTitle>
          <CardDescription>
            Versão ultra-simplificada - sem cache complexo
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Vendas Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Vendas Pendentes ({vendasPendentes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendasPendentes.length === 0 ? (
            <p className="text-center py-4 text-gray-500">Nenhuma venda pendente</p>
          ) : (
            <div className="space-y-4">
              {vendasPendentes.map(venda => (
                <div key={venda.id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {venda.aluno?.nome || 'Nome não informado'}
                        </h3>
                        <Badge variant="secondary">Pendente</Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p><strong>Email:</strong> {venda.aluno?.email || 'Não informado'}</p>
                        <p><strong>Curso:</strong> {venda.curso?.nome || 'Não informado'}</p>
                        <p><strong>Pontuação:</strong> {venda.pontuacao_esperada || 0} pts</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => updateStatus(venda.id, 'matriculado')} 
                        disabled={isUpdating}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                        {isUpdating ? 'Aprovando...' : 'Aprovar'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => updateStatus(venda.id, 'desistiu')} 
                        disabled={isUpdating}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                        {isUpdating ? 'Rejeitando...' : 'Rejeitar'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendas Matriculadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Vendas Matriculadas ({vendasMatriculadas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendasMatriculadas.length === 0 ? (
            <p className="text-center py-4 text-gray-500">Nenhuma venda matriculada</p>
          ) : (
            <div className="space-y-4">
              {vendasMatriculadas.map(venda => (
                <div key={venda.id} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold">
                      {venda.aluno?.nome || 'Nome não informado'}
                    </h3>
                    <Badge variant="default">Matriculado</Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p><strong>Email:</strong> {venda.aluno?.email || 'Não informado'}</p>
                    <p><strong>Curso:</strong> {venda.curso?.nome || 'Não informado'}</p>
                    <p><strong>Vendedor:</strong> {venda.vendedor?.name || 'Não informado'}</p>
                    <p><strong>Enviado:</strong> {venda.enviado_em ? new Date(venda.enviado_em).toLocaleDateString('pt-BR') + ' ' + new Date(venda.enviado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Não informado'}</p>
                    {venda.data_assinatura_contrato && (
                      <p><strong>Data de Assinatura do Contrato:</strong> {new Date(venda.data_assinatura_contrato).toLocaleDateString('pt-BR')}</p>
                    )}
                    <p><strong>Pontuação:</strong> {venda.pontuacao_esperada || 0} pts</p>
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

export default UltraSimpleGerenciarVendas;
