import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Users } from 'lucide-react';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import type { VendaCompleta } from '@/hooks/useVendas';

interface SimpleTodasVendasTabProps {
  vendas: VendaCompleta[];
}

const SimpleTodasVendasTab: React.FC<SimpleTodasVendasTabProps> = ({ vendas }) => {
  const [selectedVenda, setSelectedVenda] = useState<VendaCompleta | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleViewVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setDetailsDialogOpen(true);
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'matriculado':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'desistiu':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'matriculado':
        return 'Matriculado';
      case 'pendente':
        return 'Pendente';
      case 'desistiu':
        return 'Desistiu';
      default:
        return status;
    }
  };

  if (vendas.length === 0) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Nenhuma Venda Encontrada
            </h3>
            <p className="text-blue-700">
              Não há vendas da sua equipe para exibir.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Todas as Vendas da Equipe
        </CardTitle>
        <CardDescription>
          {vendas.length} {vendas.length === 1 ? 'venda' : 'vendas'} da sua equipe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vendas.map(venda => (
            <div key={venda.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">
                      {venda.aluno?.nome || 'Nome não informado'}
                    </h3>
                    <Badge variant={getStatusBadgeVariant(venda.status)}>
                      {getStatusLabel(venda.status)}
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
                      <span className="font-medium">Enviado:</span> {venda.enviado_em ? DataFormattingService.formatDateTime(venda.enviado_em) : 'Não informada'}
                    </div>
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
                    {venda.data_aprovacao && (
                      <div>
                        <span className="font-medium">Aprovado em:</span> 
                        <span className="ml-1 text-gray-600">{DataFormattingService.formatDate(venda.data_aprovacao)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleViewVenda(venda)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <VendaDetailsDialog
      venda={selectedVenda}
      open={detailsDialogOpen}
      onOpenChange={setDetailsDialogOpen}
    />
    </>
  );
};

export default SimpleTodasVendasTab;