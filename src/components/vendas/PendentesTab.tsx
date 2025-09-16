
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Settings, Clock } from 'lucide-react';
import AdminVendaActionsDialog from '@/components/admin/AdminVendaActionsDialog';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import type { VendaCompleta } from '@/hooks/useVendas';

interface PendentesTabProps {
  vendas: VendaCompleta[];
}

const PendentesTab: React.FC<PendentesTabProps> = ({ vendas }) => {
  const [selectedVenda, setSelectedVenda] = useState<VendaCompleta | null>(null);
  const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleViewVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setDetailsDialogOpen(true);
  };

  const handleManageVenda = (venda: VendaCompleta) => {
    setSelectedVenda(venda);
    setActionsDialogOpen(true);
  };

  if (vendas.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma venda pendente</h3>
            <p className="text-muted-foreground">Todas as vendas foram processadas!</p>
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
            <Clock className="h-5 w-5 text-yellow-500" />
            Vendas Pendentes
          </CardTitle>
          <CardDescription>
            {vendas.length} vendas aguardando validação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendas.map((venda, index) => (
              <div key={venda.id} className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 bg-yellow-50/50 dark:bg-yellow-950/30">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground font-mono">#{index + 1}</span>
                      <h3 className="font-semibold text-lg">{venda.aluno?.nome || 'Nome não informado'}</h3>
                      <Badge variant="secondary">Pendente</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Email:</span> {venda.aluno?.email || 'Não informado'}
                      </div>
                      <div>
                        <span className="font-medium">Curso:</span> {venda.curso?.nome || 'Não informado'}
                      </div>
                      <div>
                        <span className="font-medium">Vendedor:</span> {venda.vendedor?.name || 'Não informado'}
                        {venda.sdr && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">SDR:</span> {venda.sdr.name}
                          </div>
                        )}
                      </div>
                      {venda.sdr && (
                        <div>
                          <span className="font-medium">SDR:</span> {venda.sdr.name}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="font-medium">Pontuação Esperada:</span> 
                        <span className="ml-1 text-ppgvet-teal font-bold">
                          {DataFormattingService.formatPoints(venda.pontuacao_esperada || 0)} pts
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Enviado em:</span> 
                        <span className="ml-1">
                          {venda.enviado_em ? DataFormattingService.formatDate(venda.enviado_em) : 'Não informado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Botão Visualizar */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewVenda(venda)}
                      title="Visualizar detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* Botão Gerenciar */}
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleManageVenda(venda)}
                      title="Aprovar, rejeitar ou validar"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Diálogos */}
      <AdminVendaActionsDialog
        venda={selectedVenda}
        open={actionsDialogOpen}
        onOpenChange={setActionsDialogOpen}
      />

      <VendaDetailsDialog
        venda={selectedVenda}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </>
  );
};

export default PendentesTab;
