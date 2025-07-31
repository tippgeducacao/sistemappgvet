import { supabase } from '@/integrations/supabase/client';

export interface AvaliacaoSemanal {
  id: string;
  vendedor_id: string;
  ano: number;
  semana: number;
  total_reunioes_realizadas: number;
  total_matriculas: number;
  taxa_conversao: number;
  classificacao: string;
  semanas_consecutivas_abaixo_meta: number;
  status_risco: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  vendedor?: {
    name: string;
    email: string;
    photo_url?: string;
  };
}

export class AvaliacaoSemanalService {
  /**
   * Calcula avaliação semanal para um vendedor específico
   */
  static async calcularAvaliacaoSemanal(
    vendedorId: string, 
    ano: number, 
    semana: number
  ): Promise<void> {
    const { error } = await supabase.rpc('calcular_avaliacao_semanal_vendedor', {
      p_vendedor_id: vendedorId,
      p_ano: ano,
      p_semana: semana
    });

    if (error) {
      console.error('❌ Erro ao calcular avaliação semanal:', error);
      throw error;
    }
  }

  /**
   * Busca avaliações semanais de um vendedor
   */
  static async getAvaliacoesByVendedor(
    vendedorId: string,
    ano?: number
  ): Promise<AvaliacaoSemanal[]> {
    let query = supabase
      .from('avaliacoes_semanais_vendedores')
      .select(`
        *,
        vendedor:profiles!vendedor_id (
          name,
          email,
          photo_url
        )
      `)
      .eq('vendedor_id', vendedorId)
      .order('ano', { ascending: false })
      .order('semana', { ascending: false });

    if (ano) {
      query = query.eq('ano', ano);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar avaliações semanais:', error);
      throw error;
    }

    return (data || []) as unknown as AvaliacaoSemanal[];
  }

  /**
   * Busca todas as avaliações semanais (para admins)
   */
  static async getAllAvaliacoes(
    ano?: number,
    semana?: number
  ): Promise<AvaliacaoSemanal[]> {
    let query = supabase
      .from('avaliacoes_semanais_vendedores')
      .select(`
        *,
        vendedor:profiles!vendedor_id (
          name,
          email,
          photo_url
        )
      `)
      .order('ano', { ascending: false })
      .order('semana', { ascending: false })
      .order('taxa_conversao', { ascending: true });

    if (ano) {
      query = query.eq('ano', ano);
    }

    if (semana) {
      query = query.eq('semana', semana);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar todas as avaliações:', error);
      throw error;
    }

    return (data || []) as unknown as AvaliacaoSemanal[];
  }

  /**
   * Busca vendedores em situação de risco
   */
  static async getVendedoresEmRisco(): Promise<AvaliacaoSemanal[]> {
    const { data, error } = await supabase
      .from('avaliacoes_semanais_vendedores')
      .select(`
        *,
        vendedor:profiles!vendedor_id (
          name,
          email,
          photo_url
        )
      `)
      .in('status_risco', ['risco', 'critico'])
      .order('semanas_consecutivas_abaixo_meta', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar vendedores em risco:', error);
      throw error;
    }

    return (data || []) as unknown as AvaliacaoSemanal[];
  }

  /**
   * Adiciona observação a uma avaliação
   */
  static async adicionarObservacao(
    avaliacaoId: string,
    observacao: string
  ): Promise<void> {
    const { error } = await supabase
      .from('avaliacoes_semanais_vendedores')
      .update({ observacoes: observacao, updated_at: new Date().toISOString() })
      .eq('id', avaliacaoId);

    if (error) {
      console.error('❌ Erro ao adicionar observação:', error);
      throw error;
    }
  }

  /**
   * Calcula avaliações para todos os vendedores de uma semana
   */
  static async calcularAvaliacoesDaSemana(
    ano: number,
    semana: number
  ): Promise<void> {
    // Buscar todos os vendedores ativos
    const { data: vendedores, error: vendedoresError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_type', 'vendedor')
      .eq('ativo', true);

    if (vendedoresError) {
      console.error('❌ Erro ao buscar vendedores:', vendedoresError);
      throw vendedoresError;
    }

    // Calcular avaliação para cada vendedor
    for (const vendedor of vendedores || []) {
      try {
        await this.calcularAvaliacaoSemanal(vendedor.id, ano, semana);
      } catch (error) {
        console.error(`❌ Erro ao calcular avaliação para vendedor ${vendedor.id}:`, error);
      }
    }
  }

  /**
   * Obtém classificação e cor para exibição
   */
  static getClassificacaoInfo(avaliacao: AvaliacaoSemanal) {
    switch (avaliacao.classificacao) {
      case 'excelente':
        return {
          label: '🟢 Vendedor Excelente',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          description: 'Mantém leads qualificados'
        };
      case 'recuperacao':
        return {
          label: '🔴 Plano de Recuperação',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          description: avaliacao.semanas_consecutivas_abaixo_meta >= 4 
            ? 'Desligamento programado' 
            : 'Acompanhamento necessário'
        };
      default:
        return {
          label: '⏳ Pendente',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          description: 'Aguardando cálculo'
        };
    }
  }

  /**
   * Obtém status de risco e cor
   */
  static getStatusRiscoInfo(status: string) {
    switch (status) {
      case 'critico':
        return {
          label: '🚨 Crítico',
          color: 'text-red-700',
          bgColor: 'bg-red-200',
          description: '4+ semanas consecutivas'
        };
      case 'risco':
        return {
          label: '⚠️ Risco',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          description: '2-3 semanas consecutivas'
        };
      default:
        return {
          label: '✅ Normal',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          description: 'Dentro da meta'
        };
    }
  }
}