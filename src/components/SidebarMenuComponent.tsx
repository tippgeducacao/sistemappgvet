
import React, { useState } from 'react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuthStore } from '@/stores/AuthStore';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAppStateStore } from '@/stores/AppStateStore';
import { 
  DIRECTOR_MENU_ITEMS,
  DIRECTOR_MAIN_ITEMS,
  DIRECTOR_GROUPED_MENU,
  ADMIN_MENU_ITEMS, 
  SECRETARY_MENU_ITEMS, 
  VENDOR_MENU_ITEMS,
  SDR_MENU_ITEMS,
  COORDINATOR_MENU_ITEMS,
  SUPERVISOR_MENU_ITEMS
} from '@/constants/sidebarMenus';
import * as Icons from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import type { MenuItem, MenuGroup } from '@/types/navigation';

const SidebarMenuComponent: React.FC = () => {
  const { activeSection, navigateToSection } = useAppStateStore();
  const { currentUser, profile } = useAuthStore();
  const { isDiretor, isAdmin, isSecretaria, isVendedor, isSDR, isCoordenador, isSupervisor } = useUserRoles();
  
  // Estado para controlar grupos expandidos/colapsados
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  console.log('🔄 SidebarMenuComponent: Estados atuais:', { 
    activeSection, 
    isDiretor,
    isAdmin, 
    isSecretaria, 
    isVendedor,
    isSDR,
    isCoordenador,
    isSupervisor,
    userEmail: profile?.email || currentUser?.email 
  });

  // Função para alternar estado do grupo
  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  // Determinar menu baseado no tipo de usuário (hierarquia: Diretor > Admin > Coordenador > Supervisor > Secretaria > Vendedor > SDR)
  let menuItems: MenuItem[] = SDR_MENU_ITEMS;
  
  if (isDiretor) {
    // Diretor tem acesso total ao sistema
    menuItems = DIRECTOR_MENU_ITEMS;
  } else if (isAdmin) {
    // Admin tem acesso a todos os menus exceto pontuações (só diretor)
    menuItems = ADMIN_MENU_ITEMS;
  } else if (isCoordenador) {
    menuItems = COORDINATOR_MENU_ITEMS;
  } else if (isSupervisor) {
    menuItems = SUPERVISOR_MENU_ITEMS;
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
    
    // Caso especial: redirecionar para sistema financeiro
    if (section === 'sistema-financeiro') {
      console.log('🔄 SidebarMenuComponent: Redirecionando para sistema financeiro');
      window.open('https://ppgfinanceiro.lovable.app/auth', '_blank');
      return;
    }
    
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
    return IconComponent ? <IconComponent className="h-4 w-4 stroke-[1.5]" /> : null;
  };

  // Renderizar menu agrupado para diretor
  if (isDiretor) {
    return (
      <div className="space-y-4">
        {/* Menu principal sem grupo */}
        <SidebarGroup className="px-4 py-2">
          <SidebarGroupLabel className="text-xs font-semibold text-primary px-0 py-2 mb-2 uppercase tracking-wide">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {DIRECTOR_MAIN_ITEMS.map((item) => (
              <SidebarMenuItem key={item.section}>
                <SidebarMenuButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSectionChange(item.section);
                  }}
                  isActive={activeSection === item.section}
                  className={`
                    w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200
                    ${activeSection === item.section 
                      ? 'bg-primary/15 text-primary border-l-4 border-primary shadow-sm font-semibold' 
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 ${activeSection === item.section ? 'text-primary' : 'text-muted-foreground'}`}>
                      {getIcon(item.icon)}
                    </div>
                    <span className="truncate">{item.title}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Grupos organizados expansíveis */}
        {DIRECTOR_GROUPED_MENU.map((group) => (
          <Collapsible
            key={group.title}
            open={expandedGroups[group.title] || false}
            onOpenChange={() => toggleGroup(group.title)}
          >
            <SidebarGroup className="px-4 py-2">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="text-xs font-semibold text-primary px-0 py-2 mb-2 uppercase tracking-wide cursor-pointer hover:text-primary/80 transition-colors flex items-center justify-between group">
                  <span>{group.title}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedGroups[group.title] ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-1">
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.section}>
                      <SidebarMenuButton
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSectionChange(item.section);
                        }}
                        isActive={activeSection === item.section}
                        className={`
                          w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200
                          ${activeSection === item.section 
                            ? 'bg-primary/15 text-primary border-l-4 border-primary shadow-sm font-semibold' 
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 ${activeSection === item.section ? 'text-primary' : 'text-muted-foreground'}`}>
                            {getIcon(item.icon)}
                          </div>
                          <span className="truncate">{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </div>
    );
  }

  // Menu padrão para outros usuários
  return (
    <SidebarGroup className="px-4 py-2">
      <SidebarGroupLabel className="text-xs font-semibold text-primary px-0 py-2 mb-2 uppercase tracking-wide">
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
                w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200
                ${activeSection === item.section 
                  ? 'bg-primary/15 text-primary border-l-4 border-primary shadow-sm font-semibold' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 ${activeSection === item.section ? 'text-primary' : 'text-muted-foreground'}`}>
                  {getIcon(item.icon)}
                </div>
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
