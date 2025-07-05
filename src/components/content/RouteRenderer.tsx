
import React from 'react';
import { useAppStateStore } from '@/stores/AppStateStore';
import { useUserRoles } from '@/hooks/useUserRoles';
import VendedorDashboard from '@/components/vendedor/VendedorDashboard';
import NovaVendaForm from '@/components/forms/NovaVendaForm';
import GerenciarVendas from '@/components/GerenciarVendas';
import GerenciarCursos from '@/components/GerenciarCursos';
import GerenciarVendedores from '@/components/GerenciarVendedores';
import GerenciarPontuacoes from '@/components/GerenciarPontuacoes';
import MinhasVendas from '@/components/MinhasVendas';
import LeadsManager from '@/components/leads/LeadsManager';

const RouteRenderer: React.FC = () => {
  const { activeSection, showNovaVenda } = useAppStateStore();
  const { isAdmin, isSecretaria, isVendedor } = useUserRoles();

  console.log('🔄 RouteRenderer: Estado atual:', { 
    activeSection, 
    showNovaVenda, 
    isAdmin, 
    isSecretaria, 
    isVendedor 
  });

  // Se está mostrando o formulário de nova venda
  if (showNovaVenda) {
    return <NovaVendaForm />;
  }

  // Roteamento baseado na seção ativa
  switch (activeSection) {
    case 'dashboard':
      if (isVendedor) {
        return <VendedorDashboard />;
      }
      // Para admin e secretaria, mostrar dashboard padrão ou estatísticas
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-2">Bem-vindo ao sistema de gestão de vendas</p>
        </div>
      );

    case 'gerenciar-vendas':
      return <GerenciarVendas />;

    case 'gerenciar-cursos':
      return <GerenciarCursos />;

    case 'gerenciar-vendedores':
      return <GerenciarVendedores />;

    case 'gerenciar-pontuacoes':
      return <GerenciarPontuacoes />;

    case 'minhas-vendas':
      return <MinhasVendas />;

    case 'gestao-leads':
      return <LeadsManager />;

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
