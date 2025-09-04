import { startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

/**
 * Converte um DateRange para um range inclusivo que inclui o dia completo
 * do início e fim do período
 */
export const getInclusiveDateRange = (dateRange?: DateRange) => {
  if (!dateRange) return null;
  
  const start = dateRange.from ? startOfDay(dateRange.from) : null;
  const end = dateRange.to ? endOfDay(dateRange.to) : (dateRange.from ? endOfDay(dateRange.from) : null);
  
  return { start, end };
};

/**
 * Verifica se uma data está dentro do range inclusivo
 */
export const isDateInRange = (date: Date | string, dateRange?: DateRange): boolean => {
  if (!dateRange || (!dateRange.from && !dateRange.to)) return true;
  
  const range = getInclusiveDateRange(dateRange);
  if (!range) return true;
  
  const checkDate = new Date(date);
  
  if (range.start && checkDate < range.start) return false;
  if (range.end && checkDate > range.end) return false;
  
  return true;
};