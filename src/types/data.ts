
export interface MetricData {
  title: string;
  value: string | number;
  description: string;
  color: string;
}

export interface VendaMensal {
  mes: string;
  vendas: number;
  meta: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface VendedorRanking {
  nome: string;
  vendas: number;
  pontuacao: number;
  posicao: number;
  status: string;
}

export interface RecentSale {
  id: string;
  aluno: string;
  curso: string;
  valor: number;
  data: string;
  vendedor: string;
  status: 'aprovada' | 'pendente' | 'cancelada';
}

export interface MinhaVenda {
  aluno: string;
  curso: string;
  status: string;
  pontuacao: number;
  data: string;
}
