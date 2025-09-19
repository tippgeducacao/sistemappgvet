import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle } from 'lucide-react';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import type { VendaCompleta } from '@/hooks/useVendas';

interface SimpleMatriculadasTabProps {
  vendas: VendaCompleta[];
}

const SimpleMatriculadasTab: React.FC<SimpleMatriculadasTabProps> = ({ vendas }) => {
  
  if (vendas.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Nenhuma Venda Matriculada
            </h3>
            <p className="text-green-700">
              Ainda não há vendas matriculadas da sua equipe.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Vendas Matriculadas
        </CardTitle>
        <CardDescription>
          {vendas.length} {vendas.length === 1 ? 'venda matriculada' : 'vendas matriculadas'} da sua equipe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vendas.map(venda => (
            <div key={venda.id} className="border rounded-lg p-4 bg-green-50">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">
                      {venda.aluno?.nome || 'Nome não informado'}
                    </h3>
                    <Badge variant="default" className="bg-green-600">
                      Matriculado
                    </Badge>
                    <span className="text-xs text-gray-500 font-mono">
                      #{venda.id.substring(0, 8)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Email:</span> {venda.aluno?.email || 'Não informado'}
                    </div>
                    <div>
                      <span className="font-medium">Curso:</span> {venda.curso?.nome || 'Não informado'}
                    </div>
                    <div>
                      <span className="font-medium">Aprovado em:</span> {venda.data_aprovacao ? DataFormattingService.formatDateTime(venda.data_aprovacao) : 'Não informada'}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="font-medium">Pontuação:</span> 
                      <span className="ml-1 text-ppgvet-teal font-bold">
                        {venda.pontuacao_validada || venda.pontuacao_esperada || 0} pts
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Vendedor:</span> 
                      <span className="ml-1 text-gray-600">{venda.vendedor?.name || venda.vendedor_id}</span>
                    </div>
                    {venda.sdr && (
                      <div>
                        <span className="font-medium">SDR:</span> 
                        <span className="ml-1 text-gray-600">{venda.sdr.name}</span>
                      </div>
                    )}
                  </div>

                  {venda.data_assinatura_contrato && (
                    <div className="text-sm">
                      <span className="font-medium">Contrato assinado:</span> 
                      <span className="ml-1 text-gray-600">{DataFormattingService.formatDate(venda.data_assinatura_contrato)}</span>
                    </div>
                  )}
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
      </CardContent>
    </Card>
  );
};

export default SimpleMatriculadasTab;