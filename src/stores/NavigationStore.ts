
import { create } from 'zustand';
import { NavigationService } from '@/services/navigation/NavigationService';

interface NavigationState {
  activeSection: string;
  showNovaVenda: boolean;
  
  // Actions
  navigateToSection: (section: string) => void;
  showNovaVendaForm: () => void;
  hideNovaVendaForm: () => void;
  resetToDefault: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  // Initial state
  activeSection: NavigationService.SECTIONS.DASHBOARD,
  showNovaVenda: false,
  
  // Actions
  navigateToSection: (section) => {
    console.log('Navegando para:', section);
    set({ showNovaVenda: false, activeSection: section });
  },
  
  showNovaVendaForm: () => set({ 
    showNovaVenda: true, 
    activeSection: NavigationService.SECTIONS.DASHBOARD 
  }),
  
  hideNovaVendaForm: () => set({ 
    showNovaVenda: false, 
    activeSection: NavigationService.SECTIONS.DASHBOARD 
  }),
  
  resetToDefault: () => set({
    activeSection: NavigationService.SECTIONS.DASHBOARD,
    showNovaVenda: false
  }),
}));
