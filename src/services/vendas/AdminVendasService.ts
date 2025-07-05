
import { AdminVendaQueryService } from './AdminVendaQueryService';
import { DirectUpdateService } from './DirectUpdateService';
import type { VendaCompleta } from '@/hooks/useVendas';

export class AdminVendasService {
  static async getAllVendasForAdmin(): Promise<VendaCompleta[]> {
    return AdminVendaQueryService.getAllVendasForAdmin();
  }

  static async updateVendaStatus(
    vendaId: string, 
    status: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string
  ): Promise<boolean> {
    console.log('🎯 AdminVendasService: Delegando para DirectUpdateService');
    return DirectUpdateService.updateVendaStatusDirect(
      vendaId,
      status,
      pontuacaoValidada,
      motivoPendencia
    );
  }
}
