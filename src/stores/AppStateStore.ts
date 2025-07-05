
import { create } from 'zustand';
import { NavigationService } from '@/services/navigation/NavigationService';

interface AppStateStore {
  // Navigation state
  activeSection: string;
  showNovaVenda: boolean;
  
  // Actions
  navigateToSection: (section: string) => void;
  showNovaVendaForm: () => void;
  hideNovaVendaForm: () => void;
  resetToDefault: () => void;
}

export const useAppStateStore = create<AppStateStore>((set, get) => ({
  // Initial state
  activeSection: NavigationService.SECTIONS.DASHBOARD,
  showNovaVenda: false,
  
  // Actions
  navigateToSection: (section) => {
    console.log('🔄 AppStateStore: Navegando para:', section);
    console.log('🔄 AppStateStore: Estado anterior:', get().activeSection);
    
    set({ 
      showNovaVenda: false, 
      activeSection: section 
    });
    
    console.log('🔄 AppStateStore: Estado após navegação:', get().activeSection);
  },
  
  showNovaVendaForm: () => {
    console.log('🔄 AppStateStore: Mostrando nova venda');
    set({ 
      showNovaVenda: true, 
      activeSection: NavigationService.SECTIONS.DASHBOARD 
    });
  },
  
  hideNovaVendaForm: () => {
    console.log('🔄 AppStateStore: Escondendo nova venda');
    set({ 
      showNovaVenda: false, 
      activeSection: NavigationService.SECTIONS.DASHBOARD 
    });
  },
  
  resetToDefault: () => {
    console.log('🔄 AppStateStore: Reset para padrão');
    set({
      activeSection: NavigationService.SECTIONS.DASHBOARD,
      showNovaVenda: false
    });
  },
}));
