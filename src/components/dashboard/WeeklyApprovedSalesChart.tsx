import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useVendedores } from '@/hooks/useVendedores';
import { VendasDataService } from '@/services/vendas/VendasDataService';
import type { VendaCompleta } from '@/hooks/useVendas';

interface WeeklyData {
  week: string;
  weekStart: string;
  weekEnd: string;
  vendas: number;
}

interface WeeklyApprovedSalesChartProps {
  selectedVendedor?: string;
  selectedMonth?: number;
  selectedYear?: number;
}

const WeeklyApprovedSalesChart: React.FC<WeeklyApprovedSalesChartProps> = ({ selectedVendedor: propSelectedVendedor, selectedMonth, selectedYear }) => {
  const { vendedores } = useVendedores();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(false);

  // Função para calcular o início da semana (quarta-feira)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = domingo, 1 = segunda, etc.
    const diff = (day + 4) % 7; // Quantos dias subtrair para chegar na quarta anterior
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Função para calcular o fim da semana (terça-feira)
  const getWeekEnd = (weekStart: Date): Date => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6); // 6 dias após a quarta = terça
    d.setHours(23, 59, 59, 999);
    return d;
  };

  // Função para gerar semanas dos últimos 8 períodos
  const generateWeeks = (): Array<{ start: Date; end: Date; label: string }> => {
    const weeks = [];
    const today = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const baseDate = new Date(today);
      baseDate.setDate(today.getDate() - (i * 7));
      
      const weekStart = getWeekStart(baseDate);
      const weekEnd = getWeekEnd(weekStart);
      
      const startStr = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
      const endStr = `${weekEnd.getDate().toString().padStart(2, '0')}/${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}`;
      
      weeks.push({
        start: weekStart,
        end: weekEnd,
        label: `${startStr} - ${endStr}`
      });
    }
    
    return weeks;
  };

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      console.log('📊 WEEKLY CHART: Buscando dados de vendas aprovadas por semana...');
      console.log('📊 WEEKLY CHART: Filtros aplicados:', { propSelectedVendedor, selectedMonth, selectedYear });
      
      // Buscar todas as vendas ou vendas de um vendedor específico
      const vendas: VendaCompleta[] = propSelectedVendedor === 'todos' || !propSelectedVendedor
        ? await VendasDataService.getAllVendas()
        : await VendasDataService.getVendasByVendedor(propSelectedVendedor);

      console.log(`📊 WEEKLY CHART: Total de vendas encontradas: ${vendas.length}`);
      
      // Log das primeiras vendas para debug
      if (vendas.length > 0) {
        console.log('📊 WEEKLY CHART: Primeiras vendas:', vendas.slice(0, 3).map(v => ({
          id: v.id?.substring(0, 8),
          status: v.status,
          enviado_em: v.enviado_em,
          vendedor_id: v.vendedor_id?.substring(0, 8)
        })));
      }

      // Filtrar vendas aprovadas (matriculadas) e por período se especificado
      const vendasAprovadas = vendas.filter(venda => {
        console.log(`📊 WEEKLY CHART: Verificando venda ${venda.id?.substring(0, 8)} - Status: ${venda.status}, Data: ${venda.enviado_em}`);
        
        // Filtro por status
        if (venda.status !== 'matriculado') {
          console.log(`📊 WEEKLY CHART: Venda ${venda.id?.substring(0, 8)} rejeitada por status: ${venda.status}`);
          return false;
        }
        
        // Filtro por período
        if (selectedMonth && selectedYear && venda.enviado_em) {
          const dataVenda = new Date(venda.enviado_em);
          console.log(`📊 WEEKLY CHART: Venda ${venda.id?.substring(0, 8)} - Data venda: ${dataVenda.toLocaleDateString()} - Mês/Ano filtro: ${selectedMonth}/${selectedYear}`);
          if (dataVenda.getMonth() + 1 !== selectedMonth || dataVenda.getFullYear() !== selectedYear) {
            console.log(`📊 WEEKLY CHART: Venda ${venda.id?.substring(0, 8)} rejeitada por período`);
            return false;
          }
        }
        
        console.log(`📊 WEEKLY CHART: Venda ${venda.id?.substring(0, 8)} APROVADA!`);
        return true;
      });

      console.log(`📊 WEEKLY CHART: ✅ Vendas aprovadas após filtros: ${vendasAprovadas.length}`);
      
      if (vendasAprovadas.length > 0) {
        console.log('📊 WEEKLY CHART: Vendas aprovadas detalhes:', vendasAprovadas.map(v => ({
          id: v.id?.substring(0, 8),
          enviado_em: v.enviado_em,
          status: v.status
        })));
      }

      const weeks = generateWeeks();
      console.log('📊 WEEKLY CHART: Semanas geradas:', weeks.map(w => w.label));
      
      const weeklyStats = weeks.map(week => {
        console.log(`📊 WEEKLY CHART: Processando semana ${week.label} (${week.start.toISOString()} até ${week.end.toISOString()})`);
        
        const vendasNaSemana = vendasAprovadas.filter(venda => {
          if (!venda.enviado_em) {
            console.log(`📊 WEEKLY CHART: Venda ${venda.id?.substring(0, 8)} sem data de envio`);
            return false;
          }
          
          const vendaDate = new Date(venda.enviado_em);
          const isInWeek = vendaDate >= week.start && vendaDate <= week.end;
          console.log(`📊 WEEKLY CHART: Venda ${venda.id?.substring(0, 8)} (${vendaDate.toISOString()}) na semana ${week.label}? ${isInWeek}`);
          return isInWeek;
        });

        console.log(`📊 WEEKLY CHART: Semana ${week.label}: ${vendasNaSemana.length} vendas`);

        return {
          week: week.label,
          weekStart: week.start.toISOString(),
          weekEnd: week.end.toISOString(),
          vendas: vendasNaSemana.length
        };
      });

      console.log('📊 WEEKLY CHART: 🎯 Dados semanais FINAIS:', weeklyStats);
      setWeeklyData(weeklyStats);
    } catch (error) {
      console.error('❌ Erro ao buscar dados semanais:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData();
  }, [propSelectedVendedor, selectedMonth, selectedYear]);

  const selectedVendedorName = propSelectedVendedor === 'todos' || !propSelectedVendedor
    ? 'Todos os Vendedores'
    : vendedores.find(v => v.id === propSelectedVendedor)?.name || 'Vendedor Desconhecido';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas Aprovadas por Semana</CardTitle>
        <CardDescription>
          Vendas matriculadas agrupadas por semana (Quarta a Terça)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-muted-foreground">Carregando dados...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Mostrando dados para: <strong>{selectedVendedorName}</strong>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `Semana: ${label}`}
                  formatter={(value) => [value, 'Vendas Aprovadas']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  name="Vendas Aprovadas"
                />
              </LineChart>
            </ResponsiveContainer>

            {weeklyData.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma venda aprovada encontrada no período
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyApprovedSalesChart;