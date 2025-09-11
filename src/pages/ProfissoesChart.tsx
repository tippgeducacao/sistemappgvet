import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import UserGuard from '@/components/ui/user-guard';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAllLeads } from '@/hooks/useLeads';
import ProfissoesLeadsChart from '@/components/charts/ProfissoesLeadsChart';
import ProfissoesIntegrationExample from '@/components/dashboard/ProfissoesIntegrationExample';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ProfissoesChart: React.FC = () => {
  const { user, currentUser, loading } = useUserManagement();
  const { data: leads = [], isLoading } = useAllLeads();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <UserGuard user={user} loading={loading}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border/60 px-6 bg-card/60 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="hover:bg-primary/10 hover:text-primary rounded-md transition-colors" />
              <h1 className="text-xl font-semibold text-foreground">Profissões dos Leads</h1>
            </div>
          </header>
          
          <main className="flex-1 p-6 bg-muted/30">
            <div className="max-w-6xl mx-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                  <span className="ml-3 text-muted-foreground">Carregando dados dos leads...</span>
                </div>
              ) : (
                <Tabs defaultValue="exemplo" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="exemplo">Exemplo Completo</TabsTrigger>
                    <TabsTrigger value="simples">Gráfico Simples</TabsTrigger>
                    <TabsTrigger value="compacto">Versão Compacta</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="exemplo" className="mt-6">
                    <ProfissoesIntegrationExample />
                  </TabsContent>
                  
                  <TabsContent value="simples" className="mt-6">
                    <ProfissoesLeadsChart 
                      leads={leads}
                      title="Profissões dos Leads - Gráfico Simples"
                      showDetails={true}
                      height="h-[500px]"
                    />
                  </TabsContent>
                  
                  <TabsContent value="compacto" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ProfissoesLeadsChart 
                        leads={leads}
                        title="Visão Compacta"
                        showDetails={false}
                        height="h-[350px]"
                      />
                      
                      <ProfissoesLeadsChart 
                        leads={leads}
                        title="Outra Instância"
                        showDetails={false}
                        height="h-[350px]"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </UserGuard>
  );
};

export default ProfissoesChart;