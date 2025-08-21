
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeekRange } from '@/utils/semanaUtils';

interface WeekNavigationProps {
  onWeekChange?: (weekStart: Date, weekEnd: Date) => void;
}

export const WeekNavigation: React.FC<WeekNavigationProps> = ({ onWeekChange }) => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  
  const getCurrentWeek = (offset: number = 0) => {
    const referenceDate = new Date();
    referenceDate.setDate(referenceDate.getDate() + (offset * 7));
    return getWeekRange(referenceDate);
  };

  const { start: inicioSemana, end: fimSemana } = getCurrentWeek(currentWeekOffset);
  
  const formatarData = (date: Date) => 
    date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newOffset = direction === 'prev' 
      ? currentWeekOffset - 1 
      : currentWeekOffset + 1;
    
    setCurrentWeekOffset(newOffset);
    
    const { start, end } = getCurrentWeek(newOffset);
    onWeekChange?.(start, end);
  };

  return (
    <div className="flex items-center gap-2 bg-card dark:bg-card rounded-lg px-4 py-2 border border-border">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => navigateWeek('prev')}
        className="hover:bg-muted"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="text-center min-w-[120px]">
        <p className="text-sm font-medium text-muted-foreground">Semana</p>
        <p className="text-lg font-bold text-foreground">
          {formatarData(inicioSemana)} - {formatarData(fimSemana)}
        </p>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => navigateWeek('next')}
        className="hover:bg-muted"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
