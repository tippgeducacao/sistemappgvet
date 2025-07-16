import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ComissionamentoService, type RegraComissionamento } from '@/services/comissionamentoService';

export const useComissionamento = (tipoUsuario = 'vendedor') => {
  const [regras, setRegras] = useState<RegraComissionamento[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRegras = async () => {
    try {
      setLoading(true);
      const data = await ComissionamentoService.fetchRegras(tipoUsuario);
      setRegras(data);
    } catch (error) {
      console.error('❌ Erro ao buscar regras de comissionamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar regras de comissionamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRegra = async (id: string, dados: Partial<Omit<RegraComissionamento, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      await ComissionamentoService.updateRegra(id, dados);
      await fetchRegras(); // Recarregar dados
      
      toast({
        title: "Sucesso",
        description: "Regra de comissionamento atualizada com sucesso!",
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar regra de comissionamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar regra de comissionamento",
        variant: "destructive",
      });
      throw error;
    }
  };

  const calcularComissao = async (pontosObtidos: number, metaSemanal: number, variabelSemanal: number) => {
    try {
      return await ComissionamentoService.calcularComissao(pontosObtidos, metaSemanal, variabelSemanal, tipoUsuario);
    } catch (error) {
      console.error('❌ Erro ao calcular comissão:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchRegras();
  }, [tipoUsuario]);

  return {
    regras,
    loading,
    fetchRegras,
    updateRegra,
    calcularComissao,
  };
};