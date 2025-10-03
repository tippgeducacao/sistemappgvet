
import React, { useState } from 'react';
import ProfissoesLeadsChart from '@/components/charts/ProfissoesLeadsChart';
import PaginasLeadsChart from '@/components/charts/PaginasLeadsChart';
import { EstadosLeadsChart } from '@/components/charts/EstadosLeadsChart';
import { LeadsResumoCard } from './LeadsResumoCard';
import LeadsListModal from './LeadsListModal';
import type { Lead } from '@/hooks/useLeads';

interface LeadsDashboardProps {
  leads: Lead[];
}

const LeadsDashboard: React.FC<LeadsDashboardProps> = ({ leads }) => {
  console.log('🔍 LeadsDashboard recebeu leads:', leads?.length || 0);
  console.log('📋 Primera amostra de leads:', leads?.slice(0, 2));

  // Estado para o modal de leads
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPageLeads, setSelectedPageLeads] = useState<Lead[]>([]);
  const [selectedPageName, setSelectedPageName] = useState('');

  // Função para lidar com clique na página
  const handlePageClick = (pageName: string, pageLeads: Lead[]) => {
    setSelectedPageName(pageName);
    setSelectedPageLeads(pageLeads);
    setIsModalOpen(true);
  };

  // Verificar se temos leads
  if (!leads || leads.length === 0) {
    console.log('⚠️ Nenhum lead disponível para dashboard');
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfissoesLeadsChart 
          leads={[]} 
          title="Profissões dos Leads"
          showDetails={false}
          height="400px"
        />
        <PaginasLeadsChart 
          leads={[]} 
          title="Páginas dos Leads"
          showDetails={false}
          height="400px"
        />
        <EstadosLeadsChart 
          leads={[]} 
          title="Estados dos Leads"
          showDetails={false}
          height="400px"
        />
        <LeadsResumoCard 
          leads={[]} 
          title="Resumo Geral"
        />
      </div>
    );
  }

  console.log('📈 Renderizando dashboard com', leads.length, 'leads');

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primeira linha: Profissões e Páginas */}
        <ProfissoesLeadsChart 
          leads={leads} 
          title="Profissões dos Leads"
          showDetails={false}
          height="400px"
        />
        
        <PaginasLeadsChart 
          leads={leads} 
          title="Páginas dos Leads"
          showDetails={false}
          height="400px"
          onPageClick={handlePageClick}
        />
        
        {/* Segunda linha: Estados e Resumo */}
        <EstadosLeadsChart 
          leads={leads} 
          title="Estados dos Leads"
          showDetails={false}
          height="400px"
          onStateClick={handlePageClick}
        />
        
        <LeadsResumoCard 
          leads={leads} 
          title="Resumo Geral"
        />
      </div>

      {/* Modal para exibir lista de leads */}
      <LeadsListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leads={selectedPageLeads}
        pageTitle={`Leads - ${selectedPageName}`}
      />
    </>
  );
};

export default LeadsDashboard;
