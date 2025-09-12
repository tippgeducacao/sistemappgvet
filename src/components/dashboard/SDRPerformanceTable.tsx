import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Eye } from 'lucide-react';
import { useSDRWeeklyPerformance } from '@/hooks/useSDRWeeklyPerformance';
import { getWeekRange } from '@/utils/semanaUtils';
import LoadingState from '@/components/ui/loading-state';
import { SDRMeetingDetailsModal } from './SDRMeetingDetailsModal';

export const SDRPerformanceTable: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedSDRDetails, setSelectedSDRDetails] = useState<{ name: string; meetings: any[] } | null>(null);
  const { performanceData, isLoading } = useSDRWeeklyPerformance(selectedWeek);

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

  const handleSDRClick = (sdr: { sdr_name: string; meetings: any[] }) => {
    setSelectedSDRDetails({
      name: sdr.sdr_name,
      meetings: sdr.meetings
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Detalhada dos SDRs</CardTitle>
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
            <CardTitle>Performance Detalhada dos SDRs</CardTitle>
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
                <th className="text-left p-3 font-semibold text-foreground">SDR</th>
                <th className="text-center p-3 font-semibold text-green-600">Convertidas</th>
                <th className="text-center p-3 font-semibold text-yellow-600">Compareceram</th>
                <th className="text-center p-3 font-semibold text-red-600">Não Compareceram</th>
                <th className="text-center p-3 font-semibold text-blue-600">Taxa Conversão</th>
                <th className="text-center p-3 font-semibold text-purple-600">Taxa Comparecimento</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">
                    Nenhum dado encontrado para esta semana
                  </td>
                </tr>
              ) : (
                performanceData
                  .sort((a, b) => b.convertidas - a.convertidas) // Ordenar por convertidas (maior primeiro)
                  .map((sdr) => (
                    <tr key={sdr.sdr_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <button
                          onClick={() => handleSDRClick(sdr)}
                          className="font-medium text-foreground hover:text-primary transition-colors flex items-center space-x-2 group"
                        >
                          <span>{sdr.sdr_name}</span>
                          <Eye className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      <td className="text-center p-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                          {sdr.convertidas}
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold">
                          {sdr.compareceram}
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-800 text-sm font-semibold">
                          {sdr.naoCompareceram}
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${
                          sdr.taxaConversao >= 20 
                            ? 'bg-green-100 text-green-800' 
                            : sdr.taxaConversao >= 10 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {sdr.taxaConversao.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${
                          sdr.taxaComparecimento >= 80 
                            ? 'bg-green-100 text-green-800' 
                            : sdr.taxaComparecimento >= 60 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {sdr.taxaComparecimento.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        
        {performanceData.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Taxa de Conversão:</strong> Convertidas ÷ (Convertidas + Compareceram) × 100
              </div>
              <div>
                <strong>Taxa de Comparecimento:</strong> (Convertidas + Compareceram) ÷ Total Agendadas × 100
              </div>
            </div>
            <div className="mt-2">
              <strong>Observação:</strong> Reuniões que não compareceram não são incluídas no cálculo da taxa de conversão
            </div>
          </div>
        )}
      </CardContent>

      <SDRMeetingDetailsModal
        open={!!selectedSDRDetails}
        onOpenChange={(open) => !open && setSelectedSDRDetails(null)}
        sdrName={selectedSDRDetails?.name || ''}
        meetings={selectedSDRDetails?.meetings || []}
      />
    </Card>
  );
};