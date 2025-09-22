
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/AuthStore';
import { VendasDataService } from '@/services/vendas/VendasDataService';

export interface VendaCompleta {
  id: string;
  vendedor_id: string;
  curso_id: string;
  observacoes: string;
  status: 'pendente' | 'matriculado' | 'desistiu';
  pontuacao_esperada: number;
  pontuacao_validada: number | null;
  enviado_em: string;
  atualizado_em: string;
  data_aprovacao?: string | null; // Nova propriedade para data de aprovação
  data_assinatura_contrato?: string | null; // Nova propriedade para data de assinatura de contrato
  motivo_pendencia?: string | null;
  documento_comprobatorio?: string | null;
  sdr_id?: string | null; // ID do SDR que originou a venda
  aluno: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    crmv?: string;
  } | null;
  curso: {
    id: string;
    nome: string;
  } | null;
  vendedor?: {
    id: string;
    name: string;
    email: string;
    photo_url?: string;
  } | null;
  sdr?: {
    id: string;
    name: string;
    email: string;
    photo_url?: string;
  } | null;
}

// Hook para vendas do vendedor específico
export const useVendas = () => {
  const { currentUser } = useAuthStore();
  
  const { data: vendas, isLoading, error, refetch } = useQuery({
    queryKey: ['vendas', currentUser?.id],
    queryFn: async (): Promise<VendaCompleta[]> => {
      if (!currentUser?.id) {
        console.log('🚫 Nenhum usuário autenticado');
        return [];
      }

      const vendas = await VendasDataService.getVendasByVendedor(currentUser.id);
      
      // Log para debug dos documentos
      vendas.forEach(venda => {
        console.log(`📎 Venda ${venda.id.substring(0, 8)}: documento = ${venda.documento_comprobatorio || 'null'}`);
      });
      
      return vendas;
    },
    enabled: !!currentUser?.id,
    staleTime: 300000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  return {
    vendas: vendas || [],
    isLoading,
    error,
    refetch
  };
};

// Hook para TODAS as vendas do sistema (usado pela secretaria)
export const useAllVendas = () => {
  const { data: vendas, isLoading, error, refetch } = useQuery({
    queryKey: ['all-vendas'],
    queryFn: async (): Promise<VendaCompleta[]> => {
      const vendas = await VendasDataService.getAllVendas();
      
      // Log para debug dos documentos
      vendas.forEach(venda => {
        console.log(`📎 Venda ${venda.id.substring(0, 8)}: documento = ${venda.documento_comprobatorio || 'null'}`);
      });
      
      return vendas;
    },
    staleTime: 300000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  return {
    vendas: vendas || [],
    isLoading,
    error,
    refetch
  };
};
