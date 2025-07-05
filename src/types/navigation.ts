
export type NavigationSection = 
  | 'dashboard'
  | 'nova-venda' 
  | 'minhas-vendas'
  | 'gerenciar-vendas'
  | 'gerenciar-vendedores'
  | 'gerenciar-cursos' 
  | 'gerenciar-pontuacoes'
  | 'gestao-leads';

export interface NavigationState {
  activeSection: NavigationSection;
  showNovaVenda: boolean;
}

export interface PageMetadata {
  title: string;
  description: string;
}

export interface MenuItem {
  title: string;
  section: NavigationSection;
  icon: string;
}
