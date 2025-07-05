
import type { MenuItem } from '@/types/navigation';

export const adminMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    section: "dashboard",
    icon: "BarChart3",
    url: "/dashboard"
  },
  {
    title: "Gerenciar Vendas",
    section: "gerenciar-vendas",
    icon: "ClipboardCheck",
    url: "/vendas"
  },
  {
    title: "Gerenciar Cursos",
    section: "gerenciar-cursos",
    icon: "BookOpen",
    url: "/cursos"
  },
  {
    title: "Gerenciar Vendedores",
    section: "gerenciar-vendedores",
    icon: "Users",
    url: "/vendedores"
  },
  {
    title: "Gerenciar Pontuações",
    section: "gerenciar-pontuacoes",
    icon: "Target",
    url: "/pontuacoes"
  }
];

export const secretariaMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    section: "dashboard",
    icon: "BarChart3",
    url: "/dashboard"
  },
  {
    title: "Gerenciar Vendas",
    section: "gerenciar-vendas",
    icon: "ClipboardCheck",
    url: "/vendas"
  },
  {
    title: "Gerenciar Cursos",
    section: "gerenciar-cursos",
    icon: "BookOpen",
    url: "/cursos"
  },
  {
    title: "Gerenciar Vendedores",
    section: "gerenciar-vendedores",
    icon: "Users",
    url: "/vendedores"
  }
];

export const vendedorMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    section: "dashboard",
    icon: "BarChart3",
    url: "/dashboard"
  },
  {
    title: "Minhas Vendas",
    section: "minhas-vendas",
    icon: "FileText",
    url: "/minhas-vendas"
  },
  {
    title: "Nova Venda",
    section: "nova-venda",
    icon: "Plus",
    url: "/nova-venda"
  },
  {
    title: "Gestão de Leads",
    section: "gestao-leads",
    icon: "Users",
    url: "/leads"
  }
];
