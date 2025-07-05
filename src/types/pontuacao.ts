
export interface RegrasPontuacao {
  id: string;
  campo_nome: string;
  opcao_valor: string;
  pontos: number;
  created_at: string;
}

export interface NewRule {
  campo_nome: string;
  opcao_valor: string;
  pontos: number;
}
