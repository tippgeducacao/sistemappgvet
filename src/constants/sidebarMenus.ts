
import type { MenuItem, MenuGroup } from '@/types/navigation';

// Dashboard principal - sem grupo
export const DIRECTOR_MAIN_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    section: 'dashboard',
    icon: 'BarChart3'
  },
  {
    title: 'Agendamentos',
    section: 'agendamentos',
    icon: 'Calendar'
  }
];

// Menus agrupados do diretor
export const DIRECTOR_GROUPED_MENU: MenuGroup[] = [
  {
    title: 'Gestão Acadêmica',
    items: [
      {
        title: 'Gerenciar Cursos',
        section: 'gerenciar-cursos',
        icon: 'GraduationCap'
      },
      {
        title: 'Perfis de Usuários',
        section: 'gerenciar-perfis',
        icon: 'UserCog'
      },
      {
        title: 'Gerenciar Usuários',
        section: 'gerenciar-vendedores',
        icon: 'Users'
      },
      {
        title: 'Grupos Supervisores',
        section: 'gerenciar-grupos',
        icon: 'UsersRound'
      }
    ]
  },
  {
    title: 'Gestão Comercial',
    items: [
      {
        title: 'Gerenciar Vendas',
        section: 'gerenciar-vendas',
        icon: 'FileText'
      },
      {
        title: 'Gestão de Leads',
        section: 'gestao-leads',
        icon: 'Target'
      },
      {
        title: 'Indicações',
        section: 'indicacoes',
        icon: 'Share'
      }
    ]
  },
  {
    title: 'Gestão de Performance',
    items: [
      {
        title: 'Gerenciar Pontuações',
        section: 'gerenciar-pontuacoes',
        icon: 'Star'
      },
      {
        title: 'Gerenciar Níveis',
        section: 'gerenciar-niveis',
        icon: 'Trophy'
      },
      {
        title: 'Eventos Recorrentes',
        section: 'eventos-recorrentes',
        icon: 'CalendarCheck'
      }
    ]
  }
];

// Menu original do diretor para compatibilidade
export const DIRECTOR_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    section: 'dashboard',
    icon: 'BarChart3'
  },
  {
    title: 'Agendamentos',
    section: 'agendamentos',
    icon: 'Calendar'
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
    title: 'Perfis de Usuários',
    section: 'gerenciar-perfis',
    icon: 'UserCog'
  },
  {
    title: 'Gerenciar Usuários',
    section: 'gerenciar-vendedores',
    icon: 'Users'
  },
  {
    title: 'Grupos Supervisores',
    section: 'gerenciar-grupos',
    icon: 'UsersRound'
  },
  {
    title: 'Gerenciar Pontuações',
    section: 'gerenciar-pontuacoes',
    icon: 'Star'
  },
  {
    title: 'Gestão de Leads',
    section: 'gestao-leads',
    icon: 'Target'
  },
  {
    title: 'Indicações',
    section: 'indicacoes',
    icon: 'Share'
  },
  {
    title: 'Gerenciar Níveis',
    section: 'gerenciar-niveis',
    icon: 'Trophy'
  },
  {
    title: 'Eventos Recorrentes',
    section: 'eventos-recorrentes',
    icon: 'CalendarCheck'
  }
];

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    section: 'dashboard',
    icon: 'BarChart3'
  },
  {
    title: 'Agendamentos',
    section: 'agendamentos',
    icon: 'Calendar'
  },
  {
    title: 'Gestão de Leads',
    section: 'gestao-leads',
    icon: 'Target'
  },
  {
    title: 'Indicações',
    section: 'indicacoes',
    icon: 'Share'
  },
  {
    title: 'Perfis de Usuários',
    section: 'gerenciar-perfis',
    icon: 'UserCog'
  },
  {
    title: 'Gerenciar Vendas',
    section: 'gerenciar-vendas',
    icon: 'FileText'
  },
  {
    title: 'Ir para o sistema financeiro',
    section: 'sistema-financeiro',
    icon: 'DollarSign'
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
];

export const VENDOR_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    section: 'dashboard',
    icon: 'BarChart3'
  },
  {
    title: 'Nova Venda',
    section: 'nova-venda',
    icon: 'Plus'
  },
  {
    title: 'Minhas Vendas',
    section: 'minhas-vendas',
    icon: 'ShoppingCart'
  },
  {
    title: 'Reuniões',
    section: 'reunioes',
    icon: 'Calendar'
  },
  {
    title: 'Relatório Diário',
    section: 'relatorio-diario',
    icon: 'FileText'
  }
];

export const COORDINATOR_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    section: 'dashboard',
    icon: 'BarChart3'
  },
  {
    title: 'Gestão de Leads',
    section: 'gestao-leads',
    icon: 'Target'
  },
  {
    title: 'Agendamentos',
    section: 'agendamentos',
    icon: 'Calendar'
  },
  {
    title: 'Gerenciar Vendas',
    section: 'gerenciar-vendas',
    icon: 'FileText'
  },
  {
    title: 'Gerenciar Usuários',
    section: 'gerenciar-vendedores',
    icon: 'Users'
  },
  {
    title: 'Nova Venda',
    section: 'nova-venda',
    icon: 'Plus'
  },
  {
    title: 'Minhas Vendas',
    section: 'minhas-vendas',
    icon: 'ShoppingCart'
  },
  {
    title: 'Relatório Diário',
    section: 'relatorio-diario',
    icon: 'FileText'
  }
];

export const SUPERVISOR_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    section: 'dashboard',
    icon: 'BarChart3'
  },
  {
    title: 'Gestão de Leads',
    section: 'gestao-leads',
    icon: 'Target'
  },
  {
    title: 'Agendamentos',
    section: 'agendamentos',
    icon: 'Calendar'
  },
  {
    title: 'Gerenciar Vendas',
    section: 'gerenciar-vendas',
    icon: 'ShoppingCart'
  },
  {
    title: 'Métricas',
    section: 'metricas',
    icon: 'TrendingUp'
  }
];

export const SDR_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    section: 'dashboard',
    icon: 'BarChart3'
  },
  {
    title: 'Gestão de Leads',
    section: 'gestao-leads',
    icon: 'Users'
  },
  {
    title: 'Agendamentos',
    section: 'agendamentos',
    icon: 'Calendar'
  },
  {
    title: 'Nova Venda',
    section: 'nova-venda',
    icon: 'Plus'
  },
];

