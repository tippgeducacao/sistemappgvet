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
      const semanas = await SemanasConsecutivasService.calcularSemanasConsecutivas(targetId);
      setSemanasConsecutivas(semanas);
      
      // Atualizar no banco de dados
      await SemanasConsecutivasService.atualizarSemanasConsecutivas(targetId);
    } catch (error) {
      console.error('❌ Erro ao calcular semanas consecutivas:', error);
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