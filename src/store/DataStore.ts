
import { create } from 'zustand';

interface MetricCardData {
  title: string;
  value: string;
  description: string;
  color: string;
}

interface VendasMes {
  mes: string;
  vendas: number;
  meta: number;
}

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

interface VendedorRanking {
  nome: string;
  vendas: number;
  pontuacao: number;
  status: string;
}

interface MinhaVenda {
  aluno: string;
  curso: string;
  status: string;
  pontuacao: number;
  data: string;
}

interface DataState {
  // Dashboard data
  secretariaMetrics: MetricCardData[];
  vendedorMetrics: MetricCardData[];
  vendasMes: VendasMes[];
  statusDistribution: StatusDistribution[];
  vendedoresRanking: VendedorRanking[];
  minhasVendas: MinhaVenda[];
  
  // Actions
  getMetricsForUserType: (userType: 'secretaria' | 'vendedor') => MetricCardData[];
}

export const useDataStore = create<DataState>((set, get) => ({
  // Secretaria metrics
  secretariaMetrics: [
    {
      title: "Total de Matrículas",
      value: "191",
      description: "+12% em relação ao mês anterior",
      color: "text-ppgvet-teal"
    },
    {
      title: "Pendentes",
      value: "23",
      description: "Aguardando validação",
      color: "text-yellow-600"
    },
    {
      title: "Vendedores Ativos",
      value: "8",
      description: "De 10 vendedores cadastrados",
      color: "text-ppgvet-magenta"
    },
    {
      title: "Receita do Mês",
      value: "R$ 147.2k",
      description: "+8% em relação ao mês anterior",
      color: "text-green-600"
    }
  ],
  
  // Vendedor metrics
  vendedorMetrics: [
    {
      title: "Vendas do Mês",
      value: "23",
      description: "Meta: 25 vendas",
      color: "text-ppgvet-teal"
    },
    {
      title: "Pontuação Total",
      value: "2,840",
      description: "+120 pontos esta semana",
      color: "text-ppgvet-magenta"
    },
    {
      title: "Taxa de Conversão",
      value: "78%",
      description: "Acima da média (65%)",
      color: "text-green-600"
    },
    {
      title: "Ranking",
      value: "#2",
      description: "Entre 8 vendedores",
      color: "text-yellow-600"
    }
  ],
  
  // Vendas por mês
  vendasMes: [
    { mes: 'Jan', vendas: 45, meta: 50 },
    { mes: 'Fev', vendas: 52, meta: 50 },
    { mes: 'Mar', vendas: 48, meta: 50 },
    { mes: 'Abr', vendas: 61, meta: 55 },
    { mes: 'Mai', vendas: 55, meta: 55 },
    { mes: 'Jun', vendas: 67, meta: 60 },
  ],
  
  // Status distribution
  statusDistribution: [
    { name: 'Matriculados', value: 156, color: '#10b981' },
    { name: 'Pendentes', value: 23, color: '#f59e0b' },
    { name: 'Desistentes', value: 12, color: '#ef4444' },
  ],
  
  // Vendedores ranking - dados serão carregados do banco
  vendedoresRanking: [],
  
  // Minhas vendas - dados serão carregados do banco
  minhasVendas: [],
  
  // Actions
  getMetricsForUserType: (userType) => {
    return userType === 'secretaria' ? get().secretariaMetrics : get().vendedorMetrics;
  },
}));
