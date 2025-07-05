
import { create } from 'zustand';
import { ErrorService } from '@/services/error/ErrorService';

// Interface completa para todos os dados do formulário
export interface FormData {
  // Lead info - Informações Básicas
  dataChegada: string;
  nomeAluno: string;
  emailAluno: string;
  formacaoAluno: string;
  ies: string;
  cursoId: string;
  vendedor: string;
  
  // Informações de Contato Adicionais
  telefone: string;
  crmv: string;
  
  // Payment info - Informações de Pagamento
  valorContrato: string;
  percentualDesconto: string;
  dataPrimeiroPagamento: string;
  carenciaPrimeiraCobranca: string;
  detalhesCarencia: string;
  reembolsoMatricula: string;
  indicacao: string;
  nomeIndicador: string;
  
  // Scoring rules data - Regras de Pontuação
  lotePos: string;
  matricula: string;
  modalidade: string;
  parcelamento: string;
  pagamento: string;
  formaCaptacao: string;
  tipoVenda: string;
  vendaCasada: string;
  detalhesVendaCasada: string; // Novo campo para detalhes da venda casada
  
  // Observations
  observacoes: string;
  
  // Documento comprobatório
  documentoComprobatorio: File | null;
}

const initialFormData: FormData = {
  dataChegada: '',
  nomeAluno: '',
  emailAluno: '',
  formacaoAluno: '',
  ies: '',
  cursoId: '',
  vendedor: '',
  telefone: '',
  crmv: '',
  valorContrato: '',
  percentualDesconto: '',
  dataPrimeiroPagamento: '',
  carenciaPrimeiraCobranca: '',
  detalhesCarencia: '',
  reembolsoMatricula: '',
  indicacao: '',
  nomeIndicador: '',
  lotePos: '',
  matricula: '',
  modalidade: '',
  parcelamento: '',
  pagamento: '',
  formaCaptacao: '',
  tipoVenda: '',
  vendaCasada: '',
  detalhesVendaCasada: '', // Inicializar o novo campo
  observacoes: '',
  documentoComprobatorio: null
};

interface FormState {
  formData: FormData;
  isSubmitting: boolean;
  
  // Actions
  updateField: (field: keyof FormData, value: string | File | null) => void;
  setIsSubmitting: (submitting: boolean) => void;
  clearForm: () => void;
  setVendedor: (vendedor: string) => void;
}

export const useFormStore = create<FormState>((set, get) => ({
  formData: initialFormData,
  isSubmitting: false,
  
  updateField: (field, value) => {
    console.log(`Updating field ${field} with value:`, value);
    set((state) => ({
      formData: { ...state.formData, [field]: value }
    }));
  },
  
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  
  clearForm: () => set({ formData: initialFormData }),
  
  setVendedor: (vendedor) => set((state) => ({
    formData: { ...state.formData, vendedor }
  })),
}));
