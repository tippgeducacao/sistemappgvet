
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
  url: string;
  icon: string;
  section: NavigationSection;
}
