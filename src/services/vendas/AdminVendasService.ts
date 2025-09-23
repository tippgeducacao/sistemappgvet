
import { OptimizedVendaQueryService } from './OptimizedVendaQueryService';
import { DirectUpdateService } from './DirectUpdateService';
import type { VendaCompleta } from '@/hooks/useVendas';

export class AdminVendasService {
  static async getAllVendasForAdmin(): Promise<VendaCompleta[]> {
    console.log('🚀 [EGRESS OPTIMIZED] Usando OptimizedVendaQueryService para eliminar N+1 queries');
    return OptimizedVendaQueryService.getAllVendasForAdmin();
  }

  static async updateVendaStatus(
    vendaId: string, 
    status: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string,
    dataAssinaturaContrato?: string
  ): Promise<boolean> {
    console.log('🎯 AdminVendasService: Delegando para DirectUpdateService');
    return DirectUpdateService.updateVendaStatusDirect(
      vendaId,
      status,
      pontuacaoValidada,
      motivoPendencia,
      dataAssinaturaContrato
    );
  }
}
