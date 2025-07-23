
import React from 'react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/AuthStore';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAppStateStore } from '@/stores/AppStateStore';
import { 
  DIRECTOR_MENU_ITEMS,
  ADMIN_MENU_ITEMS, 
  SECRETARY_MENU_ITEMS, 
  VENDOR_MENU_ITEMS,
  SDR_MENU_ITEMS
} from '@/constants/sidebarMenus';
import * as Icons from 'lucide-react';
import type { MenuItem } from '@/types/navigation';

const SidebarMenuComponent: React.FC = () => {
  const { activeSection, navigateToSection } = useAppStateStore();
  const { currentUser, profile } = useAuthStore();
  const { isDiretor, isAdmin, isSecretaria, isVendedor, isSDR } = useUserRoles();

  console.log('🔄 SidebarMenuComponent: Estados atuais:', { 
    activeSection, 
    isDiretor,
    isAdmin, 
    isSecretaria, 
    isVendedor,
    isSDR,
    userEmail: profile?.email || currentUser?.email 
  });

  // Determinar menu baseado no tipo de usuário (hierarquia: Diretor > Admin > Vendedor > SDR)
  let menuItems: MenuItem[] = SDR_MENU_ITEMS;
  
  if (isDiretor) {
    // Diretor tem acesso total ao sistema
    menuItems = DIRECTOR_MENU_ITEMS;
  } else if (isAdmin) {
    // Admin tem acesso a todos os menus exceto pontuações (só diretor)
    menuItems = ADMIN_MENU_ITEMS;
  } else if (isSecretaria) {
    menuItems = SECRETARY_MENU_ITEMS;
  } else if (isVendedor) {
    menuItems = VENDOR_MENU_ITEMS;
  } else if (isSDR) {
    // SDR tem acesso limitado: leads, vendas (visualização), alunos
    menuItems = SDR_MENU_ITEMS;
  }

  console.log('🔄 SidebarMenuComponent: Menu items determinados:', menuItems.length);

  const handleSectionChange = (section: string) => {
    console.log('🔄 SidebarMenuComponent: Navegando para seção:', section);
    console.log('🔄 SidebarMenuComponent: Função disponível:', typeof navigateToSection);
    
    if (typeof navigateToSection === 'function') {
      navigateToSection(section);
      console.log('🔄 SidebarMenuComponent: Navegação executada');
    } else {
      console.error('🔄 SidebarMenuComponent: navigateToSection não é uma função');
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
    return IconComponent ? <IconComponent className="h-5 w-5 stroke-[1.5]" /> : null;
  };

  return (
    <SidebarGroup className="px-3 py-2">
      <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70 px-2 py-1 mb-2">
        Menu Principal
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-1">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.section}>
            <SidebarMenuButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 Clique no menu item:', item.section, item.title);
                console.log('🔄 Estado antes da navegação:', activeSection);
                handleSectionChange(item.section);
              }}
              isActive={activeSection === item.section}
              className={`
                w-full cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out
                ${activeSection === item.section 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {getIcon(item.icon)}
                <span className="truncate">{item.title}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default SidebarMenuComponent;
