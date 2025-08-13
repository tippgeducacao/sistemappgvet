import { useState, useEffect } from 'react';
import { SemanasConsecutivasService } from '@/services/SemanasConsecutivasService';

export const useSemanasConsecutivas = (vendedorId?: string) => {
  const [semanasConsecutivas, setSemanasConsecutivas] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const calcularSemanasConsecutivas = async (id?: string) => {
    const targetId = id || vendedorId;
    if (!targetId) return;

    setLoading(true);
    try {
      console.log('🔄 Recalculando semanas consecutivas para:', targetId);
      const semanas = await SemanasConsecutivasService.calcularSemanasConsecutivas(targetId);
      console.log('🏆 Resultado das semanas consecutivas:', semanas);
      setSemanasConsecutivas(semanas);
      
      // Atualizar no banco de dados
      await SemanasConsecutivasService.atualizarSemanasConsecutivas(targetId);
    } catch (error) {
      console.error('❌ Erro ao calcular semanas consecutivas:', error);
      setSemanasConsecutivas(0); // Reset em caso de erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendedorId) {
      calcularSemanasConsecutivas(vendedorId);
    }
  }, [vendedorId]);

  return {
    semanasConsecutivas,
    loading,
    recalcular: calcularSemanasConsecutivas
  };
};