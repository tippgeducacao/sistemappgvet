/**
 * Serviço centralizado de logging profissional
 * - Logs de debug apenas em desenvolvimento
 * - Sanitização automática de dados sensíveis
 * - Preparado para integração com Sentry/DataDog
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class LoggerService {
  private isDevelopment = import.meta.env.DEV;
  private sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];

  /**
   * Sanitiza dados sensíveis de objetos antes de logar
   */
  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.sensitiveKeys.some(sk => lowerKey.includes(sk));
      
      if (isSensitive) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Formata mensagem com contexto
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return context ? `${prefix} ${message}` : `${prefix} ${message}`;
  }

  /**
   * Log de debug - APENAS em desenvolvimento
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const sanitizedContext = context ? this.sanitize(context) : undefined;
    const formatted = this.formatMessage('debug', message, sanitizedContext);
    
    if (sanitizedContext) {
      console.log(formatted, sanitizedContext);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Log de informação - APENAS em desenvolvimento
   */
  info(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const sanitizedContext = context ? this.sanitize(context) : undefined;
    const formatted = this.formatMessage('info', message, sanitizedContext);
    
    if (sanitizedContext) {
      console.info(formatted, sanitizedContext);
    } else {
      console.info(formatted);
    }
  }

  /**
   * Log de warning - funciona em produção e desenvolvimento
   */
  warn(message: string, context?: LogContext): void {
    const sanitizedContext = context ? this.sanitize(context) : undefined;
    const formatted = this.formatMessage('warn', message, sanitizedContext);
    
    if (sanitizedContext) {
      console.warn(formatted, sanitizedContext);
    } else {
      console.warn(formatted);
    }

    // TODO: Em produção, enviar para serviço de monitoramento
    // if (!this.isDevelopment) {
    //   this.sendToMonitoring('warn', message, sanitizedContext);
    // }
  }

  /**
   * Log de erro - funciona em produção e desenvolvimento
   * Em produção, deve enviar para serviço de monitoramento
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const sanitizedContext = context ? this.sanitize(context) : undefined;
    const formatted = this.formatMessage('error', message, sanitizedContext);
    
    if (error instanceof Error) {
      console.error(formatted, {
        message: error.message,
        stack: error.stack,
        context: sanitizedContext
      });
    } else if (sanitizedContext) {
      console.error(formatted, sanitizedContext);
    } else {
      console.error(formatted);
    }

    // TODO: Em produção, enviar para Sentry/DataDog/etc
    // if (!this.isDevelopment) {
    //   this.sendToMonitoring('error', message, {
    //     error: error instanceof Error ? {
    //       message: error.message,
    //       stack: error.stack
    //     } : error,
    //     context: sanitizedContext
    //   });
    // }
  }

  /**
   * Cria um logger com contexto fixo (útil para componentes/serviços)
   */
  createLogger(defaultContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        this.debug(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) =>
        this.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        this.warn(message, { ...defaultContext, ...context }),
      error: (message: string, error?: Error | unknown, context?: LogContext) =>
        this.error(message, error, { ...defaultContext, ...context }),
    };
  }

  /**
   * TODO: Implementar integração com serviço de monitoramento
   */
  // private sendToMonitoring(level: LogLevel, message: string, context?: any): void {
  //   // Implementar integração com Sentry, DataDog, etc
  //   // Example: Sentry.captureMessage(message, { level, extra: context });
  // }
}

// Exportar instância singleton
export const Logger = new LoggerService();

// Exportar classe para testes
export { LoggerService };
