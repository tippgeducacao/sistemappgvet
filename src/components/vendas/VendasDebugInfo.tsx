
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bug, Database, Users, CheckCircle } from 'lucide-react';
import type { VendaCompleta } from '@/hooks/useVendas';

interface VendasDebugInfoProps {
  vendas: VendaCompleta[];
  isLoading?: boolean;
  error?: Error | null;
}

const VendasDebugInfo: React.FC<VendasDebugInfoProps> = ({ vendas, isLoading, error }) => {
  const vendasPorStatus = vendas.reduce((acc, venda) => {
    acc[venda.status] = (acc[venda.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Bug className="h-5 w-5" />
          Debug - Estado do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status de Carregamento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="text-sm">
              <strong>Carregando:</strong> {isLoading ? 'Sim' : 'Não'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm">
              <strong>Total Vendas:</strong> {vendas.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm">
              <strong>Erro:</strong> {error ? 'Sim' : 'Não'}
            </span>
          </div>
        </div>

        {/* Distribuição por Status */}
        <div>
          <h4 className="font-medium text-blue-800 mb-2">Vendas por Status:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(vendasPorStatus).map(([status, count]) => (
              <Badge key={status} variant="outline" className="border-blue-300">
                {status}: {count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Últimas Vendas */}
        <div>
          <h4 className="font-medium text-blue-800 mb-2">Últimas 3 Vendas:</h4>
          <div className="space-y-2">
            {vendas.slice(0, 3).map((venda) => (
              <div key={venda.id} className="text-sm bg-white p-2 rounded border">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">#{venda.id.substring(0, 8)}</span>
                  <Badge variant={venda.status === 'matriculado' ? 'default' : 'secondary'}>
                    {venda.status}
                  </Badge>
                  <span>{venda.aluno?.nome || 'Sem nome'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informações de Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <h4 className="font-medium text-red-800 mb-1">Erro Detectado:</h4>
            <p className="text-sm text-red-700">{error.message}</p>
          </div>
        )}

        {/* Console Logs */}
        <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
          <strong>Debug:</strong> Verifique o console do navegador (F12) para logs detalhados sobre o carregamento das vendas.
        </div>
      </CardContent>
    </Card>
  );
};

export default VendasDebugInfo;
