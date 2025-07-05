
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useVendas } from '@/hooks/useVendas';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import type { VendaCompleta } from '@/hooks/useVendas';

const VendasList: React.FC = () => {
  const { vendas, isLoading, error } = useVendas();
  const [selectedVenda, setSelectedVenda] = useState<VendaCompleta | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleViewVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setDialogOpen(true);
  };

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

  if (vendas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minhas Vendas</CardTitle>
          <CardDescription>
            Suas vendas cadastradas aparecerão aqui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma venda cadastrada ainda.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'matriculado':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'desistiu':
        return 'destructive';
      default:
        return 'secondary';
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Minhas Vendas</CardTitle>
          <CardDescription>
            Últimas vendas cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendas.map((venda) => (
              <div key={venda.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <p className="font-medium">{venda.aluno?.nome || 'Nome não informado'}</p>
                  <p className="text-sm text-muted-foreground">
                    {venda.curso?.nome || 'Curso não informado'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {venda.enviado_em ? DataFormattingService.formatDateTime(venda.enviado_em) : 'Data não informada'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {venda.pontuacao_esperada ? DataFormattingService.formatPoints(venda.pontuacao_esperada) : '0'} pts
                    </p>
                    {venda.pontuacao_validada && (
                      <p className="text-xs text-muted-foreground">
                        Validada: {DataFormattingService.formatPoints(venda.pontuacao_validada)} pts
                      </p>
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(venda.status)}>
                    {getStatusLabel(venda.status)}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewVenda(venda)}
                    className="ml-2"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <VendaDetailsDialog
        venda={selectedVenda}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

export default VendasList;
