
import React, { useState } from 'react';
import DashboardMetricsCards from './DashboardMetricsCards';
import SalesChart from './SalesChart';
import StatusDistributionChart from './StatusDistributionChart';
import SalesByCourseChart from './SalesByCourseChart';
import VendorsRanking from './VendorsRanking';
import RecentSales from './RecentSales';
import MonthYearFilter from '@/components/common/MonthYearFilter';
import { useUserRoles } from '@/hooks/useUserRoles';
import type { UserType } from '@/types/user';

interface DashboardContainerProps {
  userType: UserType;
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({ userType }) => {
  const { isAdmin, isSecretaria } = useUserRoles();
  
  // Estados para filtro por período
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  console.log('📊 DashboardContainer - Configuração:', {
    userType,
    isAdmin,
    isSecretaria,
    shouldShowFullDashboard: isAdmin || isSecretaria,
    selectedMonth,
    selectedYear
  });

  // Admin, secretaria (que agora é admin) veem o dashboard completo
  if (isAdmin || isSecretaria || userType === 'admin' || userType === 'secretaria') {
    return (
      <div className="space-y-6">
        <MonthYearFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
        />
        
        <DashboardMetricsCards 
          userType="admin" 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesChart />
          <StatusDistributionChart />
        </div>

        <SalesByCourseChart />

        <VendorsRanking />
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
      
      <RecentSales />
    </div>
  );
};

export default DashboardContainer;
