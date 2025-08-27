import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface MonthYearSelectorProps {
  selectedMonth?: number;
  selectedYear?: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  showAll?: boolean;
}

const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  showAll = true
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  console.log('🎯 MonthYearSelector props:', {
    selectedMonth,
    selectedYear,
    showAll,
    currentMonth,
    currentYear,
    selectedMonthType: typeof selectedMonth,
    selectedYearType: typeof selectedYear
  });
  
  // Gerar lista de anos (atual e dois anteriores)
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);
  
  // Meses em português
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  return (
    <div className="flex items-center gap-3">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      
      <Select 
        value={selectedMonth?.toString() || (showAll ? "all" : currentMonth.toString())} 
        onValueChange={(value) => {
          console.log('🔄 MonthYearSelector - Mudando mês:', { value, currentValue: selectedMonth });
          if (value === "all") {
            onMonthChange(0); // 0 indica "todos os meses"
          } else {
            onMonthChange(parseInt(value));
          }
        }}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Selecionar mês" />
        </SelectTrigger>
        <SelectContent>
          {showAll && (
            <SelectItem value="all">Todos os meses</SelectItem>
          )}
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value.toString()}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={selectedYear?.toString() || currentYear.toString()} 
        onValueChange={(value) => {
          console.log('🔄 MonthYearSelector - Mudando ano:', { value, currentValue: selectedYear });
          onYearChange(parseInt(value));
        }}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MonthYearSelector;