
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
  ADMIN_MENU_ITEMS, 
  SECRETARY_MENU_ITEMS, 
  VENDOR_MENU_ITEMS
} from '@/constants/sidebarMenus';
import * as Icons from 'lucide-react';
import type { MenuItem } from '@/types/navigation';

const SidebarMenuComponent: React.FC = () => {
  const { activeSection, navigateToSection } = useAppStateStore();
  const { currentUser, profile } = useAuthStore();
  const { isAdmin, isSecretaria, isVendedor } = useUserRoles();

  console.log('🔄 SidebarMenuComponent: Estados atuais:', { 
    activeSection, 
    isAdmin, 
    isSecretaria, 
    isVendedor,
    userEmail: profile?.email || currentUser?.email 
  });

  // Determinar menu baseado no tipo de usuário
  let menuItems: MenuItem[] = VENDOR_MENU_ITEMS;
  
  if (isAdmin) {
    // Admin tem acesso a TODOS os menus
    menuItems = ADMIN_MENU_ITEMS;
  } else if (isSecretaria) {
    menuItems = SECRETARY_MENU_ITEMS;
  } else if (isVendedor) {
    menuItems = VENDOR_MENU_ITEMS;
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
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
      <SidebarMenu>
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
              className="w-full cursor-pointer"
            >
              {getIcon(item.icon)}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default SidebarMenuComponent;
