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

const WeeklyApprovedSalesChart: React.FC = () => {
  const { vendedores } = useVendedores();
  const [selectedVendedor, setSelectedVendedor] = useState<string>('todos');
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
      console.log('📊 Buscando dados de vendas aprovadas por semana...');
      
      // Buscar todas as vendas ou vendas de um vendedor específico
      const vendas: VendaCompleta[] = selectedVendedor === 'todos' 
        ? await VendasDataService.getAllVendas()
        : await VendasDataService.getVendasByVendedor(selectedVendedor);

      console.log(`📈 Total de vendas encontradas: ${vendas.length}`);

      // Filtrar apenas vendas aprovadas (matriculadas)
      const vendasAprovadas = vendas.filter(venda => 
        venda.status?.toLowerCase() === 'matriculado'
      );

      console.log(`✅ Vendas aprovadas: ${vendasAprovadas.length}`);

      const weeks = generateWeeks();
      
      const weeklyStats = weeks.map(week => {
        const vendasNaSemana = vendasAprovadas.filter(venda => {
          if (!venda.enviado_em) return false;
          
          const vendaDate = new Date(venda.enviado_em);
          return vendaDate >= week.start && vendaDate <= week.end;
        });

        return {
          week: week.label,
          weekStart: week.start.toISOString(),
          weekEnd: week.end.toISOString(),
          vendas: vendasNaSemana.length
        };
      });

      console.log('📊 Dados semanais processados:', weeklyStats);
      setWeeklyData(weeklyStats);
    } catch (error) {
      console.error('❌ Erro ao buscar dados semanais:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData();
  }, [selectedVendedor]);

  const selectedVendedorName = selectedVendedor === 'todos' 
    ? 'Todos os Vendedores'
    : vendedores.find(v => v.id === selectedVendedor)?.name || 'Vendedor Desconhecido';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vendas Aprovadas por Semana</CardTitle>
            <CardDescription>
              Vendas matriculadas agrupadas por semana (Quarta a Terça)
            </CardDescription>
          </div>
          
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