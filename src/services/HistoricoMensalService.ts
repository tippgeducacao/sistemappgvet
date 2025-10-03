import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/services/logger/LoggerService';

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
  snapshot_membros: any;
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

export interface MembrosGrupoSnapshot {
  usuario_id: string;
  nome: string;
  user_type: string;
  nivel: string;
  ativo: boolean;
  created_at: string;
  left_at?: string;
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
      .maybeSingle();

    if (error) {
      Logger.error('Erro ao buscar histórico mensal', error);
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
      Logger.error('Erro ao listar históricos', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Verificar se um mês está fechado (automático baseado em data)
   */
  static async isMesFechado(ano: number, mes: number): Promise<boolean> {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    
    // Mês está fechado se é anterior ao mês atual
    return ano < anoAtual || (ano === anoAtual && mes < mesAtual);
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
        Logger.error('Erro ao fechar mês', error);
        throw error;
      }

      return data;
    } catch (error) {
      Logger.error('Erro ao executar fechamento do mês', error);
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
        Logger.error('Erro ao reabrir mês', error);
        throw error;
      }

      return data;
    } catch (error) {
      Logger.error('Erro ao executar reabertura do mês', error);
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
    
    if ((window as any).DEBUG_COMMISSION) {
      Logger.debug('Multiplicador histórico', {
        percentual,
        tipoUsuario,
        regras: regras.filter(r => r.tipo_usuario === tipoUsuario).map(r => `${r.percentual_minimo}-${r.percentual_maximo}: ${r.multiplicador}x`)
      });
    }
    
    // LÓGICA CORRIGIDA: encontrar a regra mais específica aplicável  
    let regraAplicavel = null;
    const regrasUsuario = regras.filter(r => r.tipo_usuario === tipoUsuario);
    
    // Ordenar regras por percentual_minimo DESC para pegar a mais específica primeiro
    const regrasOrdenadas = regrasUsuario.sort((a, b) => b.percentual_minimo - a.percentual_minimo);
    
    for (const regra of regrasOrdenadas) {
      // Para percentuais >= 999 (muito altos) - verificar primeiro
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

    if ((window as any).DEBUG_COMMISSION) {
      Logger.debug('Regra selecionada', {
        percentual,
        regra: regraAplicavel ? `${regraAplicavel.percentual_minimo}-${regraAplicavel.percentual_maximo}: ${regraAplicavel.multiplicador}x` : 'NENHUMA'
      });
    }

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

  /**
   * Buscar membros de grupos - usa histórico se mês fechado
   */
  static async buscarMembrosGrupos(ano: number, mes?: number): Promise<Record<string, MembrosGrupoSnapshot[]>> {
    if (!mes) {
      // Usar dados atuais
      const { data, error } = await supabase
        .from('membros_grupos_supervisores')
        .select(`
          grupo_id,
          usuario_id,
          created_at,
          left_at,
          usuario:profiles!usuario_id(
            name,
            user_type,
            nivel,
            ativo
          )
        `);

      if (error) throw error;
      
      // Organizar por grupo_id
      const membrosPorGrupo: Record<string, MembrosGrupoSnapshot[]> = {};
      data?.forEach(membro => {
        const grupoId = membro.grupo_id;
        if (!membrosPorGrupo[grupoId]) {
          membrosPorGrupo[grupoId] = [];
        }
        membrosPorGrupo[grupoId].push({
          usuario_id: membro.usuario_id,
          nome: membro.usuario?.name || '',
          user_type: membro.usuario?.user_type || '',
          nivel: membro.usuario?.nivel || '',
          ativo: membro.usuario?.ativo || false,
          created_at: membro.created_at,
          left_at: membro.left_at
        });
      });
      
      return membrosPorGrupo;
    }

    const isFechado = await this.isMesFechado(ano, mes);
    
    if (isFechado) {
      const historico = await this.buscarHistoricoMes(ano, mes);
      return historico?.snapshot_membros || {};
    } else {
      // Usar dados atuais (mesmo código de acima)
      const { data, error } = await supabase
        .from('membros_grupos_supervisores')
        .select(`
          grupo_id,
          usuario_id,
          created_at,
          left_at,
          usuario:profiles!usuario_id(
            name,
            user_type,
            nivel,
            ativo
          )
        `);

      if (error) throw error;
      
      const membrosPorGrupo: Record<string, MembrosGrupoSnapshot[]> = {};
      data?.forEach(membro => {
        const grupoId = membro.grupo_id;
        if (!membrosPorGrupo[grupoId]) {
          membrosPorGrupo[grupoId] = [];
        }
        membrosPorGrupo[grupoId].push({
          usuario_id: membro.usuario_id,
          nome: membro.usuario?.name || '',
          user_type: membro.usuario?.user_type || '',
          nivel: membro.usuario?.nivel || '',
          ativo: membro.usuario?.ativo || false,
          created_at: membro.created_at,
          left_at: membro.left_at
        });
      });
      
      return membrosPorGrupo;
    }
  }

  /**
   * Buscar membros válidos para um período específico
   */
  static async buscarMembrosValidosParaPeriodo(
    grupoId: string,
    dataInicio: Date,
    dataFim: Date,
    ano: number,
    mes?: number
  ): Promise<MembrosGrupoSnapshot[]> {
    const membrosPorGrupo = await this.buscarMembrosGrupos(ano, mes);
    const membrosDoGrupo = membrosPorGrupo[grupoId] || [];
    
    return membrosDoGrupo.filter(membro => {
      const criadoEm = new Date(membro.created_at);
      const saídaEm = membro.left_at ? new Date(membro.left_at) : null;
      
      // Membro deve ter sido criado antes ou durante o período
      const criadoNoPeriodo = criadoEm <= dataFim;
      
      // Se tem data de saída, deve ter saído depois do início do período
      const validoNoPeriodo = !saídaEm || saídaEm >= dataInicio;
      
      return criadoNoPeriodo && validoNoPeriodo;
    });
  }
}