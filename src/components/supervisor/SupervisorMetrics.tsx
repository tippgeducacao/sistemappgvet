import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Copy } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useToast } from '@/hooks/use-toast';

// Import dos componentes de gráficos do admin
import DashboardMetricsCards from '@/components/dashboard/DashboardMetricsCards';
import SalesChart from '@/components/dashboard/SalesChart';
import StatusDistributionChart from '@/components/dashboard/StatusDistributionChart';
import SalesByCourseChart from '@/components/dashboard/SalesByCourseChart';
import WeeklyApprovedSalesChart from '@/components/dashboard/WeeklyApprovedSalesChart';
import { SDRPerformanceTable } from '@/components/dashboard/SDRPerformanceTable';
import { VendedorPerformanceTable } from '@/components/dashboard/VendedorPerformanceTable';
import MiniTVDisplay from '@/components/dashboard/MiniTVDisplay';
import VendorsRanking from '@/components/dashboard/VendorsRanking';

const SupervisorMetrics: React.FC = () => {
  const { vendedores } = useVendedores();
  const { toast } = useToast();
  
  // Usar lógica de semanas consistente - igual aos SDRs
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  const { mes: mesCorreto, ano: anoCorreto } = getMesAnoSemanaAtual();
  const [selectedMonth, setSelectedMonth] = useState(mesCorreto);
  const [selectedYear, setSelectedYear] = useState(anoCorreto);
  
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Métricas e Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      
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

      <VendedorPerformanceTable />

      <SDRPerformanceTable />

      <MiniTVDisplay
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      <VendorsRanking
        selectedVendedor={selectedVendedor}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
    </div>
  );
};

export default SupervisorMetrics;