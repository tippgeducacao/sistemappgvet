
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
  
  // Usar lógica de semanas consistente - igual aos SDRs
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  const { mes: mesCorreto, ano: anoCorreto } = getMesAnoSemanaAtual();
  const [selectedMonth, setSelectedMonth] = useState(mesCorreto);
  const [selectedYear, setSelectedYear] = useState(anoCorreto);
  
  console.log('🚨 DASHBOARD FINAL - Usando lógica de semanas:', { selectedMonth, selectedYear, mesCorreto, anoCorreto });
  
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

        <div style={{backgroundColor: 'red', padding: '20px', margin: '10px', border: '2px solid black'}}>
          <h2 style={{color: 'white'}}>TESTE - GRÁFICO SDR DEVERIA APARECER AQUI</h2>
          <ReunioesAdminChart selectedSDR={selectedVendedor} />
        </div>

        <div style={{backgroundColor: 'blue', padding: '20px', margin: '10px', border: '2px solid black'}}>
          <h2 style={{color: 'white'}}>TESTE - GRÁFICO VENDEDORES DEVERIA APARECER AQUI</h2>
          <ReunioesVendedoresChart selectedVendedor={selectedVendedor} />
        </div>

        <MiniTVDisplay 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
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
