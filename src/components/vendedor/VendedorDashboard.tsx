
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/AuthStore';
import { useVendas } from '@/hooks/useVendas';
import DashboardMetricsCards from '@/components/dashboard/DashboardMetricsCards';
import VendedorMetas from '@/components/dashboard/VendedorMetas';
import VendedorMetasDiarias from '@/components/dashboard/VendedorMetasDiarias';
import { ReunioesChart } from '@/components/dashboard/ReunioesChart';
import MonthYearFilter from '@/components/common/MonthYearFilter';
import { FileText } from 'lucide-react';

const VendedorDashboard: React.FC = () => {
  const { profile } = useAuthStore();
  const { vendas } = useVendas();

  // Estado para filtros de período
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  return (
    <div className="space-y-6">
      {/* Header sem botão Nova Venda */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {profile?.name || 'Vendedor'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas vendas e acompanhe seu desempenho
        </p>
      </div>

      {/* Filtro por período */}
      <MonthYearFilter
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />

      {/* Cards de métricas */}
      <DashboardMetricsCards
        userType="vendedor"
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* Metas Diárias */}
      <VendedorMetasDiarias
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* Metas do Vendedor */}
      <VendedorMetas
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* Gráfico de Pizza das Reuniões */}
      <ReunioesChart />
      <Card>
        <CardHeader>
          <CardTitle>Minhas Vendas Recentes</CardTitle>
          <CardDescription>
            Suas últimas vendas cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma venda cadastrada ainda</p>
              <p className="text-sm">Acesse a aba "Nova Venda" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vendas.slice(0, 5).map((venda) => (
                <div key={venda.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{venda.aluno?.nome || 'Nome não informado'}</p>
                    <p className="text-sm text-muted-foreground">
                      {venda.curso?.nome || 'Curso não informado'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {venda.enviado_em ? new Date(venda.enviado_em).toLocaleDateString('pt-BR') : 'Data não informada'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      venda.status === 'matriculado' ? 'bg-green-100 text-green-800' :
                      venda.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {venda.status === 'matriculado' ? 'Matriculado' :
                       venda.status === 'pendente' ? 'Pendente' : 'Rejeitado'}
                    </div>
                    <p className="text-sm font-medium mt-1">
                      {venda.pontuacao_esperada || 0} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendedorDashboard;
