
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import LoadingSpinner from '@/components/LoadingSpinner';
import PendingVendasAlert from '@/components/alerts/PendingVendasAlert';
import TodasVendasTab from '@/components/vendas/TodasVendasTab';
import PendentesTab from '@/components/vendas/PendentesTab';
import MatriculadasTab from '@/components/vendas/MatriculadasTab';
import RejeitadasTab from '@/components/vendas/RejeitadasTab';
import { Card, CardContent } from '@/components/ui/card';

const SecretariaGerenciarVendas: React.FC = () => {
  const { 
    vendas,
    isLoading, 
    refetch
  } = useAllVendas();
  
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
          <TodasVendasTab vendas={vendas} />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendentesTab vendas={vendasPendentes} />
        </TabsContent>

        <TabsContent value="matriculadas" className="mt-6">
          <MatriculadasTab vendas={vendasMatriculadas} />
        </TabsContent>

        <TabsContent value="rejeitadas" className="mt-6">
          <RejeitadasTab vendas={vendasRejeitadas} />
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default SecretariaGerenciarVendas;
