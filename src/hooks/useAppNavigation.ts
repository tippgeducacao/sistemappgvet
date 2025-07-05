
import { useAppStateStore } from '@/stores/AppStateStore';

interface AppNavigationHook {
  activeSection: string;
  showNovaVenda: boolean;
  navigateToSection: (section: string) => void;
  showNovaVendaForm: () => void;
  hideNovaVendaForm: () => void;
  setActiveSection: (section: string) => void;
}

export const useAppNavigation = (): AppNavigationHook => {
  const { 
    activeSection, 
    showNovaVenda, 
    navigateToSection, 
    showNovaVendaForm, 
    hideNovaVendaForm 
  } = useAppStateStore();

  console.log('🔄 useAppNavigation: Hook chamado com activeSection:', activeSection);

  return {
    activeSection,
    showNovaVenda,
    navigateToSection,
    showNovaVendaForm,
    hideNovaVendaForm,
    setActiveSection: navigateToSection, // Alias para compatibilidade
  };
};
