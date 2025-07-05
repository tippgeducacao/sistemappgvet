
import { create } from 'zustand';
import { ErrorService } from '@/services/error/ErrorService';
import type { ScoringInfo } from '@/types/forms';

interface ScoringInfoState {
  scoringInfo: ScoringInfo;
  
  // Actions
  updateScoringInfo: (field: keyof ScoringInfo, value: string) => void;
  setScoringInfo: (data: Partial<ScoringInfo>) => void;
  clearScoringInfo: () => void;
  validateScoringInfo: () => void;
}

const initialScoringInfo: ScoringInfo = {
  lotePos: '',
  matricula: '',
  modalidade: '',
  parcelamento: '',
  pagamento: '',
  formaCaptacao: '',
  tipoVenda: '',
  vendaCasada: '',
};

export const useScoringInfoStore = create<ScoringInfoState>((set, get) => ({
  scoringInfo: initialScoringInfo,
  
  updateScoringInfo: (field, value) => set((state) => ({
    scoringInfo: { ...state.scoringInfo, [field]: value }
  })),
  
  setScoringInfo: (data) => set((state) => ({
    scoringInfo: { ...state.scoringInfo, ...data }
  })),
  
  clearScoringInfo: () => set({ scoringInfo: initialScoringInfo }),

  validateScoringInfo: () => {
    const { scoringInfo } = get();
    
    try {
      ErrorService.validateRequired(scoringInfo.modalidade, 'Modalidade');
      ErrorService.validateRequired(scoringInfo.parcelamento, 'Parcelamento');
      ErrorService.validateRequired(scoringInfo.pagamento, 'Forma de Pagamento');
    } catch (error) {
      ErrorService.logError(error as Error, 'ScoringInfo Validation');
      throw error;
    }
  },
}));
