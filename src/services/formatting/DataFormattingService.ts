
export class DataFormattingService {
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
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
      const date = new Date(dateString);
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
