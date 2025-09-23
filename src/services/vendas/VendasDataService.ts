
import { VendasQueryService } from './VendasQueryService';
import { VendaProcessingService } from './VendaProcessingService';
import { OptimizedVendaQueryService } from './OptimizedVendaQueryService';
import type { VendaCompleta } from '@/hooks/useVendas';

export class VendasDataService {
  /**
   * Busca vendas de um vendedor específico - VERSÃO OTIMIZADA
   */
  static async getVendasByVendedor(vendedorId: string): Promise<VendaCompleta[]> {
    try {
      console.log('🚀 [OTIMIZADO] Usando OptimizedVendaQueryService para vendedor');
      return OptimizedVendaQueryService.getVendasByVendedor(vendedorId);
    } catch (error) {
      console.error('💥 Erro na busca otimizada de vendas do vendedor:', error);
      // Fallback para método antigo se otimizado falhar
      console.log('🔄 Usando método de fallback...');
      const formEntries = await VendasQueryService.getFormEntriesByVendedor(vendedorId);
      
      if (formEntries.length === 0) {
        return [];
      }

      return VendaProcessingService.processVendasWithRelations(formEntries);
    }
  }

  /**
   * Busca TODAS as vendas do sistema com paginação - VERSÃO OTIMIZADA
   * Limitado a 200 registros mais recentes para reduzir egress
   */
  static async getAllVendas(): Promise<VendaCompleta[]> {
    try {
      console.log('🚀 [EGRESS OPTIMIZED] Usando OptimizedVendaQueryService com paginação (200 registros)');
      return OptimizedVendaQueryService.getAllVendasForAdmin();
    } catch (error) {
      console.error('💥💥💥 ERRO CRÍTICO na busca otimizada de todas as vendas:', error);
      // Fallback para método antigo se otimizado falhar
      console.log('🔄 Usando método de fallback...');
      const allFormEntries = await VendasQueryService.getAllFormEntries();
      
      if (allFormEntries.length === 0) {
        return [];
      }

      return VendaProcessingService.processVendasWithRelations(allFormEntries);
    }
  }
}
