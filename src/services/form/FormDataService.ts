
import { DataFormattingService } from '@/services/formatting/DataFormattingService';

export class FormDataService {
  static formatCurrencyField(value: string): string {
    const numericValue = parseFloat(value) || 0;
    return DataFormattingService.formatCurrency(numericValue);
  }

  static handleIndicacaoChange(value: string, clearIndicadorCallback: () => void): void {
    if (value === 'NÃO') {
      clearIndicadorCallback();
    }
  }

  static shouldShowIndicadorField(indicacao: string): boolean {
    return indicacao === 'SIM';
  }
}
