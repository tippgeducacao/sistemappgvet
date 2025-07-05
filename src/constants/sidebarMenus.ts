
import { NavigationService } from "@/services/navigation/NavigationService";
import type { MenuItem } from "@/types/navigation";

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    title: "Dashboard",
    url: "#",
    icon: "LayoutDashboard",
    section: "dashboard",
  },
  {
    title: "Gerenciar Cursos",
    url: "#",
    icon: "Book",
    section: "gerenciar-cursos",
  },
  {
    title: "Gerenciar Vendas",
    url: "#",
    icon: "Coins",
    section: "gerenciar-vendas",
  },
];

export const SECRETARY_MENU_ITEMS: MenuItem[] = [
  {
    title: "Dashboard",
    url: "#",
    icon: "LayoutDashboard",
    section: "dashboard",
  },
  {
    title: "Gerenciar Vendas",
    url: "#",
    icon: "Coins",
    section: "gerenciar-vendas",
  },
];

export const VENDOR_MENU_ITEMS: MenuItem[] = [
  {
    title: "Dashboard",
    url: "#",
    icon: "LayoutDashboard",
    section: "dashboard",
  },
  {
    title: "Minhas Vendas",
    url: "#",
    icon: "ShoppingCart",
    section: "minhas-vendas",
  },
];

// Itens específicos apenas para o admin autorizado
export const ADMIN_SPECIFIC_MENU: MenuItem[] = [
  {
    title: "Gestão de Leads",
    url: "#",
    icon: "Users",
    section: "gestao-leads",
  },
  {
    title: "Gerenciar Pontuações",
    url: "#",
    icon: "Star",
    section: "gerenciar-pontuacoes",
  },
];
