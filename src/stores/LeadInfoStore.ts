
import { create } from 'zustand';
import { ErrorService } from '@/services/error/ErrorService';
import type { LeadInfo } from '@/types/forms';

interface LeadInfoState {
  leadInfo: LeadInfo;
  
  // Actions
  updateLeadInfo: (field: keyof LeadInfo, value: string) => void;
  setLeadInfo: (data: Partial<LeadInfo>) => void;
  clearLeadInfo: () => void;
  setVendedor: (vendedor: string) => void;
  validateLeadInfo: () => void;
}

const initialLeadInfo: LeadInfo = {
  dataChegada: '',
  nomeAluno: '',
  emailAluno: '',
  formacaoAluno: '',
  ies: '',
  cursoId: '',
  vendedor: '',
};

export const useLeadInfoStore = create<LeadInfoState>((set, get) => ({
  leadInfo: initialLeadInfo,
  
  updateLeadInfo: (field, value) => set((state) => ({
    leadInfo: { ...state.leadInfo, [field]: value }
  })),
  
  setLeadInfo: (data) => set((state) => ({
    leadInfo: { ...state.leadInfo, ...data }
  })),
  
  clearLeadInfo: () => set({ leadInfo: initialLeadInfo }),
  
  setVendedor: (vendedor) => set((state) => ({
    leadInfo: { ...state.leadInfo, vendedor }
  })),

  validateLeadInfo: () => {
    const { leadInfo } = get();
    
    try {
      ErrorService.validateRequired(leadInfo.nomeAluno, 'Nome do aluno');
      ErrorService.validateRequired(leadInfo.emailAluno, 'Email do aluno');
      ErrorService.validateRequired(leadInfo.cursoId, 'Curso');
      ErrorService.validateRequired(leadInfo.vendedor, 'Vendedor');
      
      if (leadInfo.emailAluno) {
        ErrorService.validateEmail(leadInfo.emailAluno);
      }
    } catch (error) {
      ErrorService.logError(error as Error, 'LeadInfo Validation');
      throw error;
    }
  },
}));
