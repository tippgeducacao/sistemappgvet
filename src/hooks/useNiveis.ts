import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { NiveisService, type NivelVendedor } from '@/services/niveisService';

export const useNiveis = () => {
  const [niveis, setNiveis] = useState<NivelVendedor[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchNiveis = async () => {
    try {
      setLoading(true);
      const data = await NiveisService.fetchNiveis();
      setNiveis(data);
    } catch (error) {
      console.error('❌ Erro ao buscar níveis:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar níveis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateNivel = async (id: string, dados: Partial<Omit<NivelVendedor, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      await NiveisService.updateNivel(id, dados);
      await fetchNiveis(); // Recarregar dados
      
      toast({
        title: "Sucesso",
        description: "Nível atualizado com sucesso!",
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar nível:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar nível",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateVendedorNivel = async (vendedorId: string, nivel: 'junior' | 'pleno' | 'senior' | 'sdr_junior' | 'sdr_pleno' | 'sdr_senior') => {
    try {
      await NiveisService.updateVendedorNivel(vendedorId, nivel);
      
      toast({
        title: "Sucesso",
        description: "Nível do vendedor atualizado com sucesso!",
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar nível do vendedor:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar nível do vendedor",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchNiveis();
  }, []);

  return {
    niveis,
    loading,
    fetchNiveis,
    updateNivel,
    updateVendedorNivel,
  };
};