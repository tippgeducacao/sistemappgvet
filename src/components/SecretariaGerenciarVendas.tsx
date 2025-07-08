
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Users, Eye, Settings, Check, X } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { SecretariaUpdateService } from '@/services/vendas/SecretariaUpdateService';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import PendingVendasAlert from '@/components/alerts/PendingVendasAlert';
import RejectVendaDialog from '@/components/vendas/dialogs/RejectVendaDialog';
import ManageVendaDialog from '@/components/vendas/dialogs/ManageVendaDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { VendaCompleta } from '@/hooks/useVendas';

const SecretariaGerenciarVendas: React.FC = () => {
  const { 
    vendas,
    isLoading, 
    refetch
  } = useAllVendas();
  
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [vendaToReject, setVendaToReject] = React.useState<VendaCompleta | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = React.useState(false);
  const [vendaToManage, setVendaToManage] = React.useState<VendaCompleta | null>(null);

  // Filtrar vendas por status
  const vendasPendentes = React.useMemo(() => {
    return vendas.filter(v => v.status === 'pendente');
  }, [vendas]);

  const vendasMatriculadas = React.useMemo(() => {
    return vendas.filter(v => v.status === 'matriculado');
  }, [vendas]);

  const vendasRejeitadas = React.useMemo(() => {
    return vendas.filter(v => v.status === 'desistiu');
  }, [vendas]);

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

  const updateStatus = async (
    vendaId: string, 
    status: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string
  ) => {
    setIsUpdating(true);
    
    try {
      const success = await SecretariaUpdateService.updateVendaStatus(
        vendaId, 
        status, 
        pontuacaoValidada,
        motivoPendencia
      );
      
      if (!success) {
        throw new Error('Falha na atualização');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      await refetch();
      
      toast({
        title: 'Sucesso',
        description: `Venda ${status === 'matriculado' ? 'aprovada' : status === 'pendente' ? 'marcada como pendente' : 'rejeitada'} com sucesso!`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar status da venda',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAprovar = async (vendaId: string, pontuacaoEsperada: number) => {
    await updateStatus(vendaId, 'matriculado', pontuacaoEsperada);
  };

  const handleRejeitar = (venda: any) => {
    setVendaToReject(venda);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async (motivo: string) => {
    if (!vendaToReject) return;
    
    await updateStatus(vendaToReject.id, 'desistiu', undefined, motivo);
    setRejectDialogOpen(false);
    setVendaToReject(null);
  };

  const handleManage = (venda: VendaCompleta) => {
    setVendaToManage(venda);
    setManageDialogOpen(true);
  };

  const handleMarcarPendente = async (vendaId: string, motivo: string) => {
    await updateStatus(vendaId, 'pendente', undefined, motivo);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matriculado':
        return <Badge className="bg-green-100 text-green-800">Matriculado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'desistiu':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerta de vendas pendentes */}
      <PendingVendasAlert />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Vendas</h1>
        <p className="text-gray-600 mt-1">Gerencie todas as vendas do sistema em um só lugar</p>
      </div>

      {/* Tabs de navegação */}
      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Todas ({vendas.length})
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendentes ({vendasPendentes.length})
          </TabsTrigger>
          <TabsTrigger value="matriculadas" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Matriculadas ({vendasMatriculadas.length})
          </TabsTrigger>
          <TabsTrigger value="rejeitadas" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejeitadas ({vendasRejeitadas.length})
          </TabsTrigger>
        </TabsList>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-blue-600">{vendas.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Matriculados</p>
                <p className="text-3xl font-bold text-green-600">{vendasMatriculadas.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">{vendasPendentes.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Rejeitados</p>
                <p className="text-3xl font-bold text-red-600">{vendasRejeitadas.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo das abas */}
        <TabsContent value="todas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Completo de Vendas</CardTitle>
              <p className="text-sm text-gray-600">{vendas.length} vendas encontradas em 06/2025</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendas.map((venda, index) => (
                  <div key={venda.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm text-gray-500">#{index + 1}</span>
                          <h3 className="font-semibold text-lg">
                            {venda.aluno?.nome || 'Nome não informado'}
                          </h3>
                          {getStatusBadge(venda.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Email:</strong> {venda.aluno?.email || 'Não informado'}</p>
                          </div>
                          <div>
                            <p><strong>Curso:</strong> {venda.curso?.nome || 'Não informado'}</p>
                          </div>
                          <div>
                            <p><strong>Vendedor:</strong> {venda.vendedor?.name || 'Não informado'}</p>
                          </div>
                          <div>
                            <p><strong>Enviado:</strong> {venda.enviado_em ? format(new Date(venda.enviado_em), 'dd/MM/yyyy, HH:mm', { locale: ptBR }) : 'Não informado'}</p>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">
                            <strong>Pontuação:</strong> {venda.pontuacao_esperada || 0} pts
                          </span>
                          {venda.pontuacao_validada && (
                            <span className="ml-4 text-gray-600">
                              <strong>Validada:</strong> {venda.pontuacao_validada} pts
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-gray-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleManage(venda)}
                          className="text-gray-600"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        {venda.status === 'pendente' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleAprovar(venda.id, venda.pontuacao_esperada || 0)} 
                              disabled={isUpdating}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleRejeitar(venda)} 
                              disabled={isUpdating}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Vendas Pendentes ({vendasPendentes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vendasPendentes.length === 0 ? (
                <div className="text-center py-8 bg-green-50 rounded-lg">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-green-800 font-medium">Nenhuma venda pendente</p>
                  <p className="text-green-600">Todas as vendas foram processadas! 🎉</p>
                </div>
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
                            <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Email:</strong> {venda.aluno?.email || 'Não informado'}</p>
                            <p><strong>Curso:</strong> {venda.curso?.nome || 'Não informado'}</p>
                            <p><strong>Pontuação:</strong> {venda.pontuacao_esperada || 0} pts</p>
                            <p><strong>Vendedor:</strong> {venda.vendedor?.name || venda.vendedor_id}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAprovar(venda.id, venda.pontuacao_esperada || 0)} 
                            disabled={isUpdating}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                            {isUpdating ? 'Aprovando...' : 'Aprovar'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleRejeitar(venda)} 
                            disabled={isUpdating}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matriculadas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Vendas Matriculadas ({vendasMatriculadas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendasMatriculadas.map(venda => (
                  <div key={venda.id} className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">
                            {venda.aluno?.nome || 'Nome não informado'}
                          </h3>
                          <Badge className="bg-green-100 text-green-800">Matriculado</Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Email:</strong> {venda.aluno?.email || 'Não informado'}</p>
                          <p><strong>Curso:</strong> {venda.curso?.nome || 'Não informado'}</p>
                          <p><strong>Pontuação:</strong> {venda.pontuacao_validada || venda.pontuacao_esperada || 0} pts</p>
                          <p><strong>Vendedor:</strong> {venda.vendedor?.name || venda.vendedor_id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejeitadas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Vendas Rejeitadas ({vendasRejeitadas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendasRejeitadas.map(venda => (
                  <div key={venda.id} className="border rounded-lg p-4 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">
                            {venda.aluno?.nome || 'Nome não informado'}
                          </h3>
                          <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Email:</strong> {venda.aluno?.email || 'Não informado'}</p>
                          <p><strong>Curso:</strong> {venda.curso?.nome || 'Não informado'}</p>
                          <p><strong>Vendedor:</strong> {venda.vendedor?.name || venda.vendedor_id}</p>
                          {venda.motivo_pendencia && (
                            <p><strong>Motivo:</strong> {venda.motivo_pendencia}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de rejeição */}
      <RejectVendaDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleConfirmReject}
        isLoading={isUpdating}
        vendaNome={vendaToReject?.aluno?.nome}
      />

      {/* Dialog de gerenciar venda */}
      <ManageVendaDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        venda={vendaToManage}
        onAprovar={handleAprovar}
        onRejeitar={handleConfirmReject}
        onMarcarPendente={handleMarcarPendente}
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default SecretariaGerenciarVendas;
