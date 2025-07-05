
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { useSecretariaVendas } from '@/hooks/useSecretariaVendas';
import LoadingSpinner from '@/components/LoadingSpinner';
import MatriculadasTab from '@/components/vendas/MatriculadasTab';
import RejeitadasTab from '@/components/vendas/RejeitadasTab';
import SecretariaHeader from '@/components/vendas/secretaria/SecretariaHeader';
import VendasPendentesCard from '@/components/vendas/secretaria/VendasPendentesCard';

const SecretariaGerenciarVendas: React.FC = () => {
  const { 
    vendas,
    vendasPendentes, 
    vendasMatriculadas, 
    isLoading, 
    isUpdating, 
    updateStatus,
    refetch
  } = useSecretariaVendas();

  // Filtrar vendas rejeitadas
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

  const handleAprovar = async (vendaId: string, pontuacaoEsperada: number) => {
    console.log('🎯 Aprovando venda:', vendaId.substring(0, 8));
    await updateStatus(vendaId, 'matriculado', pontuacaoEsperada);
  };

  const handleRejeitar = async (vendaId: string, motivo: string) => {
    console.log('🎯 Rejeitando venda:', vendaId.substring(0, 8), 'Motivo:', motivo);
    await updateStatus(vendaId, 'desistiu', undefined, motivo);
  };

  return (
    <div className="space-y-6">
      <SecretariaHeader 
        onRefresh={refetch}
        isLoading={isLoading}
      />

      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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

        <TabsContent value="pendentes" className="mt-6">
          <VendasPendentesCard
            vendas={vendasPendentes}
            isUpdating={isUpdating}
            onAprovar={handleAprovar}
            onRejeitar={handleRejeitar}
          />
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
