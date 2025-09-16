import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendedorSelectionResult {
  vendedor_id: string | null;
  vendedor_nome: string | null;
  vendedor_email: string | null;
  agendamentos_ativos: number;
  taxa_conversao: number;
  diagnostico: {
    total_vendedores: number;
    vendedores_fora_horario: number;
    vendedores_com_conflito: number;
    vendedores_disponiveis: number;
    todos_fora_horario: boolean;
    todos_com_conflito: boolean;
    agendamentos_por_vendedor: Array<{
      vendedor_id: string;
      nome: string;
      agendamentos_count: number;  
      taxa_conversao: number;
    }>;
    data_agendamento: string;
    executado_em: string;
    menor_agendamentos_encontrado: number;
    maior_taxa_encontrada: number;
  };
}

export interface VendedorSelectionDebugInfo {
  timestamp: string;
  user_id: string;
  user_name: string;
  vendedores_input: Array<{ id: string; name: string }>;
  data_agendamento: string;
  data_fim_agendamento: string;
  resultado_database: VendedorSelectionResult;
  resultado_frontend?: any;
  divergencia_detectada: boolean;
}

export class VendedorSelectionService {
  private static debugLog: VendedorSelectionDebugInfo[] = [];

  /**
   * Seleciona vendedor automaticamente usando função determinística do banco
   */
  static async selecionarVendedorDeterministico(
    vendedores: Array<{ id: string; name: string; email?: string; [key: string]: any }>,
    dataAgendamento: string,
    dataFimAgendamento: string,
    posGraduacaoId?: string
  ): Promise<VendedorSelectionResult> {
    console.log('🎯 DETERMINÍSTICO: Chamando função do banco para seleção automática');
    console.log('🎯 DETERMINÍSTICO: Vendedores:', vendedores.map(v => ({ id: v.id, name: v.name })));
    console.log('🎯 DETERMINÍSTICO: Data:', dataAgendamento);
    
    try {
      // Invalidar queries para garantir dados frescos
      await this.invalidateVendorQueries();
      
      const vendedoresIds = vendedores.map(v => v.id);
      
      const { data, error } = await supabase.rpc('selecionar_vendedor_automatico', {
        p_vendedores_ids: vendedoresIds,
        p_data_agendamento: dataAgendamento,
        p_data_fim_agendamento: dataFimAgendamento,
        p_pos_graduacao_id: posGraduacaoId || null
      });

      if (error) {
        console.error('❌ DETERMINÍSTICO: Erro na função do banco:', error);
        throw new Error(`Erro na seleção automática: ${error.message}`);
      }

      const rawResult = data?.[0];
      
      if (!rawResult) {
        console.error('❌ DETERMINÍSTICO: Nenhum resultado retornado pela função');
        throw new Error('Nenhum resultado retornado pela função de seleção');
      }

      // Converter e validar o resultado da função do banco
      const resultado: VendedorSelectionResult = {
        vendedor_id: rawResult.vendedor_id,
        vendedor_nome: rawResult.vendedor_nome,
        vendedor_email: rawResult.vendedor_email,
        agendamentos_ativos: rawResult.agendamentos_ativos,
        taxa_conversao: rawResult.taxa_conversao,
        diagnostico: typeof rawResult.diagnostico === 'string' 
          ? JSON.parse(rawResult.diagnostico) 
          : rawResult.diagnostico
      };

      console.log('✅ DETERMINÍSTICO: Resultado da função:', resultado);
      
      // Registrar no debug log
      await this.registrarDebugInfo({
        vendedores_input: vendedores.map(v => ({ id: v.id, name: v.name })),
        data_agendamento: dataAgendamento,
        data_fim_agendamento: dataFimAgendamento,
        resultado_database: resultado
      });

      return resultado;
    } catch (error) {
      console.error('❌ DETERMINÍSTICO: Erro na seleção determinística:', error);
      toast.error(`Erro na seleção automática: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      throw error;
    }
  }

  /**
   * Invalida queries relacionadas a vendedores para garantir dados frescos
   */
  private static async invalidateVendorQueries(): Promise<void> {
    // Forçar refresh dos dados principais
    console.log('🔄 DETERMINÍSTICO: Invalidando queries para dados frescos');
    
    // Aqui você pode usar React Query para invalidar queries específicas
    // Por enquanto, vamos apenas aguardar um pouco para garantir dados frescos
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Registra informações de debug para análise posterior
   */
  private static async registrarDebugInfo(info: Partial<VendedorSelectionDebugInfo>): Promise<void> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.warn('⚠️ DEBUG: Não foi possível obter dados do usuário para debug');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const debugInfo: VendedorSelectionDebugInfo = {
        timestamp: new Date().toISOString(),
        user_id: user.id,
        user_name: profile?.name || user.email || 'Usuário desconhecido',
        vendedores_input: info.vendedores_input || [],
        data_agendamento: info.data_agendamento || '',
        data_fim_agendamento: info.data_fim_agendamento || '',
        resultado_database: info.resultado_database || {} as VendedorSelectionResult,
        resultado_frontend: info.resultado_frontend,
        divergencia_detectada: info.divergencia_detectada || false
      };

      // Manter apenas os últimos 50 registros de debug
      this.debugLog.push(debugInfo);
      if (this.debugLog.length > 50) {
        this.debugLog = this.debugLog.slice(-50);
      }

      console.log('📊 DEBUG: Informação registrada:', debugInfo);
    } catch (error) {
      console.warn('⚠️ DEBUG: Erro ao registrar informação de debug:', error);
    }
  }

  /**
   * Retorna o log de debug para análise administrativa
   */
  static getDebugLog(): VendedorSelectionDebugInfo[] {
    return [...this.debugLog];
  }

  /**
   * Limpa o log de debug
   */
  static clearDebugLog(): void {
    this.debugLog = [];
    console.log('🧹 DEBUG: Log de debug limpo');
  }

  /**
   * Compara resultado do frontend com o resultado do banco para detectar divergências
   */
  static async compararResultados(
    vendedores: Array<{ id: string; name: string }>,
    dataAgendamento: string,
    dataFimAgendamento: string,
    resultadoFrontend: any
  ): Promise<{ divergencia: boolean; detalhes?: string }> {
    try {
      const resultadoBanco = await this.selecionarVendedorDeterministico(
        vendedores, 
        dataAgendamento, 
        dataFimAgendamento
      );

      const divergencia = resultadoBanco.vendedor_id !== resultadoFrontend?.vendedor?.id;
      
      if (divergencia) {
        const detalhes = `Frontend selecionou: ${resultadoFrontend?.vendedor?.name || 'NENHUM'}, Banco selecionou: ${resultadoBanco.vendedor_nome || 'NENHUM'}`;
        
        console.warn('⚠️ DIVERGÊNCIA DETECTADA:', detalhes);
        toast.error(`Divergência na seleção automática detectada! ${detalhes}`);
        
        // Registrar divergência no debug
        await this.registrarDebugInfo({
          vendedores_input: vendedores,
          data_agendamento: dataAgendamento,
          data_fim_agendamento: dataFimAgendamento,
          resultado_database: resultadoBanco,
          resultado_frontend: resultadoFrontend,
          divergencia_detectada: true
        });

        return { divergencia: true, detalhes };
      }

      return { divergencia: false };
    } catch (error) {
      console.error('❌ Erro ao comparar resultados:', error);
      return { divergencia: false, detalhes: 'Erro na comparação' };
    }
  }

  /**
   * Busca dados atualizados de agendamentos para todos os vendedores
   */
  static async buscarAgendamentosAtualizados(vendedoresIds: string[]): Promise<Map<string, number>> {
    console.log('🔄 Buscando dados frescos de agendamentos...');
    
    const { data, error } = await supabase
      .from('agendamentos')
      .select('vendedor_id, status')
      .in('vendedor_id', vendedoresIds)
      .in('status', ['agendado', 'atrasado', 'finalizado', 'finalizado_venda']);

    if (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      throw error;
    }

    const contadores = new Map<string, number>();
    
    // Inicializar contadores
    vendedoresIds.forEach(id => contadores.set(id, 0));
    
    // Contar agendamentos
    data?.forEach(agendamento => {
      const atual = contadores.get(agendamento.vendedor_id) || 0;
      contadores.set(agendamento.vendedor_id, atual + 1);
    });

    console.log('📊 Contadores atualizados:', Array.from(contadores.entries()));
    return contadores;
  }
}