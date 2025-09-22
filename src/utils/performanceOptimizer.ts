/**
 * OTIMIZAÇÕES CRÍTICAS DE PERFORMANCE
 * 
 * Utilitários para monitorar e otimizar o uso de dados
 */

export class PerformanceOptimizer {
  private static dataUsage = {
    totalRequests: 0,
    totalDataKB: 0,
    lastReset: Date.now()
  };

  /**
   * Monitora tamanho de requests
   */
  static trackRequest(size: number) {
    this.dataUsage.totalRequests++;
    this.dataUsage.totalDataKB += size / 1024;
    
    // Log a cada 100 requests
    if (this.dataUsage.totalRequests % 100 === 0) {
      console.log('📊 PERFORMANCE:', {
        requests: this.dataUsage.totalRequests,
        dataKB: Math.round(this.dataUsage.totalDataKB),
        avgPerRequest: Math.round(this.dataUsage.totalDataKB / this.dataUsage.totalRequests)
      });
    }
  }

  /**
   * Reseta contadores (chamar diariamente)
   */
  static resetCounters() {
    this.dataUsage = {
      totalRequests: 0,
      totalDataKB: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Obtém estatísticas atuais
   */
  static getStats() {
    const hoursElapsed = (Date.now() - this.dataUsage.lastReset) / (1000 * 60 * 60);
    return {
      ...this.dataUsage,
      dataPerHourKB: Math.round(this.dataUsage.totalDataKB / hoursElapsed),
      requestsPerHour: Math.round(this.dataUsage.totalRequests / hoursElapsed)
    };
  }

  /**
   * Verifica se está ultrapassando limites
   */
  static checkLimits() {
    const stats = this.getStats();
    
    // Alerta se > 1MB por hora
    if (stats.dataPerHourKB > 1000) {
      console.warn('⚠️ ALTO USO DE DADOS:', stats);
      return false;
    }
    
    return true;
  }
}

/**
 * Debouncer para reduzir chamadas frequentes
 */
export class Debouncer {
  private static timeouts = new Map<string, NodeJS.Timeout>();

  static debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimeout = this.timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        func(...args);
        this.timeouts.delete(key);
      }, delay);

      this.timeouts.set(key, timeout);
    };
  }

  static clear(key: string) {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  static clearAll() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }
}