import { Logger } from '@/services/logger/LoggerService';

export class ErrorService {
  static logError(error: Error, context?: string): void {
    Logger.error(`[${context || 'Unknown'}] Error: ${error.message}`, error);
  }

  static handleApiError(error: unknown, defaultMessage: string = 'Ocorreu um erro inesperado'): string {
    if (error instanceof Error) {
      this.logError(error, 'API');
      return error.message;
    }
    
    if (typeof error === 'string') {
      Logger.error('API Error', error);
      return error;
    }
    
    Logger.error('Unknown API Error', error);
    return defaultMessage;
  }

  static validateRequired(value: unknown, fieldName: string): void {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new Error(`${fieldName} é obrigatório`);
    }
  }

  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }
  }

  static validateNumeric(value: unknown, fieldName: string): void {
    if (isNaN(Number(value))) {
      throw new Error(`${fieldName} deve ser um número válido`);
    }
  }
}
