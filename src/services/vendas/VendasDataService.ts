
import { VendasQueryService } from './VendasQueryService';
import { VendaProcessingService } from './VendaProcessingService';
import { OptimizedVendaQueryService } from './OptimizedVendaQueryService';
import type { VendaCompleta } from '@/hooks/useVendas';

export class VendasDataService {
  /**
   * Busca vendas de um vendedor específico
   */
  static async getVendasByVendedor(vendedorId: string): Promise<VendaCompleta[]> {
    try {
      const formEntries = await VendasQueryService.getFormEntriesByVendedor(vendedorId);
      
      if (formEntries.length === 0) {
        return [];
      }

      return VendaProcessingService.processVendasWithRelations(formEntries);
    } catch (error) {
      console.error('💥 Erro na busca de vendas do vendedor:', error);
      throw error;
    }
  }

  /**
   * OTIMIZADA: Busca TODAS as vendas do sistema com query única
   */
  static async getAllVendas(): Promise<VendaCompleta[]> {
    try {
      // Usar nova query otimizada ao invés do processamento N+1
      return OptimizedVendaQueryService.getAllVendasOptimized();
    } catch (error) {
      console.error('💥💥💥 ERRO CRÍTICO na busca otimizada de vendas:', error);
      throw error;
    }
  }
}
