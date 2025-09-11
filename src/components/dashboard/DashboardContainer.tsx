
import React, { useState, useEffect, useMemo } from 'react';
import MonthYearSelector from '@/components/common/MonthYearSelector';
import DashboardMetricsCards from './DashboardMetricsCards';
import SalesChart from './SalesChart';
import StatusDistributionChart from './StatusDistributionChart';
import SalesByCourseChart from './SalesByCourseChart';
import MiniTVDisplay from './MiniTVDisplay';
import RecentSales from './RecentSales';
import VendorsRanking from './VendorsRanking';
import VendedorMetas from './VendedorMetas';
import WeeklyApprovedSalesChart from './WeeklyApprovedSalesChart';
import GoalsAchievementChart from './GoalsAchievementChart';
import { ReunioesAdminChart } from './ReunioesAdminChart';
import { ReunioesVendedoresChart } from './ReunioesVendedoresChart';
import ProfissoesLeadsChart from '@/components/charts/ProfissoesLeadsChart';

import PendingVendasAlert from '@/components/alerts/PendingVendasAlert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Copy } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useToast } from '@/hooks/use-toast';
import { useAllLeads } from '@/hooks/useLeads';
import type { UserType } from '@/types/user';

interface DashboardContainerProps {
  userType: UserType;
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({ userType }) => {
  const { isDiretor, isAdmin, isSecretaria } = useUserRoles();
  const { vendedores } = useVendedores();
  const { toast } = useToast();
  const { data: allLeads } = useAllLeads();
  
  // Usar lógica de semanas consistente - igual aos SDRs
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  const { mes: mesCorreto, ano: anoCorreto } = getMesAnoSemanaAtual();
  const [selectedMonth, setSelectedMonth] = useState(mesCorreto);
  const [selectedYear, setSelectedYear] = useState(anoCorreto);
  
  console.log('🚨 DASHBOARD FINAL - Usando lógica de semanas:', { selectedMonth, selectedYear, mesCorreto, anoCorreto });
  
  // Estado para filtro por vendedor
  const [selectedVendedor, setSelectedVendedor] = useState<string>('todos');

  const handleCopyTVLink = () => {
    const tvUrl = `${window.location.origin}/tv-ranking`;
    navigator.clipboard.writeText(tvUrl).then(() => {
      toast({
        title: "Link copiado!",
        description: "Link da TV do ranking copiado para a área de transferência.",
      });
    });
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  console.log('📊 DashboardContainer - Configuração:', {
    userType,
    isDiretor,
    isAdmin,
    isSecretaria,
    shouldShowFullDashboard: isDiretor || isAdmin || isSecretaria,
    selectedMonth,
    selectedYear
  });

  // Diretor, Admin, secretaria veem o dashboard completo
  if (isDiretor || isAdmin || isSecretaria || userType === 'diretor' || userType === 'admin' || userType === 'secretaria') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Vendedor:</span>
            <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecionar vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Vendedores</SelectItem>
                {vendedores.map((vendedor) => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>
                    {vendedor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => window.open('/tv-ranking', '_blank')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Monitor className="h-4 w-4" />
              Abrir TV (público)
            </Button>
            <Button
              onClick={handleCopyTVLink}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar link
            </Button>
          </div>
        </div>
        
        <DashboardMetricsCards 
          userType="admin" 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          selectedVendedor={selectedVendedor}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesChart 
            selectedVendedor={selectedVendedor}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
          <StatusDistributionChart 
            selectedVendedor={selectedVendedor}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </div>

        <SalesByCourseChart 
          selectedVendedor={selectedVendedor}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        <WeeklyApprovedSalesChart 
          selectedVendedor={selectedVendedor}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        <GoalsAchievementChart 
          selectedVendedor={selectedVendedor}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        <ReunioesAdminChart selectedSDR={selectedVendedor} />

        {/* <ReunioesVendedoresChart selectedVendedor={selectedVendedor} /> */}

        <MiniTVDisplay 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        <ProfissoesLeadsChart 
          leads={allLeads || []}
          title="Profissões dos Leads"
          showDetails={true}
          height="h-[400px]"
        />

        <VendorsRanking
          selectedVendedor={selectedVendedor}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />

        {/* Filtro de mês/ano será adicionado aqui conforme necessário */}
      </div>
    );
  }

  // Dashboard do Vendedor
  return (
    <div className="space-y-6">
      <DashboardMetricsCards 
        userType="vendedor" 
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
      
      <VendedorMetas 
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
      
      <RecentSales />
    </div>
  );
};

export default DashboardContainer;
