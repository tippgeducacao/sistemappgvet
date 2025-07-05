
import React from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import SidebarHeaderComponent from '@/components/SidebarHeader';
import SidebarMenuComponent from '@/components/SidebarMenuComponent';
import SidebarFooterComponent from '@/components/SidebarFooterComponent';

const AppSidebar: React.FC = () => {
  return (
    <Sidebar>
      <SidebarHeaderComponent userType="admin" />
      <SidebarMenuComponent />
      <SidebarFooterComponent userType="admin" userName="Usuário" />
    </Sidebar>
  );
};

export default AppSidebar;
