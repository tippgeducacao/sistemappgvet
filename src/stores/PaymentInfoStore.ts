
import { create } from 'zustand';

interface PaymentInfo {
  valorContrato: string;
  percentualDesconto: string;
  dataPrimeiroPagamento: string;
  carenciaPrimeiraCobranca: string;
  reembolsoMatricula: string;
  indicacao: string;
  nomeIndicador: string;
}

interface PaymentInfoState {
  paymentInfo: PaymentInfo;
  
  // Actions
  updatePaymentInfo: (field: keyof PaymentInfo, value: string) => void;
  setPaymentInfo: (data: Partial<PaymentInfo>) => void;
  clearPaymentInfo: () => void;
  clearIndicador: () => void;
}

const initialPaymentInfo: PaymentInfo = {
  valorContrato: '',
  percentualDesconto: '',
  dataPrimeiroPagamento: '',
  carenciaPrimeiraCobranca: '',
  reembolsoMatricula: '',
  indicacao: '',
  nomeIndicador: '',
};

export const usePaymentInfoStore = create<PaymentInfoState>((set) => ({
  paymentInfo: initialPaymentInfo,
  
  updatePaymentInfo: (field, value) => set((state) => ({
    paymentInfo: { ...state.paymentInfo, [field]: value }
  })),
  
  setPaymentInfo: (data) => set((state) => ({
    paymentInfo: { ...state.paymentInfo, ...data }
  })),
  
  clearPaymentInfo: () => set({ paymentInfo: initialPaymentInfo }),
  
  clearIndicador: () => set((state) => ({
    paymentInfo: { ...state.paymentInfo, nomeIndicador: '' }
  })),
}));
