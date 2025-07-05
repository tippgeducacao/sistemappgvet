
export interface LeadInfo {
  dataChegada: string;
  nomeAluno: string;
  emailAluno: string;
  formacaoAluno: string;
  ies: string;
  cursoId: string;
  vendedor: string;
}

export interface ScoringInfo {
  lotePos: string;
  matricula: string;
  modalidade: string;
  parcelamento: string;
  pagamento: string;
  formaCaptacao: string;
  tipoVenda: string;
  vendaCasada: string;
}

export interface PaymentInfo {
  metodoPagamento: string;
  valorTotal: number;
  desconto: number;
  parcelas: number;
  dataVencimento: string;
}

export interface FormData extends LeadInfo, ScoringInfo, PaymentInfo {
  observacoes?: string;
}
