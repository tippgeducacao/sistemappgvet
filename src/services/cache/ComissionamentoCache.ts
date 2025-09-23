/**
 * Cache global especializado para cálculos de comissionamento
 * Reduz drasticamente queries repetitivas
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface ComissionamentoCalculationResult {
  valor: number;
  multiplicador: number;
  percentual: number;
}

class ComissionamentoCacheService {
  private static regrasCache = new Map<string, CacheEntry<any[]>>();
  private static calculosCache = new Map<string, CacheEntry<ComissionamentoCalculationResult>>();
  
  // TTL mais agressivo para regras (4-6 horas - dados raramente mudam)
  private static REGRAS_TTL = 6 * 60 * 60 * 1000; // 6 horas
  
  // TTL moderado para cálculos (2 horas - resultados são determinísticos)
  private static CALCULOS_TTL = 2 * 60 * 60 * 1000; // 2 horas

  /**
   * Cache de regras de comissionamento por tipo de usuário
   */
  static setRegras(tipoUsuario: string, regras: any[]): void {
    const key = `regras_${tipoUsuario}`;
    this.regrasCache.set(key, {
      data: regras,
      timestamp: Date.now(),
      ttl: this.REGRAS_TTL
    });
    
    console.log(`💾 ComissionamentoCache: Regras cached para ${tipoUsuario}`, {
      total: regras.length,
      ttl: `${this.REGRAS_TTL / (60 * 60 * 1000)}h`
    });
  }

  static getRegras(tipoUsuario: string): any[] | null {
    const key = `regras_${tipoUsuario}`;
    const entry = this.regrasCache.get(key);
    
    if (!entry) {
      console.log(`❌ ComissionamentoCache: MISS para regras ${tipoUsuario}`);
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      console.log(`⏰ ComissionamentoCache: EXPIRED para regras ${tipoUsuario}`);
      this.regrasCache.delete(key);
      return null;
    }

    console.log(`✅ ComissionamentoCache: HIT para regras ${tipoUsuario}`, {
      age: `${Math.round((Date.now() - entry.timestamp) / (60 * 1000))}min`
    });
    return entry.data;
  }

  /**
   * Cache de cálculos de comissão
   */
  static setCalculo(
    pontosObtidos: number,
    metaSemanal: number,
    variabelSemanal: number,
    tipoUsuario: string,
    resultado: ComissionamentoCalculationResult
  ): void {
    const key = this.getCalculoKey(pontosObtidos, metaSemanal, variabelSemanal, tipoUsuario);
    
    this.calculosCache.set(key, {
      data: resultado,
      timestamp: Date.now(),
      ttl: this.CALCULOS_TTL
    });
    
    console.log(`💾 ComissionamentoCache: Cálculo cached`, {
      key: key.substring(0, 50) + '...',
      valor: `R$ ${resultado.valor.toFixed(2)}`,
      multiplicador: `${resultado.multiplicador}x`,
      ttl: `${this.CALCULOS_TTL / (60 * 60 * 1000)}h`
    });
  }

  static getCalculo(
    pontosObtidos: number,
    metaSemanal: number,
    variabelSemanal: number,
    tipoUsuario: string
  ): ComissionamentoCalculationResult | null {
    const key = this.getCalculoKey(pontosObtidos, metaSemanal, variabelSemanal, tipoUsuario);
    const entry = this.calculosCache.get(key);
    
    if (!entry) {
      console.log(`❌ ComissionamentoCache: MISS para cálculo`, { key: key.substring(0, 50) + '...' });
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      console.log(`⏰ ComissionamentoCache: EXPIRED para cálculo`, { key: key.substring(0, 50) + '...' });
      this.calculosCache.delete(key);
      return null;
    }

    console.log(`✅ ComissionamentoCache: HIT para cálculo`, {
      key: key.substring(0, 50) + '...',
      valor: `R$ ${entry.data.valor.toFixed(2)}`,
      age: `${Math.round((Date.now() - entry.timestamp) / (60 * 1000))}min`
    });
    return entry.data;
  }

  /**
   * Gera chave única para cálculo baseada nos parâmetros
   */
  private static getCalculoKey(
    pontosObtidos: number,
    metaSemanal: number,
    variabelSemanal: number,
    tipoUsuario: string
  ): string {
    return `calculo_${tipoUsuario}_${pontosObtidos}_${metaSemanal}_${variabelSemanal}`;
  }

  /**
   * Limpa cache expirado (garbage collection)
   */
  static cleanExpiredCache(): void {
    const now = Date.now();
    let cleanedRegras = 0;
    let cleanedCalculos = 0;

    // Limpar regras expiradas
    for (const [key, entry] of this.regrasCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.regrasCache.delete(key);
        cleanedRegras++;
      }
    }

    // Limpar cálculos expirados
    for (const [key, entry] of this.calculosCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.calculosCache.delete(key);
        cleanedCalculos++;
      }
    }

    if (cleanedRegras > 0 || cleanedCalculos > 0) {
      console.log(`🧹 ComissionamentoCache: Limpeza executada`, {
        regrasLimpas: cleanedRegras,
        calculosLimpos: cleanedCalculos,
        regrasAtivas: this.regrasCache.size,
        calculosAtivos: this.calculosCache.size
      });
    }
  }

  /**
   * Força limpeza total do cache
   */
  static clearAll(): void {
    const regrasCount = this.regrasCache.size;
    const calculosCount = this.calculosCache.size;
    
    this.regrasCache.clear();
    this.calculosCache.clear();
    
    console.log(`🗑️ ComissionamentoCache: Cache limpo completamente`, {
      regrasRemovidas: regrasCount,
      calculosRemovidos: calculosCount
    });
  }

  /**
   * Estatísticas do cache
   */
  static getStats() {
    return {
      regras: {
        total: this.regrasCache.size,
        ttl: `${this.REGRAS_TTL / (60 * 60 * 1000)}h`
      },
      calculos: {
        total: this.calculosCache.size,
        ttl: `${this.CALCULOS_TTL / (60 * 60 * 1000)}h`
      }
    };
  }
}

// Limpeza automática a cada 30 minutos
setInterval(() => {
  ComissionamentoCacheService.cleanExpiredCache();
}, 30 * 60 * 1000);

export { ComissionamentoCacheService };