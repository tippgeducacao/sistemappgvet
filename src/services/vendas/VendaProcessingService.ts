
import { DataFetchingService } from './DataFetchingService';
import { VendaAssemblyService } from './VendaAssemblyService';
import { ProcessingStatsService } from './ProcessingStatsService';
import type { VendaCompleta } from '@/hooks/useVendas';

export class VendaProcessingService {
  /**
   * Processa form_entries e busca dados relacionados
   */
  static async processVendasWithRelations(formEntries: any[]): Promise<VendaCompleta[]> {
    try {
      console.log(`📋 Processando ${formEntries.length} form_entries`);

      // Buscar todos os dados relacionados
      const { alunos, cursos, profiles, rules, respostas } = await DataFetchingService.fetchRelatedData(formEntries);

      // Processar vendas completas
      const vendasCompletas = await VendaAssemblyService.assembleVendas(
        formEntries, 
        alunos, 
        cursos, 
        profiles, 
        rules, 
        respostas
      );

      ProcessingStatsService.logProcessingStats(vendasCompletas);
      
      return vendasCompletas;
    } catch (error) {
      console.error('💥 Erro no processamento das vendas:', error);
      throw error;
    }
  }
}
