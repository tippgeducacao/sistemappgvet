
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, CheckCircle, Database, XCircle } from 'lucide-react';
import { useAdminVendas } from '@/hooks/useAdminVendas';
import LoadingSpinner from '@/components/LoadingSpinner';
import TodasVendasTab from '@/components/vendas/TodasVendasTab';
import PendentesTab from '@/components/vendas/PendentesTab';
import MatriculadasTab from '@/components/vendas/MatriculadasTab';
import RejeitadasTab from '@/components/vendas/RejeitadasTab';

const GerenciarVendas: React.FC = () => {
  const {
    vendas,
    isLoading,
    error
  } = useAdminVendas();

  // TODOS OS HOOKS DEVEM VIR ANTES DE QUALQUER EARLY RETURN
  // Filtrar vendas em tempo real - garantindo que seja baseado no status mais atual
  const vendasPendentes = React.useMemo(() => {
    const pendentes = vendas.filter(v => v.status === 'pendente');
    console.log('🔍 GerenciarVendas: Filtrando pendentes:', pendentes.map(v => ({
      id: v.id.substring(0, 8),
      status: v.status
    })));
    return pendentes;
  }, [vendas]);

  const vendasMatriculadas = React.useMemo(() => {
    const matriculadas = vendas.filter(v => v.status === 'matriculado');
    console.log('🎓 GerenciarVendas: Filtrando matriculadas:', matriculadas.map(v => ({
      id: v.id.substring(0, 8),
      status: v.status
    })));
    return matriculadas;
  }, [vendas]);

  const vendasRejeitadas = React.useMemo(() => {
    const rejeitadas = vendas.filter(v => v.status === 'desistiu');
    console.log('❌ GerenciarVendas: Filtrando rejeitadas:', rejeitadas.map(v => ({
      id: v.id.substring(0, 8),
      status: v.status
    })));
    return rejeitadas;
  }, [vendas]);

  console.log('🖥️ GerenciarVendas: Renderizando com vendas:', {
    total: vendas.length,
    pendentes: vendasPendentes.length,
    matriculadas: vendasMatriculadas.length,
    rejeitadas: vendasRejeitadas.length,
    statusDistribution: vendas.map(v => ({
      id: v.id.substring(0, 8),
      status: v.status
    }))
  });

  // AGORA SIM OS EARLY RETURNS PODEM VIR APÓS TODOS OS HOOKS
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="mt-4 text-lg font-medium">Carregando vendas...</p>
          <p className="text-sm text-muted-foreground">Buscando todas as vendas no banco de dados</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <p className="font-medium">Erro ao carregar vendas</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Vendas</h1>
        <p className="text-gray-600 mt-2">Gerencie todas as vendas do sistema em um só lugar</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas" variant="primary" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Todas ({vendas.length})
          </TabsTrigger>
          <TabsTrigger value="pendentes" variant="warning" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendentes ({vendasPendentes.length})
          </TabsTrigger>
          <TabsTrigger value="matriculadas" variant="success" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Matriculadas ({vendasMatriculadas.length})
          </TabsTrigger>
          <TabsTrigger value="rejeitadas" variant="destructive" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejeitadas ({vendasRejeitadas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="mt-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-ppgvet-teal">{vendas.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Matriculados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{vendasMatriculadas.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{vendasPendentes.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{vendasRejeitadas.length}</div>
              </CardContent>
            </Card>
          </div>

          <TodasVendasTab vendas={vendas} showDeleteButton={true} />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendentesTab vendas={vendasPendentes} showDeleteButton={true} />
        </TabsContent>

        <TabsContent value="matriculadas" className="mt-6">
          <MatriculadasTab vendas={vendasMatriculadas} showDeleteButton={true} />
        </TabsContent>

        <TabsContent value="rejeitadas" className="mt-6">
          <RejeitadasTab vendas={vendasRejeitadas} showDeleteButton={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GerenciarVendas;
