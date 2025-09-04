import { supabase } from '@/integrations/supabase/client';

export class SemanasConsecutivasService {
  static async calcularSemanasConsecutivas(vendedorId: string): Promise<number> {
    console.log('🔄 Calculando semanas consecutivas para vendedor:', vendedorId);
    
    try {
      // Buscar o perfil do vendedor e verificar se está ativo
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, nivel, ativo')
        .eq('id', vendedorId)
        .single();

      if (profileError || !profile) {
        console.error('❌ Erro ao buscar perfil:', profileError);
        return 0;
      }

      if (!profile.ativo) {
        console.log(`⚠️ Vendedor desativado: ${vendedorId}`);
        return 0;
      }

      // Determinar se é vendedor ou SDR
      const isSDR = profile.user_type === 'sdr' || profile.user_type === 'sdr_inbound' || profile.user_type === 'sdr_outbound';
      
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
      .select('data_aprovacao, pontuacao_validada, pontuacao_esperada')
      .eq('vendedor_id', vendedorId)
      .eq('status', 'matriculado')
      .not('data_aprovacao', 'is', null);

    if (vendasError) {
      console.error('❌ Erro ao buscar vendas:', vendasError);
      return 0;
    }

    let semanasConsecutivas = 0;
    const hoje = new Date();
    const { ano: anoAtual, semana: semanaAtual } = this.getAnoSemanaFromDate(hoje);
    
    // Verificar cada semana (da mais recente para a mais antiga), excluindo a semana atual
    for (const meta of metasSemanais) {
      // Pular a semana atual (que ainda está em progresso)
      if (meta.ano === anoAtual && meta.semana === semanaAtual) {
        console.log(`⏳ Pulando semana atual ${meta.semana}/${meta.ano} (em progresso)`);
        continue;
      }
      
      const pontuacaoNaSemana = this.calcularPontuacaoNaSemana(vendas || [], meta.ano, meta.semana);
      
      console.log(`🔍 Semana ${meta.semana}/${meta.ano}: Pontuação=${pontuacaoNaSemana}, Meta=${meta.meta_vendas}`);
      
      // Meta batida se pontuação >= meta (100% ou mais)
      if (pontuacaoNaSemana >= meta.meta_vendas) {
        semanasConsecutivas++;
        console.log(`✅ Meta batida na semana ${meta.semana}/${meta.ano}! Total consecutivas: ${semanasConsecutivas}`);
      } else {
        console.log(`❌ Meta não batida na semana ${meta.semana}/${meta.ano}. Zerando contador.`);
        // Se não bateu a meta nesta semana, para a contagem (contador zerado)
        break;
      }
    }

    console.log(`🏆 Total de semanas consecutivas batendo meta (excluindo semana atual): ${semanasConsecutivas}`);
    return semanasConsecutivas;
  }

  private static async calcularSemanasConsecutivasSDR(vendedorId: string, nivel: string): Promise<number> {
    // Buscar meta semanal baseada no nível do SDR
    const { data: nivelConfig, error: nivelError } = await supabase
      .from('niveis_vendedores')
      .select('meta_semanal_inbound, meta_semanal_outbound, tipo_usuario')
      .eq('nivel', nivel)
      .eq('tipo_usuario', 'sdr') // Buscar SDR independente do tipo específico
      .single();

    if (nivelError) {
      console.error('❌ Erro ao buscar configuração de nível:', nivelError);
      return 0;
    }

    // Buscar tipo do SDR, data de criação e verificar se está ativo
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, created_at, ativo')
      .eq('id', vendedorId)
      .single();

    if (profileError || !profile) {
      return 0;
    }

    if (!profile.ativo) {
      console.log(`⚠️ SDR desativado: ${vendedorId}`);
      return 0;
    }

    // Para SDRs, usar meta de agendamentos em vez de vendas de cursos
    const metaSemanal = profile.user_type === 'sdr_inbound' 
      ? nivelConfig?.meta_semanal_inbound || 0
      : nivelConfig?.meta_semanal_outbound || 0;

    // Buscar agendamentos realizados do SDR (apenas os que tiveram presença)
    const { data: agendamentos, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select('data_agendamento, resultado_reuniao, status')
      .eq('sdr_id', vendedorId)
      .eq('status', 'finalizado')
      .in('resultado_reuniao', ['presente', 'compareceu', 'realizada']);

    if (agendamentosError) {
      console.error('❌ Erro ao buscar agendamentos:', agendamentosError);
      return 0;
    }

    // Calcular semanas desde a mais recente (excluindo a semana atual)
    const hoje = new Date();
    const dataCriacao = new Date(profile.created_at);
    const { ano: anoCriacao, semana: semanaCriacao } = this.getAnoSemanaFromDate(dataCriacao);
    const { ano: anoHoje, semana: semanaHoje } = this.getAnoSemanaFromDate(hoje);
    
    let semanasConsecutivas = 0;
    let semanaVerificar = semanaHoje - 1; // Começar da semana anterior (não incluir a atual)
    let anoVerificar = anoHoje;
    
    // Ajustar se a semana ficou negativa (ir para ano anterior)
    if (semanaVerificar <= 0) {
      anoVerificar--;
      semanaVerificar = 52; // Assumindo 52 semanas por ano
    }

    // Verificar semanas desde a criação até agora (máximo 20 semanas para performance)
    for (let i = 0; i < 20; i++) {
      // Parar se chegamos na semana de criação do usuário
      if (anoVerificar < anoCriacao || (anoVerificar === anoCriacao && semanaVerificar < semanaCriacao)) {
        break;
      }
      
      const agendamentosNaSemana = this.contarAgendamentosNaSemana(
        agendamentos || [], 
        anoVerificar, 
        semanaVerificar
      );
      
      console.log(`🔍 SDR Semana ${semanaVerificar}/${anoVerificar}: ${agendamentosNaSemana} agendamentos, Meta: ${metaSemanal}`);
      
      // Meta batida se agendamentos >= meta (100% ou mais)
      if (agendamentosNaSemana >= metaSemanal) {
        semanasConsecutivas++;
        console.log(`✅ Meta de agendamentos batida na semana ${semanaVerificar}/${anoVerificar}! Total consecutivas: ${semanasConsecutivas}`);
      } else {
        console.log(`❌ Meta de agendamentos não batida na semana ${semanaVerificar}/${anoVerificar}. Zerando contador.`);
        // Se não bateu a meta nesta semana, para a contagem (contador zerado)
        break;
      }

      // Ir para semana anterior
      semanaVerificar--;
      if (semanaVerificar <= 0) {
        anoVerificar--;
        semanaVerificar = 52; // Assumindo 52 semanas por ano
      }
    }

    console.log(`🏆 SDR Total de semanas consecutivas batendo meta de agendamentos (excluindo semana atual): ${semanasConsecutivas}`);
    return semanasConsecutivas;
  }

  private static calcularPontuacaoNaSemana(vendas: any[], ano: number, semana: number): number {
    const vendasDaSemana = vendas.filter(venda => {
      if (!venda.data_aprovacao) return false;
      
      const dataAprovacao = new Date(venda.data_aprovacao);
      const { ano: anoVenda, semana: semanaVenda } = this.getAnoSemanaFromDate(dataAprovacao);
      
      return anoVenda === ano && semanaVenda === semana;
    });

    // Somar pontuação das vendas da semana
    const pontuacaoTotal = vendasDaSemana.reduce((total, venda) => {
      const pontuacao = venda.pontuacao_validada || venda.pontuacao_esperada || 0;
      return total + pontuacao;
    }, 0);

    console.log(`📊 Semana ${semana}/${ano}: ${vendasDaSemana.length} vendas, ${pontuacaoTotal} pontos`);
    return pontuacaoTotal;
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
    // Verificar se o usuário está ativo antes de atualizar
    const { data: profile } = await supabase
      .from('profiles')
      .select('ativo')
      .eq('id', vendedorId)
      .single();
    
    if (!profile?.ativo) {
      console.log(`⚠️ Usuário desativado, não atualizando semanas consecutivas: ${vendedorId}`);
      return;
    }
    
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