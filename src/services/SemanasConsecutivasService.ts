import { supabase } from '@/integrations/supabase/client';

export class SemanasConsecutivasService {
  static async calcularSemanasConsecutivas(vendedorId: string): Promise<number> {
    console.log('🔄 Calculando semanas consecutivas para vendedor:', vendedorId);
    
    try {
      // Buscar o perfil do vendedor
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, nivel')
        .eq('id', vendedorId)
        .single();

      if (profileError || !profile) {
        console.error('❌ Erro ao buscar perfil:', profileError);
        return 0;
      }

      // Determinar se é vendedor ou SDR
      const isSDR = profile.user_type === 'sdr_inbound' || profile.user_type === 'sdr_outbound';
      
      if (isSDR) {
        return await this.calcularSemanasConsecutivasSDR(vendedorId, profile.nivel);
      } else {
        return await this.calcularSemanasConsecutivasVendedor(vendedorId);
      }
    } catch (error) {
      console.error('❌ Erro ao calcular semanas consecutivas:', error);
      return 0;
    }
  }

  private static async calcularSemanasConsecutivasVendedor(vendedorId: string): Promise<number> {
    // Buscar metas semanais do vendedor (ordenadas por semana mais recente)
    const { data: metasSemanais, error: metasError } = await supabase
      .from('metas_semanais_vendedores')
      .select('*')
      .eq('vendedor_id', vendedorId)
      .order('ano', { ascending: false })
      .order('semana', { ascending: false });

    if (metasError || !metasSemanais) {
      console.error('❌ Erro ao buscar metas semanais:', metasError);
      return 0;
    }

    // Buscar todas as vendas aprovadas do vendedor
    const { data: vendas, error: vendasError } = await supabase
      .from('form_entries')
      .select('data_aprovacao, pontuacao_validada')
      .eq('vendedor_id', vendedorId)
      .eq('status', 'matriculado')
      .not('data_aprovacao', 'is', null);

    if (vendasError) {
      console.error('❌ Erro ao buscar vendas:', vendasError);
      return 0;
    }

    let semanasConsecutivas = 0;
    
    // Verificar cada semana (da mais recente para a mais antiga)
    for (const meta of metasSemanais) {
      const vendasNaSemana = this.contarVendasNaSemana(vendas || [], meta.ano, meta.semana);
      
      if (vendasNaSemana >= meta.meta_vendas) {
        semanasConsecutivas++;
      } else {
        // Se não bateu a meta nesta semana, para a contagem
        break;
      }
    }

    return semanasConsecutivas;
  }

  private static async calcularSemanasConsecutivasSDR(vendedorId: string, nivel: string): Promise<number> {
    // Buscar meta semanal baseada no nível do SDR
    const { data: nivelConfig, error: nivelError } = await supabase
      .from('niveis_vendedores')
      .select('meta_semanal_inbound, meta_semanal_outbound, tipo_usuario')
      .eq('nivel', nivel)
      .eq('tipo_usuario', 'sdr_inbound') // Vamos usar como base e ajustar depois
      .single();

    if (nivelError) {
      console.error('❌ Erro ao buscar configuração de nível:', nivelError);
      return 0;
    }

    // Buscar tipo do SDR
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', vendedorId)
      .single();

    if (profileError || !profile) {
      return 0;
    }

    const metaSemanal = profile.user_type === 'sdr_inbound' 
      ? nivelConfig?.meta_semanal_inbound || 0
      : nivelConfig?.meta_semanal_outbound || 0;

    // Buscar agendamentos do SDR
    const { data: agendamentos, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select('data_agendamento, resultado_reuniao')
      .eq('sdr_id', vendedorId)
      .in('resultado_reuniao', ['compareceu', 'compareceu_vendeu']);

    if (agendamentosError) {
      console.error('❌ Erro ao buscar agendamentos:', agendamentosError);
      return 0;
    }

    // Calcular semanas desde a mais recente
    const hoje = new Date();
    let semanasConsecutivas = 0;
    let semanaAtual = this.getSemanaAtual();
    let anoAtual = hoje.getFullYear();

    // Verificar as últimas 20 semanas (aproximadamente 5 meses)
    for (let i = 0; i < 20; i++) {
      const agendamentosNaSemana = this.contarAgendamentosNaSemana(
        agendamentos || [], 
        anoAtual, 
        semanaAtual
      );
      
      if (agendamentosNaSemana >= metaSemanal) {
        semanasConsecutivas++;
      } else {
        // Se não bateu a meta nesta semana, para a contagem
        break;
      }

      // Ir para semana anterior
      semanaAtual--;
      if (semanaAtual <= 0) {
        anoAtual--;
        semanaAtual = 52; // Assumindo 52 semanas por ano
      }
    }

    return semanasConsecutivas;
  }

  private static contarVendasNaSemana(vendas: any[], ano: number, semana: number): number {
    return vendas.filter(venda => {
      if (!venda.data_aprovacao) return false;
      
      const dataAprovacao = new Date(venda.data_aprovacao);
      const { ano: anoVenda, semana: semanaVenda } = this.getAnoSemanaFromDate(dataAprovacao);
      
      return anoVenda === ano && semanaVenda === semana;
    }).length;
  }

  private static contarAgendamentosNaSemana(agendamentos: any[], ano: number, semana: number): number {
    return agendamentos.filter(agendamento => {
      if (!agendamento.data_agendamento) return false;
      
      const dataAgendamento = new Date(agendamento.data_agendamento);
      const { ano: anoAgendamento, semana: semanaAgendamento } = this.getAnoSemanaFromDate(dataAgendamento);
      
      return anoAgendamento === ano && semanaAgendamento === semana;
    }).length;
  }

  private static getSemanaAtual(): number {
    const hoje = new Date();
    // Usar a lógica padrão do sistema (quarta a terça)
    const { semana } = this.getAnoSemanaFromDate(hoje);
    return semana;
  }

  private static getAnoSemanaFromDate(data: Date): { ano: number; semana: number } {
    const ano = data.getFullYear();
    
    // Encontrar a primeira terça-feira do ano
    const primeiraTerca = new Date(ano, 0, 1);
    while (primeiraTerca.getDay() !== 2) { // 2 = terça-feira
      primeiraTerca.setDate(primeiraTerca.getDate() + 1);
    }
    
    // Se a data for antes da primeira terça, pertence ao ano anterior
    if (data < primeiraTerca) {
      return this.getAnoSemanaFromDate(new Date(ano - 1, 11, 31));
    }
    
    // Calcular diferença em milissegundos
    const diffMs = data.getTime() - primeiraTerca.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Calcular número da semana (cada 7 dias = 1 semana)
    const semana = Math.floor(diffDays / 7) + 1;
    
    return { ano, semana };
  }

  static async atualizarSemanasConsecutivas(vendedorId: string): Promise<void> {
    const semanas = await this.calcularSemanasConsecutivas(vendedorId);
    
    const { error } = await supabase
      .from('profiles')
      .update({ semanas_consecutivas_meta: semanas })
      .eq('id', vendedorId);

    if (error) {
      console.error('❌ Erro ao atualizar semanas consecutivas:', error);
    } else {
      console.log('✅ Semanas consecutivas atualizadas:', semanas);
    }
  }
}