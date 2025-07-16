
import React from 'react';
import { useAppStateStore } from '@/stores/AppStateStore';
import { useUserRoles } from '@/hooks/useUserRoles';
import VendedorDashboard from '@/components/vendedor/VendedorDashboard';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import NovaVendaForm from '@/components/NovaVendaForm';
import GerenciarVendas from '@/components/GerenciarVendas';
import GerenciarCursos from '@/components/GerenciarCursos';
import GerenciarVendedores from '@/components/GerenciarVendedores';
import GerenciarPontuacoes from '@/components/GerenciarPontuacoes';
import MinhasVendas from '@/components/MinhasVendas';
import LeadsManager from '@/components/leads/LeadsManager';
import GerenciarNiveis from '@/components/GerenciarNiveis';
import AgendamentosPage from '@/components/agendamentos/AgendamentosPage';

const RouteRenderer: React.FC = () => {
  const { activeSection, showNovaVenda } = useAppStateStore();
  const { isDiretor, isAdmin, isSecretaria, isVendedor, isSDRInbound, isSDROutbound } = useUserRoles();

  console.log('🔄 RouteRenderer: Estado atual:', { 
    activeSection, 
    showNovaVenda, 
    isDiretor,
    isAdmin, 
    isSecretaria, 
    isVendedor 
  });

  // Se está mostrando o formulário de nova venda
  if (showNovaVenda) {
    return <NovaVendaForm onCancel={() => {}} />;
  }

  // Roteamento baseado na seção ativa
  switch (activeSection) {
    case 'dashboard':
      if (isVendedor) {
        return <VendedorDashboard />;
      }
      // Para diretor, admin e secretaria, usar o DashboardContainer completo
      return <DashboardContainer userType={isDiretor ? 'diretor' : (isAdmin ? 'admin' : 'secretaria')} />;

    case 'gerenciar-vendas':
      return <GerenciarVendas />;

    case 'gerenciar-cursos':
      // Apenas admin, secretaria e diretor podem gerenciar cursos
      if (isAdmin || isSecretaria || isDiretor) {
        return <GerenciarCursos />;
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas administradores podem gerenciar cursos.</p>
        </div>
      );

    case 'gerenciar-vendedores':
      // Apenas diretores podem gerenciar usuários
      if (isDiretor) {
        return <GerenciarVendedores />;
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas diretores podem gerenciar usuários.</p>
        </div>
      );

    case 'gerenciar-pontuacoes':
      // Apenas diretores podem acessar esta seção
      if (isDiretor) {
        return <GerenciarPontuacoes />;
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas diretores podem acessar esta seção.</p>
        </div>
      );

    case 'minhas-vendas':
      return <MinhasVendas />;

    case 'nova-venda':
      // Apenas vendedores podem acessar - diretores, admins e secretarias não podem
      if (isVendedor && !isDiretor && !isAdmin && !isSecretaria) {
        return <NovaVendaForm onCancel={() => {}} />;
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas vendedores podem criar vendas.</p>
        </div>
      );

    case 'gestao-leads':
      return <LeadsManager />;

    case 'agendamentos':
      // Apenas SDRs (inbound e outbound) podem acessar agendamentos
      if (isSDRInbound || isSDROutbound) {
        return <AgendamentosPage />;
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas SDRs podem acessar agendamentos.</p>
        </div>
      );

    case 'gerenciar-niveis':
      // Apenas admin e diretor podem gerenciar níveis
      if (isAdmin || isDiretor) {
        return <GerenciarNiveis />;
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas administradores e diretores podem gerenciar níveis.</p>
        </div>
      );


    default:
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Página não encontrada</h1>
          <p className="text-gray-600 mt-2">A seção "{activeSection}" não foi encontrada.</p>
        </div>
      );
  }
};

export default RouteRenderer;
