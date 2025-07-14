
import { create } from 'zustand';

interface FormState {
  formData: FormData;
  isSubmitting: boolean;
  
  // Actions
  updateField: <T extends keyof FormData>(field: T, value: FormData[T]) => void;
  setFormData: (data: Partial<FormData>) => void;
  setVendedor: (vendedor: string) => void;
  clearForm: () => void;
  setIsSubmitting: (value: boolean) => void;
}

export interface FormData {
  // Informações do Lead
  dataChegada: string;
  nomeAluno: string;
  emailAluno: string;
  telefone?: string;
  crmv?: string;
  formacaoAluno: string;
  dataMatricula?: string;
  ies: string;
  modalidadeCurso?: string;
  cursoId: string;
  vendedor?: string;

  // Informações de Pontuação
  lotePos: string;
  matricula: string;
  modalidade: string;
  parcelamento: string;
  pagamento: string;
  formaCaptacao: string;
  
  vendaCasada: string;
  detalhesVendaCasada?: string;

  // Informações Financeiras
  valorContrato?: string;
  percentualDesconto?: string;
  dataPrimeiroPagamento?: string;
  carenciaPrimeiraCobranca?: string;
  detalhesCarencia?: string;
  reembolsoMatricula?: string;

  // Indicação
  indicacao?: string;
  nomeIndicador?: string;

  // Documento comprobatório
  documentoComprobatorio?: File | null;

  // Observações
  observacoes?: string;
}

const initialFormData: FormData = {
  // Lead Info
  dataChegada: new Date().toISOString().split('T')[0],
  nomeAluno: '',
  emailAluno: '',
  formacaoAluno: '',
  ies: '',
  modalidadeCurso: '',
  cursoId: '',

  // Scoring Info
  lotePos: '',
  matricula: '',
  modalidade: '',
  parcelamento: '',
  pagamento: '',
  formaCaptacao: '',
  
  vendaCasada: '',

  // Payment Info
  valorContrato: '',
  percentualDesconto: '',
  dataPrimeiroPagamento: '',
  carenciaPrimeiraCobranca: '',
  detalhesCarencia: '',
  reembolsoMatricula: '',

  // Indication
  indicacao: '',
  nomeIndicador: '',

  // Document
  documentoComprobatorio: null,

  // Observations
  observacoes: ''
};

export const useFormStore = create<FormState>((set) => ({
  formData: initialFormData,
  isSubmitting: false,
  
  updateField: (field, value) => set((state) => ({
    formData: { ...state.formData, [field]: value }
  })),
  
  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),

  setVendedor: (vendedor) => set((state) => ({
    formData: { ...state.formData, vendedor }
  })),
  
  clearForm: () => set({ formData: initialFormData }),
  setIsSubmitting: (value) => set({ isSubmitting: value }),
}));
