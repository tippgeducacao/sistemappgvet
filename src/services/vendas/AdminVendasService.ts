
import { AdminVendaQueryService } from './AdminVendaQueryService';
import type { VendaCompleta } from '@/hooks/useVendas';

export class AdminVendasService {
  static async getAllVendas(): Promise<VendaCompleta[]> {
    return AdminVendaQueryService.getAllVendasForAdmin();
  }

  static async getVendasByStatus(status: 'pendente' | 'matriculado' | 'desistiu'): Promise<VendaCompleta[]> {
    const allVendas = await this.getAllVendas();
    return allVendas.filter(venda => venda.status === status);
  }

  static async getVendasByVendedor(vendedorId: string): Promise<VendaCompleta[]> {
    const allVendas = await this.getAllVendas();
    return allVendas.filter(venda => venda.vendedor_id === vendedorId);
  }
}
