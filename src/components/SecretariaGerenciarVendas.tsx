
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { SecretariaUpdateService } from '@/services/vendas/SecretariaUpdateService';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import MatriculadasTab from '@/components/vendas/MatriculadasTab';
import RejeitadasTab from '@/components/vendas/RejeitadasTab';
import SecretariaHeader from '@/components/vendas/secretaria/SecretariaHeader';
import VendasPendentesCard from '@/components/vendas/secretaria/VendasPendentesCard';

const SecretariaGerenciarVendas: React.FC = () => {
  const { 
    vendas,
    isLoading, 
    refetch
  } = useAllVendas();
  
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Filtrar vendas por status
  const vendasPendentes = React.useMemo(() => {
    return vendas.filter(v => v.status === 'pendente');
  }, [vendas]);

  const vendasMatriculadas = React.useMemo(() => {
    return vendas.filter(v => v.status === 'matriculado');
  }, [vendas]);

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

  const updateStatus = async (
    vendaId: string, 
    status: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string
  ) => {
    setIsUpdating(true);
    console.log('🎯 SECRETARIA: Iniciando atualização de status:', { 
      vendaId: vendaId.substring(0, 8), 
      status,
      pontuacaoValidada,
      motivoPendencia
    });

    try {
      const success = await SecretariaUpdateService.updateVendaStatus(
        vendaId, 
        status, 
        pontuacaoValidada,
        motivoPendencia
      );
      
      if (!success) {
        throw new Error('Falha na atualização - função retornou false');
      }

      console.log('✅ SUCESSO! Status atualizado. Recarregando vendas...');
      
      // Aguardar um pouco antes de recarregar para garantir que a atualização foi processada
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recarregar vendas
      await refetch();
      
      toast({
        title: 'Sucesso',
        description: `Venda ${status === 'matriculado' ? 'aprovada' : status === 'pendente' ? 'marcada como pendente' : 'rejeitada'} com sucesso!`,
      });
      
    } catch (error: any) {
      console.error('❌ ERRO na atualização:', error);
      
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
