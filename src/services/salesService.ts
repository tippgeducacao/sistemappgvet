
export interface Sale {
  id: number;
  aluno: string;
  email: string;
  curso: string;
  status: 'Matriculado' | 'Pendente' | 'Rejeitado';
  pontuacao: number;
  data: string;
  valor: string;
}

export class SalesService {
  static async fetchSales(): Promise<Sale[]> {
    // Retorna array vazio - dados reais virão do banco via hooks/useVendas
    return [];
  }

  static calculateSalesStats(sales: Sale[]) {
    return {
      total: sales.length,
      approved: sales.filter(s => s.status === 'Matriculado').length,
      pending: sales.filter(s => s.status === 'Pendente').length,
      totalPoints: sales.reduce((sum, s) => sum + s.pontuacao, 0)
    };
  }

  static getStatusColor(status: string): 'default' | 'secondary' | 'destructive' {
    switch (status) {
      case 'Matriculado':
        return 'default';
      case 'Pendente':
        return 'secondary';
      case 'Rejeitado':
        return 'destructive';
      default:
        return 'secondary';
    }
  }
}
