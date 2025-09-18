import { supabase } from '@/integrations/supabase/client';

export interface RegraComissionamento {
  id: string;
  tipo_usuario: string;
  percentual_minimo: number;
  percentual_maximo: number;
  multiplicador: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Cache in-memory para regras de comissionamento
interface CacheEntry {
  data: RegraComissionamento[];
  timestamp: number;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hora
const regrasCache = new Map<string, CacheEntry>();

export class ComissionamentoService {
  static async fetchRegras(tipoUsuario = 'vendedor'): Promise<RegraComissionamento[]> {
    // Verificar cache primeiro
    const cacheKey = tipoUsuario;
    const cached = regrasCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`📋 Cache hit para regras ${tipoUsuario}`);
      return cached.data;
    }
    const { data, error } = await supabase
      .from('regras_comissionamento')
      .select('*')
      .eq('tipo_usuario', tipoUsuario)
      .order('percentual_minimo', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar regras de comissionamento:', error);
      throw error;
    }

    const regras = data || [];
    
    // Salvar no cache
    regrasCache.set(cacheKey, {
      data: regras,
      timestamp: Date.now()
    });
    
    console.log(`💾 Cache saved para regras ${tipoUsuario}: ${regras.length} regras`);
    
    return regras;
  }

  static async updateRegra(
    id: string, 
    dados: Partial<Omit<RegraComissionamento, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('regras_comissionamento')
      .update(dados)
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao atualizar regra de comissionamento:', error);
      throw error;
    }
  }

  static async calcularComissao(
    pontosObtidos: number, 
    metaSemanal: number, 
    variabelSemanal: number,
    tipoUsuario = 'vendedor',
    regrasPreCarregadas?: RegraComissionamento[]
  ): Promise<{ valor: number; multiplicador: number; percentual: number }> {
    // Proteger contra divisão por zero
    if (metaSemanal === 0) {
      console.warn('⚠️ Meta semanal é zero, retornando comissão zero');
      return { valor: 0, multiplicador: 0, percentual: 0 };
    }
    
    const percentualBruto = (pontosObtidos / metaSemanal) * 100;
    const percentual = Math.floor(percentualBruto); // USAR FLOOR para seleção de regra
    const regras = regrasPreCarregadas || await this.fetchRegras(tipoUsuario);

    // Para SUPERVISOR, usar SEMPRE as regras de VENDEDOR (alinhado ao negócio)
    let regrasUsadas = regras;
    if (tipoUsuario === 'supervisor') {
      console.warn('ℹ️ Supervisor: usando regras de VENDEDOR para cálculo.');
      regrasUsadas = await this.fetchRegras('vendedor');
    }
    
    console.log('🔢 DEBUG COMISSIONAMENTO:', {
      tipoUsuario,
      pontosObtidos,
      metaSemanal, 
      variabelSemanal,
      percentualBruto,
      percentualArredondado: percentual,
      regras: regrasUsadas.map(r => `${r.percentual_minimo}-${r.percentual_maximo}: ${r.multiplicador}x`),
      totalRegras: regrasUsadas.length
    });
    
    // Se não há regras, criar regras padrão para SDR
    if (regras.length === 0 && tipoUsuario === 'sdr') {
      console.warn('⚠️ Nenhuma regra de comissionamento encontrada para SDR, usando regras padrão');
      const regrasPadrao: RegraComissionamento[] = [
        {
          id: 'default-sdr-1',
          tipo_usuario: 'sdr',
          percentual_minimo: 0,
          percentual_maximo: 59,
          multiplicador: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'default-sdr-2',
          tipo_usuario: 'sdr',
          percentual_minimo: 60,
          percentual_maximo: 84,
          multiplicador: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'default-sdr-3',
          tipo_usuario: 'sdr',
          percentual_minimo: 85,
          percentual_maximo: 999,
          multiplicador: 1.5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      console.log('📋 Usando regras padrão SDR:', regrasPadrao.map(r => `${r.percentual_minimo}-${r.percentual_maximo}: ${r.multiplicador}x`));
      
      // Usar as regras padrão para o cálculo
      const regrasOrdenadas = [...regrasPadrao].sort((a, b) => b.percentual_minimo - a.percentual_minimo);
      
      let regraAplicavel = null;
      for (const regra of regrasOrdenadas) {
        if (regra.percentual_maximo >= 999 && percentual >= regra.percentual_minimo) {
          regraAplicavel = regra;
          break;
        }
        else if (percentual >= regra.percentual_minimo && percentual <= regra.percentual_maximo) {
          regraAplicavel = regra;
          break;
        }
      }
      
      console.log('✅ REGRA PADRÃO SELECIONADA:', {
        percentual,
        regra: regraAplicavel ? `${regraAplicavel.percentual_minimo}-${regraAplicavel.percentual_maximo}: ${regraAplicavel.multiplicador}x` : 'NENHUMA'
      });

      const multiplicador = regraAplicavel?.multiplicador || 0;
      const valor = variabelSemanal * multiplicador;

      console.log('💰 RESULTADO COMISSIONAMENTO PADRÃO:', {
        tipoUsuario,
        percentual: Math.round(percentualBruto * 100) / 100,
        multiplicador,
        variabelSemanal,
        valor,
        regraUsada: regraAplicavel ? `${regraAplicavel.percentual_minimo}-${regraAplicavel.percentual_maximo}` : 'nenhuma'
      });

      return {
        valor,
        multiplicador,
        percentual: Math.round(percentualBruto * 100) / 100
      };
    }
    
    // LÓGICA CORRIGIDA: encontrar a regra mais específica aplicável
    let regraAplicavel = null;
    
    // Ordenar regras por percentual_minimo DESC para pegar a mais específica primeiro
    const regrasOrdenadas = [...regrasUsadas].sort((a, b) => b.percentual_minimo - a.percentual_minimo);
    
    for (const regra of regrasOrdenadas) {
      // Para percentuais >= 999 (ou seja, muito altos) - deve ser verificado primeiro
      if (regra.percentual_maximo >= 999 && percentual >= regra.percentual_minimo) {
        regraAplicavel = regra;
        break;
      }
      // Para outros percentuais, usar >= minimo e <= maximo
      else if (percentual >= regra.percentual_minimo && percentual <= regra.percentual_maximo) {
        regraAplicavel = regra;
        break;
      }
    }

    console.log('✅ REGRA SELECIONADA:', {
      percentual,
      regra: regraAplicavel ? `${regraAplicavel.percentual_minimo}-${regraAplicavel.percentual_maximo}: ${regraAplicavel.multiplicador}x` : 'NENHUMA'
    });

    const multiplicador = regraAplicavel?.multiplicador || 0;
    const valor = variabelSemanal * multiplicador;

    console.log('💰 RESULTADO COMISSIONAMENTO:', {
      tipoUsuario,
      percentual: Math.round(percentualBruto * 100) / 100,
      multiplicador,
      variabelSemanal,
      valor,
      regraUsada: regraAplicavel ? `${regraAplicavel.percentual_minimo}-${regraAplicavel.percentual_maximo}` : 'nenhuma'
    });

    return {
      valor,
      multiplicador,
      percentual: Math.round(percentualBruto * 100) / 100 // Percentual exato para display
    };
  }
}