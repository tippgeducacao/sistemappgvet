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

      // Buscar SDRs do grupo (filtrar por período de validade)
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
        .eq('grupo_id', grupoData.id)
        .lte('created_at', fimSemana.toISOString())
        .or(`left_at.is.null,left_at.gte.${inicioSemana.toISOString()}`);

      console.log('👥 DEBUG: Membros encontrados:', membrosData?.length || 0);
      console.log('📋 DEBUG: Detalhes dos membros:', membrosData?.map(m => ({
        nome: m.usuario?.name,
        created_at: m.created_at,
        left_at: m.left_at,
        ativo: m.usuario?.ativo
      })));

      if (membrosError || !membrosData) {
        console.error('❌ Erro ao buscar membros do grupo:', membrosError);
        console.log('🔍 Grupo ID para busca de membros:', grupoData.id);
        return null;
      }
      
      console.log('✅ Membros encontrados:', membrosData.length, 'membros');
      console.log('🔍 Detalhes de todos os membros:', membrosData.map(m => ({
        id: m.usuario_id,
        nome: m.usuario?.name,
        tipo: m.usuario?.user_type,
        nivel: m.usuario?.nivel,
        ativo: m.usuario?.ativo
      })));

      // Filtrar apenas membros ativos (SDRs e Vendedores) - incluindo todos os tipos de SDR
      const membrosAtivos = membrosData.filter(
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
          // Para SDRs: buscar agendamentos com resultados específicos (mesmo que planilha detalhada)
          console.log(`🔍 SDR ${membroNome} - Buscando agendamentos entre:`, {
            inicio: inicioSemana.toISOString(),
            fim: fimSemana.toISOString(),
            sdr_id: membroId
          });
          
          const { data: agendamentos, error: agendamentosError } = await supabase
            .from('agendamentos')
            .select('id, data_agendamento, resultado_reuniao, status')
            .eq('sdr_id', membroId)
            .gte('data_agendamento', inicioSemana.toISOString())
            .lte('data_agendamento', fimSemana.toISOString())
            .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou']);
            
          console.log(`📊 SDR ${membroNome} - Todos agendamentos encontrados:`, agendamentos?.length || 0);
          if (agendamentos && agendamentos.length > 0) {
            console.log('Detalhes dos agendamentos:', agendamentos.map(a => ({
              id: a.id.substring(0, 8),
              data: new Date(a.data_agendamento).toLocaleDateString('pt-BR'),
              resultado: a.resultado_reuniao,
              status: a.status
            })));
          }
          
          // Filtrar apenas agendamentos com resultados específicos (EXATAMENTE como na planilha detalhada)
          const agendamentosComResultado = agendamentos?.filter(a => 
            ['comprou', 'compareceu_nao_comprou'].includes(a.resultado_reuniao)
          ) || [];
          
          reunioesRealizadas = agendamentosComResultado.length;
          console.log(`📅 SDR ${membroNome}: ${reunioesRealizadas} reuniões realizadas (filtro: status=finalizado + resultado=compareceu/comprou/compareceu_nao_comprou)`);
          
          if (agendamentosError) console.log('❌ Erro agendamentos SDR:', agendamentosError);
          
          if (agendamentosComResultado.length > 0) {
            console.log('Agendamentos com resultado válido:', agendamentosComResultado.map(a => ({
              id: a.id.substring(0, 8),
              data: new Date(a.data_agendamento).toLocaleDateString('pt-BR'),
              resultado: a.resultado_reuniao
            })));
          }
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

      // Buscar SDRs do grupo (filtrar por período de validade)
      console.log('🔍 DEBUG: Buscando membros do grupo para período histórico:', {
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
        .eq('grupo_id', grupoData.id)
        .lte('created_at', fimSemana.toISOString())
        .or(`left_at.is.null,left_at.gte.${inicioSemana.toISOString()}`);

      console.log('👥 DEBUG: Membros encontrados (histórico):', membrosData?.length || 0);
      console.log('📋 DEBUG: Detalhes dos membros (histórico):', membrosData?.map(m => ({
        nome: m.usuario?.name,
        created_at: m.created_at,
        left_at: m.left_at,
        ativo: m.usuario?.ativo
      })));

      if (membrosError || !membrosData) {
        console.error('❌ Erro ao buscar membros do grupo:', membrosError);
        return null;
      }

      console.log(`✅ ${membrosData.length} membros encontrados no grupo`);

      // Filtrar apenas membros ativos (SDRs e Vendedores) - incluindo todos os tipos de SDR
      const membrosAtivos = membrosData.filter(
        membro => membro.usuario?.ativo === true && 
        (membro.usuario?.user_type === 'sdr' || 
         membro.usuario?.user_type === 'sdr_inbound' || 
         membro.usuario?.user_type === 'sdr_outbound' || 
         membro.usuario?.user_type === 'vendedor')
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
            .lte('data_agendamento', fimSemana.toISOString())
            .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou']);
            
          console.log(`📊 SDR ${membroNome} - Todos agendamentos encontrados:`, agendamentos?.length || 0);
          if (agendamentos && agendamentos.length > 0) {
            console.log('Detalhes dos agendamentos:', agendamentos.map(a => ({
              id: a.id.substring(0, 8),
              data: new Date(a.data_agendamento).toLocaleDateString('pt-BR'),
              resultado: a.resultado_reuniao,
              status: a.status
            })));
          }
          
          // Filtrar apenas agendamentos com resultados específicos (EXATAMENTE como na planilha detalhada)
          const agendamentosComResultado = agendamentos?.filter(a => 
            ['comprou', 'compareceu_nao_comprou'].includes(a.resultado_reuniao)
          ) || [];
          
          reunioesRealizadas = agendamentosComResultado.length;
          console.log(`📅 SDR ${membroNome}: ${reunioesRealizadas} reuniões realizadas (filtro: status=finalizado + resultado=compareceu/comprou/compareceu_nao_comprou)`);
          
          if (agendamentosComResultado.length > 0) {
            console.log('Agendamentos com resultado válido:', agendamentosComResultado.map(a => ({
              id: a.id.substring(0, 8),
              data: new Date(a.data_agendamento).toLocaleDateString('pt-BR'),
              resultado: a.resultado_reuniao
            })));
          }
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