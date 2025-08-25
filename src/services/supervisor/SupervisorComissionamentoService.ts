import { supabase } from '@/integrations/supabase/client';
import { ComissionamentoService } from '@/services/comissionamentoService';
import { getWeekRange } from '@/utils/semanaUtils';
import { getDataEfetivaVenda, isVendaInWeek } from '@/utils/vendaDateUtils';

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

      // Buscar SDRs do grupo (aplicar filtro de período apenas para novos membros)
      console.log('🔍 DEBUG: Buscando membros do grupo para período:', {
        grupoId: grupoData.id,
        inicioSemana: inicioSemana.toISOString(),
        fimSemana: fimSemana.toISOString()
      });

      const { data: membrosData, error: membrosError } = await supabase
        .from('membros_grupos_supervisores')
        .select(`
          usuario_id,
          created_at,
          left_at,
          usuario:profiles!usuario_id(
            id,
            name,
            nivel,
            user_type,
            ativo
          )
        `)
        .eq('grupo_id', grupoData.id);

      console.log('👥 DEBUG: Membros brutos encontrados:', membrosData?.length || 0);

      // Filtrar membros válidos para o período APÓS buscar os dados
      const membrosValidosParaPeriodo = membrosData?.filter(membro => {
        const criadoEm = new Date(membro.created_at);
        const saídaEm = membro.left_at ? new Date(membro.left_at) : null;
        
        // REGRA CORRETA: Membro deve ter sido criado ANTES DO INÍCIO do período
        // (não apenas antes do fim - isso permitia que membros novos aparecessem em períodos antigos)
        const criadoAntesDoPeriodo = criadoEm <= inicioSemana;
        
        // Se tem data de saída, deve ter saído DEPOIS do fim do período
        const naoSaiuDuranteOPeriodo = !saídaEm || saídaEm > fimSemana;
        
        const valido = criadoAntesDoPeriodo && naoSaiuDuranteOPeriodo;
        
        console.log(`📊 DEBUG: Membro ${membro.usuario?.name}:`, {
          criadoEm: criadoEm.toLocaleDateString('pt-BR'),
          saídaEm: saídaEm?.toLocaleDateString('pt-BR') || 'Ativo',
          criadoAntesDoPeriodo,
          naoSaiuDuranteOPeriodo,
          valido
        });
        
        return valido;
      }) || [];

      console.log('👥 DEBUG: Membros válidos para período:', membrosValidosParaPeriodo.length);
      console.log('📋 DEBUG: Detalhes dos membros válidos:', membrosValidosParaPeriodo.map(m => ({
        nome: m.usuario?.name,
        created_at: m.created_at,
        left_at: m.left_at,
        ativo: m.usuario?.ativo
      })));

      // Usar membros filtrados em vez do resultado direto da query
      const membrosDataFiltrados = membrosValidosParaPeriodo;

      if (membrosError || !membrosDataFiltrados) {
        console.error('❌ Erro ao buscar membros do grupo:', membrosError);
        console.log('🔍 Grupo ID para busca de membros:', grupoData.id);
        return null;
      }
      
      console.log('✅ Membros filtrados encontrados:', membrosDataFiltrados.length, 'membros');

      // Filtrar apenas membros ativos (SDRs e Vendedores) - incluindo todos os tipos de SDR
      const membrosAtivos = membrosDataFiltrados.filter(
        membro => membro.usuario?.ativo === true && 
        (membro.usuario?.user_type === 'sdr' || 
         membro.usuario?.user_type === 'sdr_inbound' || 
         membro.usuario?.user_type === 'sdr_outbound' || 
         membro.usuario?.user_type === 'vendedor')
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
        } else if (membroTipo === 'sdr_inbound') {
          metaSemanal = nivelData?.meta_semanal_inbound || 55;
        } else if (membroTipo === 'sdr_outbound') {
          metaSemanal = nivelData?.meta_semanal_outbound || 55;
        } else if (membroTipo === 'sdr') {
          // Para SDRs genéricos, usar meta_semanal_inbound como padrão
          metaSemanal = nivelData?.meta_semanal_inbound || 55;
        }

        console.log(`🎯 Meta semanal para ${membroNome}: ${metaSemanal}`);
        
        // Buscar atividades realizadas baseada no tipo
        let reunioesRealizadas = 0;
        
        if (membroTipo === 'sdr' || membroTipo === 'sdr_inbound' || membroTipo === 'sdr_outbound') {
          // Para SDRs: buscar agendamentos igual à planilha detalhada
          const { data: agendamentos, error: agendamentosError } = await supabase
            .from('agendamentos')
            .select('id, data_agendamento, resultado_reuniao, status')
            .eq('sdr_id', membroId)
            .gte('data_agendamento', inicioSemana.toISOString())
            .lte('data_agendamento', fimSemana.toISOString());
            
          // Contar TODOS os agendamentos, não apenas com resultado específico
          reunioesRealizadas = agendamentos?.length || 0;
           
           if (agendamentosError) console.log('❌ Erro agendamentos SDR:', agendamentosError);
        } else if (membroTipo === 'vendedor') {
          // Para vendedores: usar data efetiva das vendas (mesmo que planilha detalhada)
          const { data: vendas, error: vendasError } = await supabase
            .from('form_entries')
            .select(`
              id,
              pontuacao_validada,
              enviado_em,
              data_assinatura_contrato,
              data_aprovacao
            `)
            .eq('vendedor_id', membroId)
            .eq('status', 'matriculado');

          if (vendasError) {
            console.log('❌ Erro vendas:', vendasError);
            reunioesRealizadas = 0;
          } else {
            // Buscar respostas do formulário para calcular data efetiva
            const { data: respostasFormulario } = await supabase
              .from('respostas_formulario')
              .select('form_entry_id, campo_nome, valor_informado')
              .in('form_entry_id', vendas?.map(v => v.id) || []);

            // Filtrar vendas que estão na semana usando data efetiva
            const vendasNaSemana = vendas?.filter(venda => 
              isVendaInWeek(venda, inicioSemana, fimSemana, respostasFormulario)
            ) || [];

            reunioesRealizadas = vendasNaSemana.reduce((total, venda) => 
              total + (venda.pontuacao_validada || 0), 0);
            
            console.log(`💰 Vendedor ${membroNome}: ${reunioesRealizadas} pontos (${vendasNaSemana.length} vendas na semana usando data efetiva)`);
            if (vendasNaSemana.length > 0) {
              console.log('Vendas na semana:', vendasNaSemana.map(v => ({
                id: v.id.substring(0, 8),
                pontos: v.pontuacao_validada,
                data_efetiva: getDataEfetivaVenda(v, respostasFormulario).toLocaleDateString('pt-BR')
              })));
            }
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
      console.log('🚀🚀🚀 INICIANDO CÁLCULO SUPERVISOR COMISSIONAMENTO 🚀🚀🚀');
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

      // Buscar TODOS os membros do grupo sem filtro de data
      console.log('🔍 DEBUG: Buscando TODOS os membros do grupo (sem filtro SQL):', {
        grupoId: grupoData.id,
        inicioSemana: inicioSemana.toISOString(),
        fimSemana: fimSemana.toISOString(),
        ano, mes, semana
      });

      const { data: membrosData, error: membrosError } = await supabase
        .from('membros_grupos_supervisores')
        .select(`
          usuario_id,
          created_at,
          left_at,
          usuario:profiles!usuario_id(
            id,
            name,
            nivel,
            user_type,
            ativo
          )
        `)
        .eq('grupo_id', grupoData.id);

      console.log('👥 DEBUG: Membros brutos encontrados (TODOS):', membrosData?.length || 0);
      console.log('📋 DEBUG: Lista completa dos membros:', membrosData?.map(m => ({
        nome: m.usuario?.name,
        created_at: m.created_at,
        left_at: m.left_at,
        ativo: m.usuario?.ativo
      })));

      if (membrosError || !membrosData) {
        console.error('❌ Erro ao buscar membros do grupo:', membrosError);
        return null;
      }

      // AGORA aplicar o filtro em JavaScript para o período específico
      const membrosValidosParaPeriodo = membrosData.filter(membro => {
        const criadoEm = new Date(membro.created_at);
        const saídaEm = membro.left_at ? new Date(membro.left_at) : null;
        
        console.log(`🔍 Verificando membro ${membro.usuario?.name}:`, {
          criadoEm: criadoEm.toLocaleDateString('pt-BR'),
          saídaEm: saídaEm?.toLocaleDateString('pt-BR') || 'ainda ativo',
          inicioSemana: inicioSemana.toLocaleDateString('pt-BR'),
          fimSemana: fimSemana.toLocaleDateString('pt-BR')
        });
        
        // Estava ativo durante o período se:
        // 1. Foi criado ANTES ou DURANTE o período (criado <= fim da semana)
        // 2. E não saiu OU saiu APÓS o início do período (left_at === null || left_at >= início da semana)
        const foiCriadoAntesOuDurante = criadoEm <= fimSemana;
        const naoSaiuOuSaiuDepois = !saídaEm || saídaEm >= inicioSemana;
        
        const estaValidoParaPeriodo = foiCriadoAntesOuDurante && naoSaiuOuSaiuDepois;
        
        console.log(`   Resultado: ${estaValidoParaPeriodo ? '✅ VÁLIDO' : '❌ INVÁLIDO'} - criado antes/durante: ${foiCriadoAntesOuDurante}, não saiu ou saiu depois: ${naoSaiuOuSaiuDepois}`);
        
        return estaValidoParaPeriodo;
      });
      
      console.log(`🚨 PERÍODO CALCULADO: ${inicioSemana.toLocaleDateString('pt-BR')} até ${fimSemana.toLocaleDateString('pt-BR')}`);
      console.log('👥 Membros válidos após filtro:', membrosValidosParaPeriodo.length);

      if (membrosValidosParaPeriodo.length === 0) {
        console.warn('⚠️ Nenhum membro válido encontrado para o período');
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

      // Filtrar apenas membros ativos (SDRs e Vendedores) - incluindo todos os tipos de SDR
      const membrosAtivos = membrosValidosParaPeriodo.filter(
        membro => membro.usuario?.ativo === true && 
        (membro.usuario?.user_type === 'sdr' || 
         membro.usuario?.user_type === 'sdr_inbound' || 
         membro.usuario?.user_type === 'sdr_outbound' || 
         membro.usuario?.user_type === 'vendedor')
      );

      console.log(`✅ ${membrosAtivos.length} membros ativos válidos para o período`);

      if (membrosAtivos.length === 0) {
        console.warn('⚠️ Nenhum membro ativo encontrado no grupo para o período');
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
        } else if (membroTipo === 'sdr_inbound') {
          metaSemanal = nivelData?.meta_semanal_inbound || 55;
        } else if (membroTipo === 'sdr_outbound') {
          metaSemanal = nivelData?.meta_semanal_outbound || 55;
        } else if (membroTipo === 'sdr') {
          // Para SDRs genéricos, usar meta_semanal_inbound como padrão
          metaSemanal = nivelData?.meta_semanal_inbound || 55;
        }

        console.log(`🎯 Meta semanal: ${metaSemanal}`);

        // Buscar atividades realizadas baseada no tipo
        let reunioesRealizadas = 0;
        
        if (membroTipo === 'sdr' || membroTipo === 'sdr_inbound' || membroTipo === 'sdr_outbound') {
          // Para SDRs: buscar agendamentos com resultados específicos (mesmo que planilha detalhada)
          console.log(`🔍 SDR ${membroNome} - Buscando agendamentos entre:`, {
            inicio: inicioSemana.toISOString(),
            fim: fimSemana.toISOString(),
            sdr_id: membroId
          });
          
          const { data: agendamentos } = await supabase
            .from('agendamentos')
            .select('id, data_agendamento, resultado_reuniao, status')
            .eq('sdr_id', membroId)
            .gte('data_agendamento', inicioSemana.toISOString())
            .lte('data_agendamento', fimSemana.toISOString());
            
          // Contar TODOS os agendamentos, não apenas com resultado específico
          reunioesRealizadas = agendamentos?.length || 0;
        } else if (membroTipo === 'vendedor') {
          // Para vendedores: usar data efetiva das vendas (mesmo que planilha detalhada)
          const { data: vendas } = await supabase
            .from('form_entries')
            .select(`
              id,
              pontuacao_validada,
              enviado_em,
              data_assinatura_contrato,
              data_aprovacao
            `)
            .eq('vendedor_id', membroId)
            .eq('status', 'matriculado');

          if (vendas) {
            // Buscar respostas do formulário para calcular data efetiva
            const { data: respostasFormulario } = await supabase
              .from('respostas_formulario')
              .select('form_entry_id, campo_nome, valor_informado')
              .in('form_entry_id', vendas.map(v => v.id));

            // Filtrar vendas que estão na semana usando data efetiva
            const vendasNaSemana = vendas.filter(venda => 
              isVendaInWeek(venda, inicioSemana, fimSemana, respostasFormulario)
            );

            reunioesRealizadas = vendasNaSemana.reduce((total, venda) => 
              total + (venda.pontuacao_validada || 0), 0);
            
            console.log(`💰 Vendedor ${membroNome}: ${reunioesRealizadas} pontos (${vendasNaSemana.length} vendas na semana usando data efetiva)`);
            if (vendasNaSemana.length > 0) {
              console.log('Vendas na semana:', vendasNaSemana.map(v => ({
                id: v.id.substring(0, 8),
                pontos: v.pontuacao_validada,
                data_efetiva: getDataEfetivaVenda(v, respostasFormulario).toLocaleDateString('pt-BR')
              })));
            }
          } else {
            reunioesRealizadas = 0;
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
    console.log(`🗓️ [DEBUG] Calculando datas para semana ${semana} de ${mes}/${ano}`);
    
    // Usar a mesma lógica do semanaUtils.ts para garantir consistência
    
    // Primeiro, encontrar o primeiro dia do mês
    const primeiroDiaMes = new Date(ano, mes - 1, 1);
    console.log(`📅 Primeiro dia do mês: ${primeiroDiaMes.toLocaleDateString('pt-BR')}`);
    
    // Encontrar a primeira quarta-feira do mês ou anterior que inicia uma semana no mês
    let primeiraQuarta = new Date(primeiroDiaMes);
    
    // Se o primeiro dia não é quarta (3), encontrar a primeira quarta
    if (primeiraQuarta.getDay() !== 3) {
      const diasAteQuarta = (3 - primeiraQuarta.getDay() + 7) % 7;
      if (diasAteQuarta === 0) {
        // Já é quarta
      } else if (primeiraQuarta.getDay() > 3) {
        // Se passou da quarta (quinta, sexta, sábado), ir para próxima quarta
        primeiraQuarta.setDate(primeiraQuarta.getDate() + diasAteQuarta);
      } else {
        // Se ainda não chegou na quarta (domingo, segunda, terça), ir para esta quarta
        primeiraQuarta.setDate(primeiraQuarta.getDate() + diasAteQuarta);
      }
    }
    
    // Se a primeira quarta é muito tarde no mês (após dia 7), 
    // pode haver uma semana anterior que termina no mês
    if (primeiraQuarta.getDate() > 7) {
      primeiraQuarta.setDate(primeiraQuarta.getDate() - 7);
    }
    
    console.log(`📅 Primeira quarta-feira base: ${primeiraQuarta.toLocaleDateString('pt-BR')}`);
    
    // Calcular a quarta-feira da semana solicitada
    const quartaDaSemana = new Date(primeiraQuarta);
    quartaDaSemana.setDate(primeiraQuarta.getDate() + (semana - 1) * 7);
    
    // Início da semana é a quarta-feira
    const inicioSemana = new Date(quartaDaSemana);
    inicioSemana.setHours(0, 0, 0, 0);
    
    // Fim da semana é terça-feira (6 dias depois)
    const fimSemana = new Date(quartaDaSemana);
    fimSemana.setDate(quartaDaSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);
    
    console.log(`📅 [RESULTADO] Semana ${semana}: ${inicioSemana.toLocaleDateString('pt-BR')} até ${fimSemana.toLocaleDateString('pt-BR')}`);
    console.log(`📅 [RESULTADO] ISO: ${inicioSemana.toISOString()} até ${fimSemana.toISOString()}`);
    
    return { inicioSemana, fimSemana };
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
