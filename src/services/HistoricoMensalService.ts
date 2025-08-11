import { supabase } from '@/integrations/supabase/client';

export interface HistoricoMensal {
  id: string;
  ano: number;
  mes: number;
  status: string;
  data_fechamento?: string;
  fechado_por?: string;
  snapshot_metas: any;
  snapshot_regras_comissionamento: any;
  snapshot_niveis: any;
  created_at: string;
  updated_at: string;
}

export interface MetaSemanolSnapshot {
  vendedor_id: string;
  ano: number;
  semana: number;
  meta_vendas: number;
  created_at: string;
}

export interface RegraComissionamentoSnapshot {
  id: string;
  tipo_usuario: string;
  percentual_minimo: number;
  percentual_maximo: number;
  multiplicador: number;
}

export interface NivelSnapshot {
  id: string;
  nivel: string;
  tipo_usuario: string;
  meta_semanal_vendedor: number;
  meta_semanal_inbound: number;
  meta_semanal_outbound: number;
  variavel_semanal: number;
  fixo_mensal: number;
  vale: number;
}

export class HistoricoMensalService {
  /**
   * Buscar histórico de um mês específico
   */
  static async buscarHistoricoMes(ano: number, mes: number): Promise<HistoricoMensal | null> {
    const { data, error } = await supabase
      .from('historico_mensal_planilhas')
      .select('*')
      .eq('ano', ano)
      .eq('mes', mes)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar histórico mensal:', error);
      throw error;
    }

    return data;
  }

  /**
   * Listar todos os históricos
   */
  static async listarHistoricos(): Promise<HistoricoMensal[]> {
    const { data, error } = await supabase
      .from('historico_mensal_planilhas')
      .select('*')
      .order('ano', { ascending: false })
      .order('mes', { ascending: false });

    if (error) {
      console.error('❌ Erro ao listar históricos:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Verificar se um mês está fechado
   */
  static async isMesFechado(ano: number, mes: number): Promise<boolean> {
    const historico = await this.buscarHistoricoMes(ano, mes);
    return historico?.status === 'fechado';
  }

  /**
   * Fechar mês - criar snapshot
   */
  static async fecharMes(ano: number, mes: number): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('criar_snapshot_mensal', {
        p_ano: ano,
        p_mes: mes
      });

      if (error) {
        console.error('❌ Erro ao fechar mês:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao executar fechamento do mês:', error);
      throw error;
    }
  }

  /**
   * Reabrir mês (apenas diretores)
   */
  static async reabrirMes(ano: number, mes: number): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('reabrir_mes_planilha', {
        p_ano: ano,
        p_mes: mes
      });

      if (error) {
        console.error('❌ Erro ao reabrir mês:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao executar reabertura do mês:', error);
      throw error;
    }
  }

  /**
   * Buscar metas semanais - usa histórico se mês fechado, senão dados atuais
   */
  static async buscarMetasSemanais(ano: number, mes?: number): Promise<MetaSemanolSnapshot[]> {
    // Se mês não especificado, usar dados atuais
    if (!mes) {
      const { data, error } = await supabase
        .from('metas_semanais_vendedores')
        .select('*')
        .eq('ano', ano);

      if (error) throw error;
      return data || [];
    }

    // Verificar se mês está fechado
    const isFechado = await this.isMesFechado(ano, mes);
    
    if (isFechado) {
      const historico = await this.buscarHistoricoMes(ano, mes);
      return historico?.snapshot_metas || [];
    } else {
      // Usar dados atuais
      const { data, error } = await supabase
        .from('metas_semanais_vendedores')
        .select('*')
        .eq('ano', ano);

      if (error) throw error;
      return data || [];
    }
  }

  /**
   * Buscar regras de comissionamento - usa histórico se mês fechado
   */
  static async buscarRegrasComissionamento(ano: number, mes?: number): Promise<RegraComissionamentoSnapshot[]> {
    if (!mes) {
      // Usar dados atuais
      const { data, error } = await supabase
        .from('regras_comissionamento')
        .select('*');

      if (error) throw error;
      return data || [];
    }

    const isFechado = await this.isMesFechado(ano, mes);
    
    if (isFechado) {
      const historico = await this.buscarHistoricoMes(ano, mes);
      return historico?.snapshot_regras_comissionamento || [];
    } else {
      // Usar dados atuais
      const { data, error } = await supabase
        .from('regras_comissionamento')
        .select('*');

      if (error) throw error;
      return data || [];
    }
  }

  /**
   * Buscar níveis - usa histórico se mês fechado
   */
  static async buscarNiveis(ano: number, mes?: number): Promise<NivelSnapshot[]> {
    if (!mes) {
      // Usar dados atuais
      const { data, error } = await supabase
        .from('niveis_vendedores')
        .select('*');

      if (error) throw error;
      return data || [];
    }

    const isFechado = await this.isMesFechado(ano, mes);
    
    if (isFechado) {
      const historico = await this.buscarHistoricoMes(ano, mes);
      return historico?.snapshot_niveis || [];
    } else {
      // Usar dados atuais
      const { data, error } = await supabase
        .from('niveis_vendedores')
        .select('*');

      if (error) throw error;
      return data || [];
    }
  }

  /**
   * Buscar multiplicador de comissionamento para um percentual - considerando histórico
   */
  static async buscarMultiplicador(
    percentual: number, 
    tipoUsuario: string = 'vendedor',
    ano: number,
    mes?: number
  ): Promise<number> {
    const regras = await this.buscarRegrasComissionamento(ano, mes);
    
    const regraAplicavel = regras.find(regra => 
      regra.tipo_usuario === tipoUsuario &&
      percentual >= regra.percentual_minimo && 
      (percentual <= regra.percentual_maximo || regra.percentual_maximo === 999)
    );

    return regraAplicavel?.multiplicador || 0;
  }

  /**
   * Buscar dados de nível específico - considerando histórico
   */
  static async buscarNivel(
    nivel: string,
    tipoUsuario: string,
    ano: number,
    mes?: number
  ): Promise<NivelSnapshot | null> {
    const niveis = await this.buscarNiveis(ano, mes);
    
    return niveis.find(n => 
      n.nivel === nivel && n.tipo_usuario === tipoUsuario
    ) || null;
  }
}