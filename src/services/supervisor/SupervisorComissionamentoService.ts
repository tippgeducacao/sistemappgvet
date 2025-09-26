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
  userType: string;
  nivel: string;
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

      // Para detectar membros "fora do grupo", vamos criar uma versão mais robusta
      // que considera membros que podem ter estado em outras semanas mas não nesta
      
      // Primeiro, vamos buscar TODOS os membros que ALGUMA VEZ estiveram no grupo durante o mês
      const { data: todosMembrosDoMes } = await supabase
        .from('membros_grupos_supervisores')
        .select(`
          usuario_id,
          created_at,
          left_at,
          usuario:profiles!inner(id, name, user_type, nivel, ativo)
        `)
        .eq('grupo_id', grupoData.id);

      console.log('👥 DEBUG: Todos os membros do mês encontrados:', todosMembrosDoMes?.length || 0);
      
      // Agora filtrar apenas os membros que estavam ATIVOS durante esta semana específica
      const membrosValidosParaPeriodo = todosMembrosDoMes?.filter(membro => {
        const criadoEm = new Date(membro.created_at);
        const saídaEm = membro.left_at ? new Date(membro.left_at) : null;
        
        // Membro estava ativo se foi criado ANTES OU DURANTE a semana
        const foiCriadoAteOFimDaSemana = criadoEm <= fimSemana;
        
        // E não saiu ANTES da semana terminar
        const naoSaiuAntesDaSemana = !saídaEm || saídaEm > inicioSemana;
        
        const valido = foiCriadoAteOFimDaSemana && naoSaiuAntesDaSemana;
        
        console.log(`📊 DEBUG: Membro ${membro.usuario?.name}:`, {
          criadoEm: criadoEm.toLocaleDateString('pt-BR'),
          saídaEm: saídaEm?.toLocaleDateString('pt-BR') || 'Ativo',
          foiCriadoAteOFimDaSemana,
          naoSaiuAntesDaSemana,
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
        
        // Definir metas padrão baseadas no nível e tipo
        let metaPadrao = 0;
        if (membroTipo === 'vendedor') {
          metaPadrao = membroNivel === 'junior' ? 7 : membroNivel === 'pleno' ? 8 : membroNivel === 'senior' ? 10 : 7;
        } else {
          // Para SDRs (todos os tipos)
          metaPadrao = membroNivel === 'junior' ? 55 : membroNivel === 'pleno' ? 70 : membroNivel === 'senior' ? 85 : 55;
        }
        
        if (membroTipo === 'vendedor') {
          metaSemanal = nivelData?.meta_semanal_vendedor || metaPadrao;
        } else if (membroTipo === 'sdr_inbound') {
          metaSemanal = nivelData?.meta_semanal_inbound || metaPadrao;
        } else if (membroTipo === 'sdr_outbound') {
          metaSemanal = nivelData?.meta_semanal_outbound || metaPadrao;
        } else if (membroTipo === 'sdr') {
          // Para SDRs genéricos, usar meta_semanal_inbound como padrão
          metaSemanal = nivelData?.meta_semanal_inbound || metaPadrao;
        } else {
          // Fallback para tipos desconhecidos
          metaSemanal = metaPadrao;
        }

        console.log(`🎯 Meta semanal calculada para ${membroNome} (${membroTipo}, ${membroNivel}): ${metaSemanal} (meta do BD: ${nivelData ? 'encontrada' : 'não encontrada'})`);
        
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
          metaSemanal,
          userType: membroTipo,
          nivel: membroNivel
        });

        somaPercentuais += percentualAtingimento;
      }

      // Calcular média das porcentagens (Meta Coletiva)
      const mediaPercentualAtingimento = somaPercentuais / membrosAtivos.length;

      console.log(`🎯 Meta Coletiva: ${mediaPercentualAtingimento.toFixed(1)}% (média de ${membrosAtivos.length} membros)`);

      // Verificar regra dos 50%: se algum membro está abaixo de 50%, comissão deve ser 0
      const temMembroAbaixoDe50 = sdrsDetalhes.some(sdr => sdr.percentualAtingimento < 50);
      const percentualParaComissao = temMembroAbaixoDe50 ? 0 : mediaPercentualAtingimento;
      
      console.log(`🔍 Verificação regra 50%: ${temMembroAbaixoDe50 ? 'TEM' : 'NÃO TEM'} membro abaixo de 50%`);
      console.log(`💰 Percentual para comissão: ${percentualParaComissao.toFixed(1)}% (real: ${mediaPercentualAtingimento.toFixed(1)}%)`);

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

      // Calcular comissão usando percentual ajustado pela regra dos 50%
      const { multiplicador, valor } = await ComissionamentoService.calcularComissao(
        percentualParaComissao, // Usar percentual ajustado (0% se algum membro < 50%)
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
      console.log(`🚀🚀🚀 INICIANDO CÁLCULO SUPERVISOR COMISSIONAMENTO SEMANA ${semana} 🚀🚀🚀`);
      console.log(`🔍 CALCULANDO COMISSIONAMENTO: Supervisor ${supervisorId}, Ano ${ano}, Mês ${mes}, Semana ${semana}`);
      
      // LOGS ESPECIAIS PARA SEMANA 1
      if (semana === 1) {
        console.log(`🔥 SEMANA 1 DETECTADA - LOGS ESPECIAIS ATIVADOS 🔥`);
        console.log(`📊 Parâmetros recebidos:`, { supervisorId, ano, mes, semana });
      }
      
      // IMPORTANTE: Usar o mês passado como parâmetro para o cálculo das semanas
      const { inicioSemana, fimSemana } = this.calcularDatasSemanaDoMes(ano, mes, semana);
      
      console.log(`📅 SEMANA ${semana} - Período calculado: ${inicioSemana.toLocaleDateString('pt-BR')} a ${fimSemana.toLocaleDateString('pt-BR')}`);

      // LOGS ESPECIAIS PARA SEMANA 1 - DATAS
      if (semana === 1) {
        console.log(`🔥 SEMANA 1 - DATAS DETALHADAS:`, {
          inicioSemana: {
            iso: inicioSemana.toISOString(),
            local: inicioSemana.toLocaleDateString('pt-BR'),
            dia_semana: inicioSemana.getDay() // 0=domingo, 3=quarta
          },
          fimSemana: {
            iso: fimSemana.toISOString(),
            local: fimSemana.toLocaleDateString('pt-BR'),
            dia_semana: fimSemana.getDay() // 2=terça
          }
        });
      }

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
        if (semana === 1) console.log(`🔥 SEMANA 1 - ERRO NO SUPERVISOR`);
        return null;
      }

      console.log('✅ Supervisor encontrado:', supervisorData.name);
      if (semana === 1) console.log(`🔥 SEMANA 1 - SUPERVISOR OK:`, supervisorData);

      // Buscar grupo do supervisor
      const { data: grupoData, error: grupoError } = await supabase
        .from('grupos_supervisores')
        .select('id, nome_grupo')
        .eq('supervisor_id', supervisorId)
        .maybeSingle();

      if (grupoError || !grupoData) {
        console.error('❌ Erro ao buscar grupo do supervisor:', grupoError);
        if (semana === 1) console.log(`🔥 SEMANA 1 - ERRO NO GRUPO`);
        return null;
      }

      console.log('✅ Grupo encontrado:', grupoData.nome_grupo);
      if (semana === 1) console.log(`🔥 SEMANA 1 - GRUPO OK:`, grupoData);

      // Buscar TODOS os membros do grupo sem filtro de data
      console.log('🔍 DEBUG: Buscando TODOS os membros do grupo (sem filtro SQL):', {
        grupoId: grupoData.id,
        inicioSemana: inicioSemana.toISOString(),
        fimSemana: fimSemana.toISOString(),
        ano, mes, semana
      });

      // LOGS ESPECIAIS PARA SEMANA 1 - BUSCA DE MEMBROS
      if (semana === 1) {
        console.log(`🔥 SEMANA 1 - INICIANDO BUSCA DE MEMBROS DO GRUPO ${grupoData.id}`);
      }

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

      // LOGS ESPECIAIS PARA SEMANA 1 - MEMBROS BRUTOS
      if (semana === 1) {
        console.log(`🔥 SEMANA 1 - MEMBROS BRUTOS ENCONTRADOS: ${membrosData?.length || 0}`);
        console.log(`🔥 SEMANA 1 - DETALHES COMPLETOS DOS MEMBROS:`, membrosData?.map(m => ({
          usuario_id: m.usuario_id,
          nome: m.usuario?.name,
          tipo: m.usuario?.user_type,
          ativo: m.usuario?.ativo,
          created_at: m.created_at,
          left_at: m.left_at
        })));
      }

      if (membrosError || !membrosData) {
        console.error('❌ Erro ao buscar membros do grupo:', membrosError);
        if (semana === 1) console.log(`🔥 SEMANA 1 - ERRO AO BUSCAR MEMBROS:`, membrosError);
        return null;
      }

      // FILTRO CORRETO: Membro estava ativo na semana se:
      // 1. Foi criado ANTES OU DURANTE a semana (created_at <= fim da semana)
      // 2. E não saiu DURANTE a semana (left_at é null OU left_at > início da semana)
      
      // LOGS ESPECIAIS PARA SEMANA 1 - INÍCIO DA FILTRAGEM
      if (semana === 1) {
        console.log(`🔥 SEMANA 1 - INICIANDO FILTRAGEM DOS MEMBROS VÁLIDOS PARA O PERÍODO`);
        console.log(`🔥 SEMANA 1 - CRITÉRIOS DE FILTRAGEM:`, {
          criterio1: 'Foi criado ANTES OU DURANTE a semana (created_at <= fim da semana)',
          criterio2: 'E não saiu DURANTE a semana (left_at é null OU left_at > início da semana)',
          inicioSemana: inicioSemana.toISOString(),
          fimSemana: fimSemana.toISOString()
        });
      }
      
      const membrosValidosParaPeriodo = membrosData.filter(membro => {
        const criadoEm = new Date(membro.created_at);
        const saídaEm = membro.left_at ? new Date(membro.left_at) : null;
        
        const foiCriadoAteOFimDaSemana = criadoEm <= fimSemana;
        const naoSaiuAntesDaSemana = !saídaEm || saídaEm > inicioSemana;
        
        const estaValido = foiCriadoAteOFimDaSemana && naoSaiuAntesDaSemana;
        
        console.log(`🔍 SEMANA ${semana} FILTRO - ${membro.usuario?.name}:`, {
          criado: criadoEm.toLocaleDateString('pt-BR'),
          saiu: saídaEm?.toLocaleDateString('pt-BR') || 'nunca',
          inicioSemana: inicioSemana.toLocaleDateString('pt-BR'),
          fimSemana: fimSemana.toLocaleDateString('pt-BR'),
          criadoAteOFim: foiCriadoAteOFimDaSemana,
          naoSaiuAntes: naoSaiuAntesDaSemana,
          resultado: estaValido ? '✅ INCLUIR' : '❌ EXCLUIR'
        });
        
        // LOGS ESPECIAIS PARA SEMANA 1 - FILTRAGEM INDIVIDUAL
        if (semana === 1) {
          console.log(`🔥 SEMANA 1 - FILTRO DETALHADO ${membro.usuario?.name}:`, {
            created_at_original: membro.created_at,
            criadoEm_objeto: criadoEm,
            criadoEm_iso: criadoEm.toISOString(),
            criadoEm_local: criadoEm.toLocaleDateString('pt-BR'),
            fimSemana_iso: fimSemana.toISOString(),
            fimSemana_local: fimSemana.toLocaleDateString('pt-BR'),
            comparacao_criado_vs_fim: `${criadoEm.toISOString()} <= ${fimSemana.toISOString()} = ${foiCriadoAteOFimDaSemana}`,
            left_at_original: membro.left_at,
            saídaEm_objeto: saídaEm,
            saídaEm_iso: saídaEm?.toISOString() || 'null',
            inicioSemana_iso: inicioSemana.toISOString(),
            comparacao_saida_vs_inicio: saídaEm ? `${saídaEm.toISOString()} > ${inicioSemana.toISOString()} = ${saídaEm > inicioSemana}` : 'sem data de saída',
            naoSaiuAntesDaSemana,
            resultado_final: estaValido ? '✅ VÁLIDO' : '❌ INVÁLIDO'
          });
        }
        
        return estaValido;
      });
      
      console.log(`🚨 SEMANA ${semana} - PERÍODO CALCULADO: ${inicioSemana.toLocaleDateString('pt-BR')} até ${fimSemana.toLocaleDateString('pt-BR')}`);
      console.log(`👥 SEMANA ${semana} - Membros válidos após filtro:`, membrosValidosParaPeriodo.length);
      
      // LOGS ESPECIAIS PARA SEMANA 1 - RESULTADO DA FILTRAGEM
      if (semana === 1) {
        console.log(`🔥 SEMANA 1 - RESULTADO DA FILTRAGEM:`, {
          total_membros_brutos: membrosData.length,
          membros_validos_periodo: membrosValidosParaPeriodo.length,
          nomes_membros_validos: membrosValidosParaPeriodo.map(m => m.usuario?.name)
        });
        
        if (membrosValidosParaPeriodo.length === 0) {
          console.log(`🔥 SEMANA 1 - ⚠️⚠️⚠️ NENHUM MEMBRO VÁLIDO ENCONTRADO! ⚠️⚠️⚠️`);
          console.log(`🔥 SEMANA 1 - INVESTIGAÇÃO DOS MOTIVOS:`);
          membrosData.forEach(membro => {
            const criadoEm = new Date(membro.created_at);
            const saídaEm = membro.left_at ? new Date(membro.left_at) : null;
            const foiCriadoAteOFimDaSemana = criadoEm <= fimSemana;
            const naoSaiuAntesDaSemana = !saídaEm || saídaEm > inicioSemana;
            
            console.log(`🔥 ANÁLISE ${membro.usuario?.name}:`, {
              motivo_exclusao: !foiCriadoAteOFimDaSemana ? 'Criado APÓS fim da semana' : !naoSaiuAntesDaSemana ? 'Saiu ANTES do início da semana' : 'Outro motivo',
              created_at: membro.created_at,
              left_at: membro.left_at || 'nunca saiu',
              periodo_semana: `${inicioSemana.toISOString()} a ${fimSemana.toISOString()}`
            });
          });
        }
      }

      if (membrosValidosParaPeriodo.length === 0) {
        console.log(`⚠️ SEMANA ${semana}: Nenhum membro válido encontrado para o período`);
        console.log(`❌ SEMANA ${semana}: Retornando null - supervisor não tinha equipe ativa nesta semana`);
        
        // LOGS ESPECIAIS PARA SEMANA 1 - RETORNO NULL POR FALTA DE MEMBROS
        if (semana === 1) {
          console.log(`🔥 SEMANA 1 - ❌❌❌ RETORNANDO NULL - NENHUM MEMBRO VÁLIDO! ❌❌❌`);
          console.log(`🔥 SEMANA 1 - CAUSA: membrosValidosParaPeriodo.length === 0`);
          console.log(`🔥 SEMANA 1 - ISSO SIGNIFICA QUE TODOS OS MEMBROS FORAM EXCLUÍDOS NO FILTRO DE PERÍODO`);
        }
        
        return null;
      }

      // Filtrar apenas membros ativos (SDRs e Vendedores) - incluindo todos os tipos de SDR
      const membrosAtivos = membrosValidosParaPeriodo.filter(
        membro => membro.usuario?.ativo === true && 
        (membro.usuario?.user_type === 'sdr' || 
         membro.usuario?.user_type === 'sdr_inbound' || 
         membro.usuario?.user_type === 'sdr_outbound' || 
         membro.usuario?.user_type === 'vendedor')
      );

      console.log(`✅ SEMANA ${semana} - ${membrosAtivos.length} membros ativos válidos para o período`);
      
      // Se após todos os filtros não há membros ativos, retornar null
      if (membrosAtivos.length === 0) {
        console.warn(`⚠️ SEMANA ${semana} - Após filtros, nenhum membro ativo encontrado`);
        console.log(`❌ SEMANA ${semana}: Retornando null - supervisor não tinha membros ativos nesta semana`);
        
        // LOGS ESPECIAIS PARA SEMANA 1 - SEGUNDO RETORNO NULL
        if (semana === 1) {
          console.log(`🔥 SEMANA 1 - ❌❌❌ RETORNANDO NULL - NENHUM MEMBRO ATIVO! ❌❌❌`);
          console.log(`🔥 SEMANA 1 - CAUSA: membrosAtivos.length === 0 após filtro de ativo/tipo`);
          console.log(`🔥 SEMANA 1 - MEMBROS VÁLIDOS ANTES DO FILTRO:`, membrosValidosParaPeriodo.map(m => ({
            nome: m.usuario?.name,
            ativo: m.usuario?.ativo,
            tipo: m.usuario?.user_type
          })));
        }
        
        return null;
      }

      if (membrosAtivos.length === 0) {
        console.warn('⚠️ Nenhum membro ativo encontrado no grupo para o período');
        
        // Mesmo com membros válidos mas inativos, vamos buscar todos os membros atuais ativos
        // para mostrar suas metas (0/55, 0/7, etc.)
        const { data: todosMembrosDados } = await supabase
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
          .eq('grupo_id', grupoData.id)
          .is('left_at', null); // Apenas membros que não saíram
          
        const membrosAtuaisAtivos = todosMembrosDados?.filter(
          membro => membro.usuario?.ativo === true && 
          (membro.usuario?.user_type === 'sdr' || 
           membro.usuario?.user_type === 'sdr_inbound' || 
           membro.usuario?.user_type === 'sdr_outbound' || 
           membro.usuario?.user_type === 'vendedor')
        ) || [];
        
        console.log(`📊 Encontrados ${membrosAtuaisAtivos.length} membros atuais ativos para mostrar metas`);
        
        // Criar SDRDetalhes com metas zeradas para todos os membros atuais ativos
        const sdrsDetalhesZerados: SDRResumo[] = [];
        
        for (const membro of membrosAtuaisAtivos) {
          const membroId = membro.usuario_id;
          const membroNome = membro.usuario?.name || 'Membro';
          const membroNivel = membro.usuario?.nivel || 'junior';
          const membroTipo = membro.usuario?.user_type;
          
          // Buscar meta baseada no tipo e nível do membro
          const { data: nivelData } = await supabase
            .from('niveis_vendedores')
            .select('meta_semanal_inbound, meta_semanal_outbound, meta_semanal_vendedor')
            .eq('nivel', membroNivel)
            .eq('tipo_usuario', membroTipo === 'vendedor' ? 'vendedor' : 'sdr')
            .maybeSingle();
          
          // Definir metas padrão baseadas no nível e tipo
          let metaPadrao = 0;
          if (membroTipo === 'vendedor') {
            metaPadrao = membroNivel === 'junior' ? 7 : membroNivel === 'pleno' ? 8 : membroNivel === 'senior' ? 10 : 7;
          } else {
            // Para SDRs (todos os tipos)
            metaPadrao = membroNivel === 'junior' ? 55 : membroNivel === 'pleno' ? 70 : membroNivel === 'senior' ? 85 : 55;
          }
          
          let metaSemanal = 0;
          if (membroTipo === 'vendedor') {
            metaSemanal = nivelData?.meta_semanal_vendedor || metaPadrao;
          } else if (membroTipo === 'sdr_inbound') {
            metaSemanal = nivelData?.meta_semanal_inbound || metaPadrao;
          } else if (membroTipo === 'sdr_outbound') {
            metaSemanal = nivelData?.meta_semanal_outbound || metaPadrao;
          } else if (membroTipo === 'sdr') {
            metaSemanal = nivelData?.meta_semanal_inbound || metaPadrao;
          } else {
            metaSemanal = metaPadrao;
          }
          
          console.log(`📊 Meta zerada para ${membroNome} (${membroTipo}, ${membroNivel}): 0/${metaSemanal}`);
          
          sdrsDetalhesZerados.push({
            id: membroId,
            nome: membroNome,
            percentualAtingimento: 0,
            reunioesRealizadas: 0,
            metaSemanal,
            userType: membroTipo,
            nivel: membroNivel
          });
        }
        
        return {
          supervisorId,
          nome: supervisorData.name,
          grupoId: grupoData.id,
          nomeGrupo: grupoData.nome_grupo,
          ano,
          semana,
          totalSDRs: sdrsDetalhesZerados.length,
          mediaPercentualAtingimento: 0,
          variabelSemanal: 0,
          multiplicador: 0,
          valorComissao: 0,
          sdrsDetalhes: sdrsDetalhesZerados
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
        
        // Definir metas padrão baseadas no nível e tipo
        let metaPadrao = 0;
        if (membroTipo === 'vendedor') {
          metaPadrao = membroNivel === 'junior' ? 7 : membroNivel === 'pleno' ? 8 : membroNivel === 'senior' ? 10 : 7;
        } else {
          // Para SDRs (todos os tipos)
          metaPadrao = membroNivel === 'junior' ? 55 : membroNivel === 'pleno' ? 70 : membroNivel === 'senior' ? 85 : 55;
        }
        
        if (membroTipo === 'vendedor') {
          metaSemanal = nivelData?.meta_semanal_vendedor || metaPadrao;
        } else if (membroTipo === 'sdr_inbound') {
          metaSemanal = nivelData?.meta_semanal_inbound || metaPadrao;
        } else if (membroTipo === 'sdr_outbound') {
          metaSemanal = nivelData?.meta_semanal_outbound || metaPadrao;
        } else if (membroTipo === 'sdr') {
          // Para SDRs genéricos, usar meta_semanal_inbound como padrão
          metaSemanal = nivelData?.meta_semanal_inbound || metaPadrao;
        } else {
          // Fallback para tipos desconhecidos
          metaSemanal = metaPadrao;
        }

        console.log(`🎯 Meta semanal calculada para ${membroNome} (${membroTipo}, ${membroNivel}): ${metaSemanal} (meta do BD: ${nivelData ? 'encontrada' : 'não encontrada'})`);

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
            .lte('data_agendamento', fimSemana.toISOString())
            .not('resultado_reuniao', 'is', null)
            .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou'])
            .lt('data_agendamento', new Date().toISOString()); // Apenas reuniões que já aconteceram
            
          // Contar apenas agendamentos com resultado positivo (alinhado com planilha admin)
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
          metaSemanal,
          userType: membroTipo,
          nivel: membroNivel
        });

        somaPercentuais += percentualAtingimento;
      }

      // Calcular média das porcentagens (evitar divisão por zero)
      const mediaPercentualAtingimento = membrosAtivos.length > 0 ? somaPercentuais / membrosAtivos.length : 0;

      console.log(`🎯 SEMANA ${semana} - Resultado final: ${sdrsDetalhes.length} membros processados, média: ${mediaPercentualAtingimento.toFixed(1)}%`);

      // Verificar regra dos 50%: se algum membro está abaixo de 50%, comissão deve ser 0
      const temMembroAbaixoDe50 = sdrsDetalhes.some(sdr => sdr.percentualAtingimento < 50);
      const percentualParaComissao = temMembroAbaixoDe50 ? 0 : mediaPercentualAtingimento;
      
      console.log(`🔍 SEMANA ${semana} - Verificação regra 50%: ${temMembroAbaixoDe50 ? 'TEM' : 'NÃO TEM'} membro abaixo de 50%`);
      console.log(`💰 SEMANA ${semana} - Percentual para comissão: ${percentualParaComissao.toFixed(1)}% (real: ${mediaPercentualAtingimento.toFixed(1)}%)`);

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

      // Calcular comissão usando percentual ajustado pela regra dos 50%
      const { multiplicador, valor } = await ComissionamentoService.calcularComissao(
        percentualParaComissao, // Usar percentual ajustado (0% se algum membro < 50%)
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

  private static calcularDatasSemanaDoMes(ano: number, mes: number, numeroSemana: number): { inicioSemana: Date; fimSemana: Date } {
    console.log(`📅 CALCULANDO SEMANA ${numeroSemana} de ${mes}/${ano}`);
    
    // LOGS ESPECIAIS PARA SEMANA 1 - CÁLCULO DE DATAS
    if (numeroSemana === 1) {
      console.log(`🔥 SEMANA 1 - INICIANDO CÁLCULO DE DATAS DETALHADO`);
      console.log(`🔥 SEMANA 1 - PARÂMETROS: ano=${ano}, mês=${mes}, semana=${numeroSemana}`);
    }
    
    // Encontrar todas as terças-feiras do mês
    const tercasFeiras: Date[] = [];
    const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
    
    if (numeroSemana === 1) {
      console.log(`🔥 SEMANA 1 - ÚLTIMO DIA DO MÊS: ${ultimoDiaDoMes}`);
    }
    
    for (let dia = 1; dia <= ultimoDiaDoMes; dia++) {
      const data = new Date(ano, mes - 1, dia);
      if (data.getDay() === 2) { // Terça-feira
        tercasFeiras.push(new Date(data));
        if (numeroSemana === 1) {
          console.log(`🔥 SEMANA 1 - TERÇA ENCONTRADA: ${data.toLocaleDateString('pt-BR')} (dia ${dia})`);
        }
      }
    }
    
    // Verificar se há terças de semanas que terminam no mês (do mês anterior)
    const primeiraTercaDoMes = tercasFeiras[0];
    if (primeiraTercaDoMes && primeiraTercaDoMes.getDate() > 7) {
      // Adicionar a terça da semana anterior que termina neste mês
      const tercaAnterior = new Date(primeiraTercaDoMes);
      tercaAnterior.setDate(tercaAnterior.getDate() - 7);
      tercasFeiras.unshift(tercaAnterior);
      
      if (numeroSemana === 1) {
        console.log(`🔥 SEMANA 1 - TERÇA ANTERIOR ADICIONADA: ${tercaAnterior.toLocaleDateString('pt-BR')} (pois primeira terça é dia ${primeiraTercaDoMes.getDate()} > 7)`);
      }
    }
    
    console.log(`🗓️ Terças-feiras encontradas para ${mes}/${ano}:`, tercasFeiras.map(t => t.toLocaleDateString('pt-BR')));
    
    if (numeroSemana === 1) {
      console.log(`🔥 SEMANA 1 - TOTAL DE TERÇAS ENCONTRADAS: ${tercasFeiras.length}`);
      console.log(`🔥 SEMANA 1 - LISTA COMPLETA DAS TERÇAS:`, tercasFeiras.map((t, i) => `Semana ${i + 1}: ${t.toLocaleDateString('pt-BR')}`));
    }
    
    // Verificar se a semana existe
    if (numeroSemana < 1 || numeroSemana > tercasFeiras.length) {
      console.error(`❌ Semana ${numeroSemana} não existe no mês ${mes}/${ano}. Temos ${tercasFeiras.length} semanas.`);
      
      if (numeroSemana === 1) {
        console.log(`🔥 SEMANA 1 - ❌❌❌ ERRO: SEMANA 1 NÃO EXISTE! ❌❌❌`);
        console.log(`🔥 SEMANA 1 - DIAGNÓSTICO:`, {
          numeroSemana_solicitado: numeroSemana,
          total_semanas_encontradas: tercasFeiras.length,
          condicao_falhou: numeroSemana < 1 ? 'numeroSemana < 1' : 'numeroSemana > tercasFeiras.length',
          mes_ano: `${mes}/${ano}`
        });
      }
      
      return { 
        inicioSemana: new Date(ano, mes - 1, 1), 
        fimSemana: new Date(ano, mes - 1, 1) 
      };
    }
    
    const tercaDaSemana = tercasFeiras[numeroSemana - 1];
    
    if (numeroSemana === 1) {
      console.log(`🔥 SEMANA 1 - TERÇA DA SEMANA SELECIONADA: ${tercaDaSemana.toLocaleDateString('pt-BR')}`);
    }
    
    // O início da semana é na quarta-feira ANTERIOR à terça (6 dias antes)
    const inicioSemana = new Date(tercaDaSemana);
    inicioSemana.setDate(tercaDaSemana.getDate() - 6);
    inicioSemana.setHours(0, 0, 0, 0);
    
    // O fim da semana é na terça-feira
    const fimSemana = new Date(tercaDaSemana);
    fimSemana.setHours(23, 59, 59, 999);
    
    console.log(`📊 SEMANA ${numeroSemana} FINAL: ${inicioSemana.toLocaleDateString('pt-BR')} (quarta) até ${fimSemana.toLocaleDateString('pt-BR')} (terça)`);
    
    if (numeroSemana === 1) {
      console.log(`🔥 SEMANA 1 - RESULTADO FINAL DETALHADO:`, {
        tercaDaSemana: tercaDaSemana.toLocaleDateString('pt-BR'),
        inicioSemana: {
          data: inicioSemana.toLocaleDateString('pt-BR'),
          iso: inicioSemana.toISOString(),
          dia_semana: inicioSemana.getDay() // deve ser 3 (quarta)
        },
        fimSemana: {
          data: fimSemana.toLocaleDateString('pt-BR'),
          iso: fimSemana.toISOString(),
          dia_semana: fimSemana.getDay() // deve ser 2 (terça)
        },
        calculo_inicio: `${tercaDaSemana.toLocaleDateString('pt-BR')} - 6 dias = ${inicioSemana.toLocaleDateString('pt-BR')}`
      });
    }
    
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
