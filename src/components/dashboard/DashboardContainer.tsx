
import React, { useState, useEffect, useMemo } from 'react';
import DashboardMetricsCards from './DashboardMetricsCards';
import SalesChart from './SalesChart';
import StatusDistributionChart from './StatusDistributionChart';
import SalesByCourseChart from './SalesByCourseChart';
import VendorsRanking from './VendorsRanking';
import RecentSales from './RecentSales';
import VendedorMetas from './VendedorMetas';
import WeeklyApprovedSalesChart from './WeeklyApprovedSalesChart';
import GoalsAchievementChart from './GoalsAchievementChart';
import { ReunioesAdminChart } from './ReunioesAdminChart';

import MonthYearFilter from '@/components/common/MonthYearFilter';
import PendingVendasAlert from '@/components/alerts/PendingVendasAlert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import type { UserType } from '@/types/user';

interface DashboardContainerProps {
  userType: UserType;
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({ userType }) => {
  const { isDiretor, isAdmin, isSecretaria } = useUserRoles();
  const { vendedores } = useVendedores();
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  
  // Estados - inicializar com valores que serão atualizados pelo useEffect
  const [selectedMonth, setSelectedMonth] = useState(8); // Padrão agosto
  const [selectedYear, setSelectedYear] = useState(2025);
  
  // Atualizar sempre que o componente montar ou a função mudar
  useEffect(() => {
    const { mes, ano } = getMesAnoSemanaAtual();
    console.log('🚨 DASHBOARD useEffect EXECUTANDO - Valores da função:', mes, ano);
    console.log('🚨 DASHBOARD useEffect - Estados atuais:', selectedMonth, selectedYear);
    
    // Sempre atualizar, mesmo que sejam iguais
    setSelectedMonth(mes);
    setSelectedYear(ano);
    
    console.log('🚨 DASHBOARD useEffect - Estados atualizados para:', mes, ano);
  }, []);
  
  // Estado para filtro por vendedor
  const [selectedVendedor, setSelectedVendedor] = useState<string>('todos');

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
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <MonthYearFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
          />
          
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

        <VendorsRanking 
          selectedVendedor={selectedVendedor}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      </div>
    );
  }

  // Dashboard do Vendedor
  return (
    <div className="space-y-6">
      <MonthYearFilter
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={handleMonthChange}
        onYearChange={handleYearChange}
      />
      
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
