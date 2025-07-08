
import type { MenuItem } from '@/types/navigation';

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    section: 'dashboard',
    icon: 'BarChart3'
  },
  {
    title: 'Gerenciar Vendas',
    section: 'gerenciar-vendas',
    icon: 'FileText'
  },
  {
    title: 'Gerenciar Cursos',
    section: 'gerenciar-cursos',
    icon: 'GraduationCap'
  },
  {
    title: 'Gerenciar Vendedores',
    section: 'gerenciar-vendedores',
    icon: 'Users'
  },
  {
    title: 'Gerenciar Pontuações',
    section: 'gerenciar-pontuacoes',
    icon: 'Star'
  },
  {
    title: 'Minhas Vendas',
    section: 'minhas-vendas',
    icon: 'ShoppingCart'
  },
  {
    title: 'Gestão de Leads',
    section: 'gestao-leads',
    icon: 'Target'
  }
];

export const SECRETARY_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    section: 'dashboard',
    icon: 'BarChart3'
  },
  {
    title: 'Gerenciar Vendas',
    section: 'gerenciar-vendas',
    icon: 'FileText'
  },
  {
    title: 'Gerenciar Cursos',
    section: 'gerenciar-cursos',
    icon: 'GraduationCap'
  },
  {
    title: 'Gerenciar Vendedores',
    section: 'gerenciar-vendedores',
    icon: 'Users'
  }
];

export const VENDOR_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    section: 'dashboard',
    icon: 'BarChart3'
  },
  {
    title: 'Minhas Vendas',
    section: 'minhas-vendas',
    icon: 'ShoppingCart'
  }
];

export const ADMIN_SPECIFIC_MENU: MenuItem[] = [
  {
    title: 'Gestão de Leads',
    section: 'gestao-leads',
    icon: 'Target'
  }
];
