
import React from 'react';
import MonthYearFilter from '@/components/common/MonthYearFilter';

interface VendasFilterProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

const VendasFilter: React.FC<VendasFilterProps> = (props) => {
  return <MonthYearFilter {...props} />;
};

export default VendasFilter;
