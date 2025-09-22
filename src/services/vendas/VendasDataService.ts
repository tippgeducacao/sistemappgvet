
import { VendasQueryService } from './VendasQueryService';
import { VendaProcessingService } from './VendaProcessingService';
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
   * Busca TODAS as vendas do sistema
   */
  static async getAllVendas(): Promise<VendaCompleta[]> {
    try {
      const allFormEntries = await VendasQueryService.getAllFormEntries();
      
      if (allFormEntries.length === 0) {
        return [];
      }

      return VendaProcessingService.processVendasWithRelations(allFormEntries);
    } catch (error) {
      console.error('💥💥💥 ERRO CRÍTICO na busca de todas as vendas:', error);
      throw error;
    }
  }
}
