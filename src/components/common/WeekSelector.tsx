import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface WeekSelectorProps {
  currentWeek: Date;
  onWeekChange: (week: Date) => void;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({ currentWeek, onWeekChange }) => {
  // Calcular início e fim da semana (quarta a terça)
  const getWeekBounds = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = domingo, 3 = quarta
    let daysToSubtract = dayOfWeek >= 3 ? dayOfWeek - 3 : dayOfWeek + 4;
    
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - daysToSubtract);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return { start: startOfWeek, end: endOfWeek };
  };

  const { start: weekStart, end: weekEnd } = getWeekBounds(currentWeek);

  const goToPreviousWeek = () => {
    const previousWeek = new Date(currentWeek);
    previousWeek.setDate(currentWeek.getDate() - 7);
    onWeekChange(previousWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(currentWeek.getDate() + 7);
    onWeekChange(nextWeek);
  };

  const goToCurrentWeek = () => {
    onWeekChange(new Date());
  };

  const isCurrentWeek = () => {
    const now = new Date();
    const { start: currentStart, end: currentEnd } = getWeekBounds(now);
    return weekStart.getTime() === currentStart.getTime();
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={goToPreviousWeek}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium truncate">
          {weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      </div>

      {!isCurrentWeek() && (
        <Button
          variant="outline"
          size="sm"
          onClick={goToCurrentWeek}
          className="text-xs h-8 px-2"
        >
          Atual
        </Button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={goToNextWeek}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};