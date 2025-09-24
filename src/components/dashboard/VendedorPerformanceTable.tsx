import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Eye } from 'lucide-react';
import { useAgendamentosStatsVendedores } from '@/hooks/useAgendamentosStatsVendedores';
import { getWeekRange } from '@/utils/semanaUtils';
import LoadingState from '@/components/ui/loading-state';
import { VendedorMeetingDetailsModal } from './VendedorMeetingDetailsModal';

export const VendedorPerformanceTable: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedVendedorDetails, setSelectedVendedorDetails] = useState<{ name: string; vendedorId: string } | null>(null);
  const { statsData, isLoading } = useAgendamentosStatsVendedores(undefined, selectedWeek);

  // Função para calcular início e fim da semana
  const getWeekBounds = (date: Date) => {
    const { start, end } = getWeekRange(date);
    return { start, end };
  };

  const { start: weekStart, end: weekEnd } = getWeekBounds(selectedWeek);

  const formatWeekRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const endStr = end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${startStr} - ${endStr}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(selectedWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  const handleVendedorClick = (vendedor: { vendedor_id: string; vendedor_name: string }) => {
    setSelectedVendedorDetails({
      name: vendedor.vendedor_name,
      vendedorId: vendedor.vendedor_id
    });
  };

  const calculateTaxaConversao = (convertidas: number, compareceram: number) => {
    const totalPositivas = convertidas + compareceram;
    return totalPositivas > 0 ? (convertidas / totalPositivas) * 100 : 0;
  };

  const calculateTaxaComparecimento = (convertidas: number, compareceram: number, total: number) => {
    const totalPositivas = convertidas + compareceram;
    return total > 0 ? (totalPositivas / total) * 100 : 0;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Detalhada dos Vendedores</CardTitle>
          <CardDescription>Dados semanais de reuniões e conversões (quarta a terça)</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Performance Detalhada dos Vendedores</CardTitle>
            <CardDescription>
              Dados semanais de reuniões e conversões (quarta a terça)
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
              className="min-w-[140px]"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {formatWeekRange(weekStart, weekEnd)}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold text-foreground">Vendedor</th>
                <th className="text-center p-3 font-semibold text-green-600">Convertidas</th>
                <th className="text-center p-3 font-semibold text-yellow-600">Compareceram</th>
                <th className="text-center p-3 font-semibold text-red-600">Não Compareceram</th>
                <th className="text-center p-3 font-semibold text-blue-600">Taxa Conversão</th>
                <th className="text-center p-3 font-semibold text-purple-600">Taxa Comparecimento</th>
              </tr>
            </thead>
            <tbody>
              {statsData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">
                    Nenhum dado encontrado para esta semana
                  </td>
                </tr>
              ) : (
                statsData
                  .sort((a, b) => b.convertidas - a.convertidas) // Ordenar por convertidas (maior primeiro)
                  .map((vendedor) => {
                    const taxaConversao = calculateTaxaConversao(vendedor.convertidas, vendedor.compareceram);
                    const taxaComparecimento = calculateTaxaComparecimento(vendedor.convertidas, vendedor.compareceram, vendedor.total);
                    
                    return (
                      <tr key={vendedor.vendedor_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <button
                            onClick={() => handleVendedorClick(vendedor)}
                            className="font-medium text-foreground hover:text-primary transition-colors flex items-center space-x-2 group"
                          >
                            <span>{vendedor.vendedor_name}</span>
                            <Eye className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </td>
                        <td className="text-center p-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                            {vendedor.convertidas}
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold">
                            {vendedor.compareceram}
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-800 text-sm font-semibold">
                            {vendedor.naoCompareceram}
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${
                            taxaConversao >= 20 
                              ? 'bg-green-100 text-green-800' 
                              : taxaConversao >= 10 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {taxaConversao.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center p-3">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${
                            taxaComparecimento >= 80 
                              ? 'bg-green-100 text-green-800' 
                              : taxaComparecimento >= 60 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {taxaComparecimento.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
        
        {statsData.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Taxa de Conversão:</strong> Convertidas ÷ (Convertidas + Compareceram) × 100
              </div>
              <div>
                <strong>Taxa de Comparecimento:</strong> (Convertidas + Compareceram) ÷ Total Agendadas × 100
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <div><strong>Compareceram:</strong> Reuniões onde o lead compareceu (resultado "compareceu_nao_comprou")</div>
              <div><strong>Convertidas:</strong> Reuniões que resultaram em venda (resultado "comprou")</div>
              <div><strong>Não Compareceram:</strong> Reuniões onde o lead não compareceu (resultado "nao_compareceu")</div>
            </div>
          </div>
        )}
      </CardContent>

      <VendedorMeetingDetailsModal
        open={!!selectedVendedorDetails}
        onOpenChange={(open) => !open && setSelectedVendedorDetails(null)}
        vendedorName={selectedVendedorDetails?.name || ''}
        vendedorId={selectedVendedorDetails?.vendedorId || ''}
        weekDate={selectedWeek}
      />
    </Card>
  );
};