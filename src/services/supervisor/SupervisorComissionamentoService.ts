import { supabase } from '@/integrations/supabase/client';
import { ComissionamentoService } from '@/services/comissionamentoService';
import { getWeekRange } from '@/utils/semanaUtils';

export interface SupervisorComissionamentoData {
  supervisorId: string;
  nome: string;
  grupoId: string;
  nomeGrupo: string;
  ano: number;
  semana: number;
  totalSDRs: number;
  mediaPercentualAtingimento: number;
  variabelSemanal: number;
  multiplicador: number;
  valorComissao: number;
  sdrsDetalhes: SDRResumo[];
}

export interface SDRResumo {
  id: string;
  nome: string;
  percentualAtingimento: number;
  reunioesRealizadas: number;
  metaSemanal: number;
}

export class SupervisorComissionamentoService {
  static async calcularComissionamentoSupervisorSemanaAtual(
    supervisorId: string
  ): Promise<SupervisorComissionamentoData | null> {
    try {
      // Usar getWeekRange para calcular as datas da semana atual (quarta a terça)
      const { start: inicioSemana, end: fimSemana } = getWeekRange();
      
      console.log('📅 Calculando comissionamento supervisor - semana atual:', {
        supervisorId,
        inicioSemana: inicioSemana.toLocaleDateString('pt-BR'),
        fimSemana: fimSemana.toLocaleDateString('pt-BR')
      });

      // Buscar dados do supervisor
      const { data: supervisorData, error: supervisorError } = await supabase
        .from('profiles')
        .select('name, nivel, user_type, ativo')
        .eq('id', supervisorId)
        .eq('user_type', 'supervisor')
        .eq('ativo', true)
        .maybeSingle();

      if (supervisorError || !supervisorData) {
        console.error('❌ Erro ao buscar dados do supervisor:', supervisorError);
        console.log('🔍 Supervisor ID:', supervisorId);
        return null;
      }
      
      console.log('✅ Dados do supervisor encontrados:', supervisorData);

      // Buscar grupo do supervisor
      const { data: grupoData, error: grupoError } = await supabase
        .from('grupos_supervisores')
        .select('id, nome_grupo')
        .eq('supervisor_id', supervisorId)
        .maybeSingle();

      if (grupoError || !grupoData) {
        console.error('❌ Erro ao buscar grupo do supervisor:', grupoError);
        console.log('🔍 Supervisor ID para busca de grupo:', supervisorId);
        return null;
      }
      
      console.log('✅ Grupo do supervisor encontrado:', grupoData);

      // Buscar SDRs do grupo
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros_grupos_supervisores')
        .select(`
          usuario_id,
          usuario:profiles!usuario_id(
            id,
            name,
            nivel,
            user_type,
            ativo
          )
        `)
        .eq('grupo_id', grupoData.id);

      if (membrosError || !membrosData) {
        console.error('❌ Erro ao buscar membros do grupo:', membrosError);
        console.log('🔍 Grupo ID para busca de membros:', grupoData.id);
        return null;
      }
      
      console.log('✅ Membros encontrados:', membrosData.length, 'membros');

      // Filtrar apenas membros ativos (SDRs e Vendedores)
      const membrosAtivos = membrosData.filter(
        membro => membro.usuario?.ativo === true && 
        (membro.usuario?.user_type === 'sdr' || membro.usuario?.user_type === 'vendedor')
      );

      console.log('👥 Membros ativos encontrados:', membrosAtivos.length);
      
      if (membrosAtivos.length === 0) {
        console.warn('⚠️ Nenhum membro ativo encontrado no grupo');
        console.log('🔍 Membros brutos:', membrosData);
        return {
          supervisorId,
          nome: supervisorData.name,
          grupoId: grupoData.id,
          nomeGrupo: grupoData.nome_grupo,
          ano: new Date().getFullYear(),
          semana: 0,
          totalSDRs: 0,
          mediaPercentualAtingimento: 0,
          variabelSemanal: 0,
          multiplicador: 0,
          valorComissao: 0,
          sdrsDetalhes: []
        };
      }

      // Calcular percentual de atingimento para cada membro na semana atual
      const sdrsDetalhes: SDRResumo[] = [];
      let somaPercentuais = 0;

      for (const membro of membrosAtivos) {
        const membroId = membro.usuario_id;
        const membroNome = membro.usuario?.name || 'Membro';
        const membroNivel = membro.usuario?.nivel || 'junior';
        const membroTipo = membro.usuario?.user_type;

        console.log(`🔍 Processando membro: ${membroNome} (${membroTipo}) - Nível: ${membroNivel}`);
        
        // Buscar meta baseada no tipo e nível do membro
        const { data: nivelData } = await supabase
          .from('niveis_vendedores')
          .select('meta_semanal_inbound, meta_semanal_outbound, meta_semanal_vendedor')
          .eq('nivel', membroNivel)
          .eq('tipo_usuario', membroTipo === 'vendedor' ? 'vendedor' : 'sdr')
          .maybeSingle();

        console.log(`📊 Nível data para ${membroNome}:`, nivelData);

        let metaSemanal = 0;
        if (membroTipo === 'vendedor') {
          metaSemanal = nivelData?.meta_semanal_vendedor || 0;
        } else if (membroTipo === 'sdr') {
          // Para SDRs, usar meta_semanal_inbound (campo correto)
          metaSemanal = nivelData?.meta_semanal_inbound || 55;
        }

        console.log(`🎯 Meta semanal para ${membroNome}: ${metaSemanal}`);
        
        // Buscar atividades realizadas baseada no tipo
        let reunioesRealizadas = 0;
        
        if (membroTipo === 'sdr') {
          // Para SDRs: buscar por sdr_id
            const { data: agendamentos, error: agendamentosError } = await supabase
            .from('agendamentos')
            .select('id')
            .eq('sdr_id', membroId)
            .gte('data_agendamento', inicioSemana.toISOString())
            .lte('data_agendamento', fimSemana.toISOString())
            .not('resultado_reuniao', 'is', null);
            
          console.log(`📅 Agendamentos SDR ${membroNome}:`, agendamentos?.length || 0, 'encontrados');
          if (agendamentosError) console.log('❌ Erro agendamentos SDR:', agendamentosError);
          reunioesRealizadas = agendamentos?.length || 0;
        } else if (membroTipo === 'vendedor') {
          // Para vendedores: buscar por vendedor_id
          const { data: agendamentos, error: agendamentosError } = await supabase
            .from('agendamentos')
            .select('id')
            .eq('vendedor_id', membroId)
            .gte('data_agendamento', inicioSemana.toISOString())
            .lte('data_agendamento', fimSemana.toISOString())
            .not('resultado_reuniao', 'is', null);
            
          console.log(`📅 Agendamentos Vendedor ${membroNome}:`, agendamentos?.length || 0, 'encontrados');
          if (agendamentosError) console.log('❌ Erro agendamentos Vendedor:', agendamentosError);
          reunioesRealizadas = agendamentos?.length || 0;
        }

        const percentualAtingimento = metaSemanal > 0 ? (reunioesRealizadas / metaSemanal) * 100 : 0;

        console.log(`📊 ${membroTipo.toUpperCase()} ${membroNome}: ${reunioesRealizadas}/${metaSemanal} = ${percentualAtingimento.toFixed(1)}%`);

        sdrsDetalhes.push({
          id: membroId,
          nome: membroNome,
          percentualAtingimento: Math.round(percentualAtingimento * 100) / 100,
          reunioesRealizadas,
          metaSemanal
        });

        somaPercentuais += percentualAtingimento;
      }

      // Calcular média das porcentagens (Meta Coletiva)
      const mediaPercentualAtingimento = somaPercentuais / membrosAtivos.length;

      console.log(`🎯 Meta Coletiva: ${mediaPercentualAtingimento.toFixed(1)}% (média de ${membrosAtivos.length} membros)`);

      // Buscar variável semanal do supervisor
      const { data: nivelSupervisorData, error: nivelSupervisorError } = await supabase
        .from('niveis_vendedores')
        .select('variavel_semanal')
        .eq('nivel', supervisorData.nivel)
        .eq('tipo_usuario', 'supervisor')
        .maybeSingle();

      if (nivelSupervisorError || !nivelSupervisorData) {
        console.error('❌ Erro ao buscar dados do nível do supervisor:', nivelSupervisorError);
        return null;
      }

      const variabelSemanal = nivelSupervisorData.variavel_semanal;

      // Calcular comissão baseada na média percentual (usando 100 como meta base)
      const { multiplicador, valor } = await ComissionamentoService.calcularComissao(
        mediaPercentualAtingimento,
        100, // Meta base de 100%
        variabelSemanal,
        'supervisor'
      );

      console.log(`💰 Comissão supervisor: R$ ${valor.toFixed(2)} (multiplicador: ${multiplicador})`);

      return {
        supervisorId,
        nome: supervisorData.name,
        grupoId: grupoData.id,
        nomeGrupo: grupoData.nome_grupo,
        ano: inicioSemana.getFullYear(),
        semana: this.getWeekNumber(inicioSemana),
        totalSDRs: membrosAtivos.length,
        mediaPercentualAtingimento: Math.round(mediaPercentualAtingimento * 100) / 100,
        variabelSemanal,
        multiplicador,
        valorComissao: valor,
        sdrsDetalhes
      };

    } catch (error) {
      console.error('❌ Erro ao calcular comissionamento do supervisor:', error);
      return null;
    }
  }

  static async calcularComissionamentoSupervisor(
    supervisorId: string,
    ano: number,
    mes: number,
    semana: number
  ): Promise<SupervisorComissionamentoData | null> {
    try {
      console.log(`🔍 CALCULANDO COMISSIONAMENTO: Supervisor ${supervisorId}, Ano ${ano}, Mês ${mes}, Semana ${semana}`);
      
      // IMPORTANTE: Usar o mês passado como parâmetro para o cálculo das semanas
      const { inicioSemana, fimSemana } = this.calcularDatasSemanaDoMes(ano, mes, semana);
      
      console.log(`📅 Período calculado: ${inicioSemana.toLocaleDateString('pt-BR')} a ${fimSemana.toLocaleDateString('pt-BR')}`);

      // Buscar dados do supervisor
      const { data: supervisorData, error: supervisorError } = await supabase
        .from('profiles')
        .select('name, nivel, user_type, ativo')
        .eq('id', supervisorId)
        .eq('user_type', 'supervisor')
        .eq('ativo', true)
        .maybeSingle();

      if (supervisorError || !supervisorData) {
        console.error('❌ Erro ao buscar dados do supervisor:', supervisorError);
        return null;
      }

      console.log('✅ Supervisor encontrado:', supervisorData.name);

      // Buscar grupo do supervisor
      const { data: grupoData, error: grupoError } = await supabase
        .from('grupos_supervisores')
        .select('id, nome_grupo')
        .eq('supervisor_id', supervisorId)
        .maybeSingle();

      if (grupoError || !grupoData) {
        console.error('❌ Erro ao buscar grupo do supervisor:', grupoError);
        return null;
      }

      console.log('✅ Grupo encontrado:', grupoData.nome_grupo);

      // Buscar SDRs do grupo
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros_grupos_supervisores')
        .select(`
          usuario_id,
          usuario:profiles!usuario_id(
            id,
            name,
            nivel,
            user_type,
            ativo
          )
        `)
        .eq('grupo_id', grupoData.id);

      if (membrosError || !membrosData) {
        console.error('❌ Erro ao buscar membros do grupo:', membrosError);
        return null;
      }

      console.log(`✅ ${membrosData.length} membros encontrados no grupo`);

      // Filtrar apenas membros ativos (SDRs e Vendedores)
      const membrosAtivos = membrosData.filter(
        membro => membro.usuario?.ativo === true && 
        (membro.usuario?.user_type === 'sdr' || membro.usuario?.user_type === 'vendedor')
      );

      console.log(`✅ ${membrosAtivos.length} membros ativos`);

      if (membrosAtivos.length === 0) {
        console.warn('⚠️ Nenhum membro ativo encontrado no grupo');
        return {
          supervisorId,
          nome: supervisorData.name,
          grupoId: grupoData.id,
          nomeGrupo: grupoData.nome_grupo,
          ano,
          semana,
          totalSDRs: 0,
          mediaPercentualAtingimento: 0,
          variabelSemanal: 0,
          multiplicador: 0,
          valorComissao: 0,
          sdrsDetalhes: []
        };
      }

      // Calcular percentual de atingimento para cada membro
      const sdrsDetalhes: SDRResumo[] = [];
      let somaPercentuais = 0;

      for (const membro of membrosAtivos) {
        const membroId = membro.usuario_id;
        const membroNome = membro.usuario?.name || 'Membro';
        const membroNivel = membro.usuario?.nivel || 'junior';
        const membroTipo = membro.usuario?.user_type;

        console.log(`🔍 Processando: ${membroNome} (${membroTipo}) - Nível: ${membroNivel}`);

        // Buscar meta baseada no tipo e nível do membro
        const { data: nivelData } = await supabase
          .from('niveis_vendedores')
          .select('meta_semanal_inbound, meta_semanal_outbound, meta_semanal_vendedor')
          .eq('nivel', membroNivel)
          .eq('tipo_usuario', membroTipo === 'vendedor' ? 'vendedor' : 'sdr')
          .maybeSingle();

        let metaSemanal = 0;
        if (membroTipo === 'vendedor') {
          metaSemanal = nivelData?.meta_semanal_vendedor || 0;
        } else if (membroTipo === 'sdr') {
          // Para SDRs, usar meta_semanal_inbound (campo correto)
          metaSemanal = nivelData?.meta_semanal_inbound || 55;
        }

        console.log(`🎯 Meta semanal: ${metaSemanal}`);

        // Buscar atividades realizadas baseada no tipo
        let reunioesRealizadas = 0;
        
        if (membroTipo === 'sdr') {
          // Para SDRs: buscar por sdr_id
          const { data: agendamentos } = await supabase
            .from('agendamentos')
            .select('id, data_agendamento, resultado_reuniao')
            .eq('sdr_id', membroId)
            .gte('data_agendamento', inicioSemana.toISOString())
            .lte('data_agendamento', fimSemana.toISOString())
            .not('resultado_reuniao', 'is', null);
            
          reunioesRealizadas = agendamentos?.length || 0;
          console.log(`📅 SDR ${membroNome}: ${reunioesRealizadas} reuniões encontradas`);
          if (agendamentos && agendamentos.length > 0) {
            console.log('Primeiros agendamentos:', agendamentos.slice(0, 3));
          }
        } else if (membroTipo === 'vendedor') {
          // Para vendedores: somar pontuação das vendas matriculadas
          const { data: vendas } = await supabase
            .from('form_entries')
            .select('pontuacao_validada, data_aprovacao')
            .eq('vendedor_id', membroId)
            .eq('status', 'matriculado')
            .gte('data_aprovacao', inicioSemana.toISOString())
            .lte('data_aprovacao', fimSemana.toISOString());
            
          reunioesRealizadas = vendas?.reduce((total, venda) => 
            total + (venda.pontuacao_validada || 0), 0) || 0;
          console.log(`💰 Vendedor ${membroNome}: ${reunioesRealizadas} pontos de vendas`);
          if (vendas && vendas.length > 0) {
            console.log('Primeiras vendas:', vendas.slice(0, 3));
          }
        }

        const percentualAtingimento = metaSemanal > 0 ? (reunioesRealizadas / metaSemanal) * 100 : 0;

        console.log(`📊 ${membroTipo.toUpperCase()} ${membroNome}: ${reunioesRealizadas}/${metaSemanal} = ${percentualAtingimento.toFixed(1)}%`);

        sdrsDetalhes.push({
          id: membroId,
          nome: membroNome,
          percentualAtingimento: Math.round(percentualAtingimento * 100) / 100,
          reunioesRealizadas,
          metaSemanal
        });

        somaPercentuais += percentualAtingimento;
      }

      // Calcular média das porcentagens
      const mediaPercentualAtingimento = somaPercentuais / membrosAtivos.length;

      console.log(`🎯 Resultado final: ${sdrsDetalhes.length} membros processados, média: ${mediaPercentualAtingimento.toFixed(1)}%`);

      // Buscar variável semanal do supervisor
      const { data: nivelSupervisorData, error: nivelSupervisorError } = await supabase
        .from('niveis_vendedores')
        .select('variavel_semanal')
        .eq('nivel', supervisorData.nivel)
        .eq('tipo_usuario', 'supervisor')
        .maybeSingle();

      if (nivelSupervisorError || !nivelSupervisorData) {
        console.error('❌ Erro ao buscar dados do nível do supervisor:', nivelSupervisorError);
        return null;
      }

      const variabelSemanal = nivelSupervisorData.variavel_semanal;

      // Calcular comissão baseada na média percentual (usando 100 como meta base)
      const { multiplicador, valor } = await ComissionamentoService.calcularComissao(
        mediaPercentualAtingimento,
        100, // Meta base de 100%
        variabelSemanal,
        'supervisor'
      );

      return {
        supervisorId,
        nome: supervisorData.name,
        grupoId: grupoData.id,
        nomeGrupo: grupoData.nome_grupo,
        ano,
        semana,
        totalSDRs: membrosAtivos.length,
        mediaPercentualAtingimento: Math.round(mediaPercentualAtingimento * 100) / 100,
        variabelSemanal,
        multiplicador,
        valorComissao: valor,
        sdrsDetalhes
      };

    } catch (error) {
      console.error('❌ Erro ao calcular comissionamento do supervisor:', error);
      return null;
    }
  }

  private static calcularDatasSemanaDoMes(ano: number, mes: number, semana: number) {
    // Encontrar todas as terças-feiras do mês (fim das semanas)
    const firstDayOfMonth = new Date(ano, mes - 1, 1);
    const tuesdays = [];
    let currentDate = new Date(firstDayOfMonth);
    
    // Encontrar primeira terça-feira
    while (currentDate.getDay() !== 2) { // 2 = terça-feira
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Se a primeira terça-feira é muito tarde, verificar se há uma anterior que termine no mês
    if (currentDate.getDate() > 7) {
      const previousTuesday = new Date(currentDate);
      previousTuesday.setDate(currentDate.getDate() - 7);
      if (previousTuesday.getMonth() === mes - 1) {
        tuesdays.push(new Date(previousTuesday));
      }
    }
    
    // Adicionar todas as terças-feiras do mês
    while (currentDate.getMonth() === mes - 1) {
      tuesdays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    // Pegar a terça-feira da semana solicitada
    if (semana <= tuesdays.length) {
      const fimSemana = tuesdays[semana - 1];
      const inicioSemana = new Date(fimSemana);
      inicioSemana.setDate(fimSemana.getDate() - 6); // Voltar 6 dias para quarta-feira
      fimSemana.setHours(23, 59, 59, 999);
      
      return { inicioSemana, fimSemana };
    }
    
    // Fallback
    const now = new Date();
    return { inicioSemana: now, fimSemana: now };
  }

  private static calcularDatasSemana(ano: number, semana: number) {
    // Calcular datas da semana (quarta a terça)
    const dataInicioAno = new Date(ano, 0, 1);
    const primeiraTerca = new Date(dataInicioAno);
    
    // Encontrar a primeira terça-feira do ano
    while (primeiraTerca.getDay() !== 2) {
      primeiraTerca.setDate(primeiraTerca.getDate() + 1);
    }
    
    // Calcular início e fim da semana específica
    const inicioSemana = new Date(primeiraTerca);
    inicioSemana.setDate(primeiraTerca.getDate() + (semana - 1) * 7 - 6); // Quarta-feira
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6); // Terça-feira
    fimSemana.setHours(23, 59, 59, 999);

    return { inicioSemana, fimSemana };
  }

  private static getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const daysPassed = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((daysPassed + startOfYear.getDay()) / 7);
  }
}