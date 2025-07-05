
import type { UserType } from '@/types/user';
import type { MetricData, VendaMensal, StatusDistribution, VendedorRanking, RecentSale, MinhaVenda } from '@/types/data';

export class DataService {
  static getMetricsForUserType(userType: UserType): MetricData[] {
    const commonMetrics: MetricData[] = [
      {
        title: "Total de Vendas",
        value: "0",
        description: "Nenhuma venda cadastrada ainda",
        color: "text-gray-600"
      },
      {
        title: "Receita Total",
        value: "R$ 0,00",
        description: "Aguardando primeiras vendas",
        color: "text-gray-600"
      }
    ];

    if (userType === 'secretaria') {
      return [
        ...commonMetrics,
        {
          title: "Matrículas Ativas",
          value: "0",
          description: "Nenhuma matrícula ativa",
          color: "text-gray-600"
        },
        {
          title: "Taxa de Conversão",
          value: "0%",
          description: "Aguardando dados",
          color: "text-gray-600"
        }
      ];
    }

    return [
      ...commonMetrics,
      {
        title: "Pontuação Atual",
        value: "0",
        description: "Faça sua primeira venda",
        color: "text-gray-600"
      },
      {
        title: "Meta do Mês",
        value: "0%",
        description: "Defina suas metas",
        color: "text-gray-600"
      }
    ];
  }

  static getVendasMes(): VendaMensal[] {
    return [];
  }

  static getStatusDistribution(): StatusDistribution[] {
    return [];
  }

  static getVendedoresRanking(): VendedorRanking[] {
    return [];
  }

  static getRecentSales(): RecentSale[] {
    return [];
  }

  static getMinhasVendas(): MinhaVenda[] {
    return [];
  }
}
