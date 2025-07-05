
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useVendas } from '@/hooks/useVendas';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import type { VendaCompleta } from '@/hooks/useVendas';

const RecentSales: React.FC = () => {
  const { vendas, isLoading } = useVendas();
  const [selectedVenda, setSelectedVenda] = useState<VendaCompleta | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Pegar apenas as 5 vendas mais recentes
  const recentVendas = vendas.slice(0, 5);

  const handleViewVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="bg-fuchsia-50">
        <CardHeader className="bg-teal-400">
          <CardTitle>Minhas Vendas Recentes</CardTitle>
          <CardDescription className="text-slate-50">
            Carregando vendas...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-fuchsia-50">
        <CardHeader className="bg-teal-400">
          <CardTitle>Minhas Vendas Recentes</CardTitle>
          <CardDescription className="text-slate-50">
            {recentVendas.length === 0 
              ? "Suas vendas aparecerão aqui quando você cadastrar"
              : "Últimas vendas realizadas e seus status"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentVendas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma venda cadastrada ainda.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Cadastre sua primeira venda para começar!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentVendas.map((venda) => (
                <div key={venda.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <p className="font-medium">{venda.aluno?.nome || 'Nome não informado'}</p>
                    <p className="text-sm text-muted-foreground">{venda.curso?.nome || 'Curso não informado'}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{venda.pontuacao_esperada || 0} pts</p>
                      <p className="text-xs text-muted-foreground">
                        {venda.enviado_em ? new Date(venda.enviado_em).toLocaleDateString('pt-BR') : 'Sem data'}
                      </p>
                    </div>
                    <Badge variant={venda.status === 'matriculado' ? 'default' : venda.status === 'pendente' ? 'secondary' : 'destructive'}>
                      {venda.status === 'matriculado' ? 'Matriculado' : venda.status === 'pendente' ? 'Pendente' : 'Rejeitada'}
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
          )}
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

export default RecentSales;
