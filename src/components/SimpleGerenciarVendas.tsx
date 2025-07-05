
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, CheckCircle } from 'lucide-react';
import { useSimpleAdminVendas } from '@/hooks/useSimpleAdminVendas';
import LoadingSpinner from '@/components/LoadingSpinner';
import SimplePendentesTab from '@/components/vendas/SimplePendentesTab';

const SimpleGerenciarVendas: React.FC = () => {
  const { vendas, isLoading, error } = useSimpleAdminVendas();

  const vendasPendentes = vendas.filter(v => v.status === 'pendente');
  const vendasMatriculadas = vendas.filter(v => v.status === 'matriculado');

  console.log('🖥️ SimpleGerenciarVendas:', {
    total: vendas.length,
    pendentes: vendasPendentes.length,
    matriculadas: vendasMatriculadas.length
  });

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
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Vendas (Versão Simples)</CardTitle>
          <CardDescription>
            Versão simplificada para corrigir o problema de atualização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pendentes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
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
            </TabsList>

            <TabsContent value="todas" className="mt-6">
              <div className="text-center py-8">
                <p>Lista de todas as vendas</p>
              </div>
            </TabsContent>

            <TabsContent value="pendentes" className="mt-6">
              <SimplePendentesTab vendas={vendasPendentes} />
            </TabsContent>

            <TabsContent value="matriculadas" className="mt-6">
              <div className="text-center py-8">
                <p>{vendasMatriculadas.length} vendas matriculadas</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleGerenciarVendas;
