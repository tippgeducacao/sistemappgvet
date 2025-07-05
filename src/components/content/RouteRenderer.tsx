
import React from 'react';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import MinhasVendas from '@/components/MinhasVendas';
import GerenciarPontuacoes from '@/components/GerenciarPontuacoes';
import GerenciarCursos from '@/components/GerenciarCursos';
import GerenciarVendas from '@/components/GerenciarVendas';
import LeadsManager from '@/components/leads/LeadsManager';
import { useAuthStore } from '@/stores/AuthStore';
import { useAppStateStore } from '@/stores/AppStateStore';
import { useUserRoles } from '@/hooks/useUserRoles';

const RouteRenderer: React.FC = () => {
  const { currentUser, profile } = useAuthStore();
  const { activeSection } = useAppStateStore();
  const { isAdmin } = useUserRoles();

  // Verificar se é o admin específico
  const isSpecificAdmin = profile?.email === 'wallasmonteiro019@gmail.com';

  // Determinar tipo de usuário para o dashboard
  const userTypeForDashboard = isAdmin ? 'admin' : (currentUser?.user_type || 'vendedor');

  console.log('🔄 RouteRenderer: Seção ativa:', activeSection);
  console.log('🔄 RouteRenderer: Tipo de usuário:', userTypeForDashboard);
  console.log('🔄 RouteRenderer: isSpecificAdmin:', isSpecificAdmin);

  switch (activeSection) {
    case 'minhas-vendas':
      console.log('🔄 Renderizando: MinhasVendas');
      return <MinhasVendas />;
    case 'gerenciar-pontuacoes':
      console.log('🔄 Renderizando: GerenciarPontuacoes');
      return <GerenciarPontuacoes />;
    case 'gerenciar-cursos':
      console.log('🔄 Renderizando: GerenciarCursos');
      return <GerenciarCursos />;
    case 'gerenciar-vendas':
      console.log('🔄 Renderizando: GerenciarVendas');
      return <GerenciarVendas />;
    case 'gestao-leads':
      console.log('🔄 Renderizando: LeadsManager');
      // Apenas mostrar para admin específico
      return isSpecificAdmin ? <LeadsManager /> : <DashboardContainer userType={userTypeForDashboard} />;
    case 'dashboard':
    default:
      console.log('🔄 Renderizando: DashboardContainer');
      return (
        <DashboardContainer 
          userType={userTypeForDashboard}
        />
      );
  }
};

export default RouteRenderer;
