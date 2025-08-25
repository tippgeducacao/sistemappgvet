
export class DataFormattingService {
  static formatDate(dateString: string): string {
    try {
      console.log(`📅 DataFormattingService.formatDate - Input:`, dateString);
      
      // Se a string contém apenas data (YYYY-MM-DD), tratar como data local
      // para evitar problemas de fuso horário
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const result = date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        console.log(`📅 DataFormattingService.formatDate - YYYY-MM-DD format:`, {
          input: dateString,
          parsedDate: date.toISOString(),
          result
        });
        
        return result;
      }
      
      // Para outros formatos, usar o comportamento padrão
      const date = new Date(dateString);
      const result = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      console.log(`📅 DataFormattingService.formatDate - Other format:`, {
        input: dateString,
        parsedDate: date.toISOString(),
        result,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      return result;
    } catch (error) {
      console.error(`❌ DataFormattingService.formatDate - Error:`, error);
      return 'Data inválida';
    }
  }

  static formatPoints(points: number): string {
    // Garantir que o número seja válido
    if (!points || isNaN(points) || !isFinite(points)) {
      return '0.0';
    }
    
    // Arredondar para 1 casa decimal e formatar
    const roundedPoints = Math.round(points * 10) / 10;
    return roundedPoints.toFixed(1);
  }

  static formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  static formatDateTime(dateString: string): string {
    try {
      if (!dateString) return 'Data inválida';
      
      const date = new Date(dateString);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  }
}
