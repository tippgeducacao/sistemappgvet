import { supabase } from '@/integrations/supabase/client';
import { ComissionamentoService } from '@/services/comissionamentoService';

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
  static async calcularComissionamentoSupervisor(
    supervisorId: string,
    ano: number,
    semana: number
  ): Promise<SupervisorComissionamentoData | null> {
    try {
      // Buscar dados do supervisor
      const { data: supervisorData, error: supervisorError } = await supabase
        .from('profiles')
        .select('name, nivel, user_type, ativo')
        .eq('id', supervisorId)
        .eq('user_type', 'supervisor')
        .eq('ativo', true)
        .single();

      if (supervisorError || !supervisorData) {
        console.error('❌ Erro ao buscar dados do supervisor:', supervisorError);
        return null;
      }

      // Buscar grupo do supervisor
      const { data: grupoData, error: grupoError } = await supabase
        .from('grupos_supervisores')
        .select('id, nome_grupo')
        .eq('supervisor_id', supervisorId)
        .single();

      if (grupoError || !grupoData) {
        console.error('❌ Erro ao buscar grupo do supervisor:', grupoError);
        return null;
      }

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

      // Filtrar apenas SDRs ativos
      const sdrsAtivos = membrosData.filter(
        membro => membro.usuario?.user_type === 'sdr' && membro.usuario?.ativo === true
      );

      if (sdrsAtivos.length === 0) {
        console.warn('⚠️ Nenhum SDR ativo encontrado no grupo');
        return null;
      }

      // Calcular datas da semana (quarta a terça)
      const { inicioSemana, fimSemana } = this.calcularDatasSemana(ano, semana);

      // Calcular percentual de atingimento para cada SDR
      const sdrsDetalhes: SDRResumo[] = [];
      let somaPercentuais = 0;

      for (const membro of sdrsAtivos) {
        const sdrId = membro.usuario_id;
        const sdrNome = membro.usuario?.name || 'SDR';
        const sdrNivel = membro.usuario?.nivel || 'junior';

        // Buscar meta do SDR baseada no nível
        const { data: nivelData } = await supabase
          .from('niveis_vendedores')
          .select('meta_semanal_outbound')
          .eq('nivel', sdrNivel)
          .eq('tipo_usuario', 'sdr')
          .single();

        const metaSemanal = nivelData?.meta_semanal_outbound || 0;

        // Buscar reuniões realizadas pelo SDR na semana
        const { data: agendamentos } = await supabase
          .from('agendamentos')
          .select('id')
          .eq('sdr_id', sdrId)
          .gte('data_agendamento', inicioSemana.toISOString())
          .lte('data_agendamento', fimSemana.toISOString())
          .in('resultado_reuniao', ['compareceu', 'comprou', 'compareceu_nao_comprou'])
          .eq('status', 'finalizado');

        const reunioesRealizadas = agendamentos?.length || 0;
        const percentualAtingimento = metaSemanal > 0 ? (reunioesRealizadas / metaSemanal) * 100 : 0;

        sdrsDetalhes.push({
          id: sdrId,
          nome: sdrNome,
          percentualAtingimento: Math.round(percentualAtingimento * 100) / 100,
          reunioesRealizadas,
          metaSemanal
        });

        somaPercentuais += percentualAtingimento;
      }

      // Calcular média das porcentagens
      const mediaPercentualAtingimento = somaPercentuais / sdrsAtivos.length;

      // Buscar variável semanal do supervisor
      const { data: nivelSupervisorData, error: nivelSupervisorError } = await supabase
        .from('niveis_vendedores')
        .select('variavel_semanal')
        .eq('nivel', supervisorData.nivel)
        .eq('tipo_usuario', 'supervisor')
        .single();

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
        totalSDRs: sdrsAtivos.length,
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
}