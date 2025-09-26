
import React from 'react';
import { useAppStateStore } from '@/stores/AppStateStore';
import { useUserRoles } from '@/hooks/useUserRoles';
import VendedorDashboard from '@/components/vendedor/VendedorDashboard';
import SDRDashboard from '@/components/sdr/SDRDashboard';
import SupervisorSimpleDashboard from '@/components/supervisor/SupervisorSimpleDashboard';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import NovaVendaForm from '@/components/NovaVendaForm';
import GerenciarVendas from '@/components/GerenciarVendas';

import GerenciarCursos from '@/components/GerenciarCursos';
import GerenciarVendedores from '@/components/GerenciarVendedores';
import GerenciarPontuacoes from '@/components/GerenciarPontuacoes';
import MinhasVendas from '@/components/MinhasVendas';
import LeadsManager from '@/components/leads/LeadsManager';
import GerenciarIndicacoes from '@/components/GerenciarIndicacoes';
import GerenciarNiveis from '@/components/GerenciarNiveis';
import AgendamentosPage from '@/components/agendamentos/AgendamentosPage';
import { GerenciarEventosRecorrentes } from '@/components/agendamentos/GerenciarEventosRecorrentes';
import VendedorReunioes from '@/components/vendedor/VendedorReunioes';
import { RelatorioDiario } from '@/components/vendedor/RelatorioDiario';

// Precarregar componentes lazy fora do corpo do componente para manter ordem estável
const LazySupervisorDashboardAtualizado = React.lazy(() => import('@/components/supervisor/SupervisorDashboardAtualizado'));
const LazyGerenciarGrupos = React.lazy(() => import('@/components/supervisor/GerenciarGrupos'));
const LazyGerenciarPerfis = React.lazy(() => import('@/components/GerenciarPerfis'));
const LazySupervisorMetrics = React.lazy(() => import('@/components/supervisor/SupervisorMetrics'));

const RouteRenderer: React.FC = () => {
  const { activeSection, showNovaVenda } = useAppStateStore();
  const { isDiretor, isAdmin, isSecretaria, isVendedor, isSDR, isSupervisor } = useUserRoles();

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
      if (isSDR) {
        return <SDRDashboard />;
      }
      if (isSupervisor) {
        return (
          <React.Suspense fallback={<div>Carregando...</div>}>
            <LazySupervisorDashboardAtualizado />
          </React.Suspense>
        );
      }
      // Para diretor, admin e secretaria, usar o DashboardContainer completo
      return <DashboardContainer userType={isDiretor ? 'diretor' : (isAdmin ? 'admin' : 'secretaria')} />;

    case 'gerenciar-vendas':
      // Supervisores, diretores, admin e secretaria podem acessar
      if (isSupervisor || isDiretor || isAdmin || isSecretaria) {
        return <GerenciarVendas />;
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Você não tem permissão para acessar esta seção.</p>
        </div>
      );

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

    case 'gerenciar-grupos':
      // Apenas diretores podem gerenciar grupos supervisores
      if (isDiretor) {
        return (
          <React.Suspense fallback={<div>Carregando...</div>}>
            <LazyGerenciarGrupos />
          </React.Suspense>
        );
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas diretores podem gerenciar grupos supervisores.</p>
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
      // Apenas vendedores podem acessar - SDRs, diretores, admins e secretarias não podem
      if (isVendedor && !isSDR && !isDiretor && !isAdmin && !isSecretaria) {
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

    case 'indicacoes':
      // Apenas admin e diretor podem acessar indicações
      if (isAdmin || isDiretor) {
        return <GerenciarIndicacoes />;
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas administradores e diretores podem acessar indicações.</p>
        </div>
      );

    case 'agendamentos':
      // SDRs, supervisores, diretores e administradores podem acessar agendamentos
      if (isSDR || isSupervisor || isDiretor || isAdmin) {
        return <AgendamentosPage />;
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas SDRs, supervisores, diretores e administradores podem acessar agendamentos.</p>
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

    case 'eventos-recorrentes':
      // Apenas diretores podem gerenciar eventos recorrentes
      if (isDiretor) {
        return <GerenciarEventosRecorrentes />;
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas diretores podem gerenciar eventos recorrentes.</p>
        </div>
      );

    case 'gerenciar-perfis':
      // Apenas admin e diretor podem gerenciar perfis
      if (isAdmin || isDiretor) {
        return (
          <React.Suspense fallback={<div>Carregando...</div>}>
            <LazyGerenciarPerfis />
          </React.Suspense>
        );
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas administradores e diretores podem gerenciar perfis.</p>
        </div>
      );

    case 'reunioes':
      // Apenas vendedores podem acessar Reuniões
      if (isVendedor) {
        return <VendedorReunioes />;
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas vendedores podem acessar Reuniões.</p>
        </div>
      );

    case 'relatorio-diario':
      // Vendedores e SDRs podem acessar Relatório Diário
      if (isVendedor || isSDR) {
        return <RelatorioDiario />;
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas vendedores e SDRs podem acessar Relatório Diário.</p>
        </div>
      );

    case 'metricas':
      // Apenas supervisores podem acessar Métricas
      if (isSupervisor) {
        return (
          <React.Suspense fallback={<div>Carregando...</div>}>
            <LazySupervisorMetrics />
          </React.Suspense>
        );
      }
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas supervisores podem acessar Métricas.</p>
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
