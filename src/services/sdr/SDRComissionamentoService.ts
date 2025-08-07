import { supabase } from '@/integrations/supabase/client';
import { ComissionamentoService } from '@/services/comissionamentoService';

export interface SDRComissionamentoData {
  sdrId: string;
  nome: string;
  nivel: string;
  tipoUsuario: string;
  ano: number;
  semana: number;
  reunioesRealizadas: number;
  metaSemanalReunioes: number;
  variabelSemanal: number;
  percentualAtingimento: number;
  multiplicador: number;
  valorComissao: number;
}

export class SDRComissionamentoService {
  static async calcularComissionamentoSDRSemanal(
    sdrId: string, 
    ano: number, 
    semana: number
  ): Promise<SDRComissionamentoData | null> {
    try {
      // Buscar dados do SDR
      const { data: sdrData, error: sdrError } = await supabase
        .from('profiles')
        .select('name, nivel, user_type')
        .eq('id', sdrId)
        .eq('user_type', 'sdr_inbound')
        .single();

      if (sdrError || !sdrData) {
        console.error('❌ Erro ao buscar dados do SDR:', sdrError);
        return null;
      }

      // Buscar dados do nível do SDR
      const { data: nivelData, error: nivelError } = await supabase
        .from('niveis_vendedores')
        .select('meta_semanal_inbound, variavel_semanal')
        .eq('nivel', sdrData.nivel)
        .eq('tipo_usuario', 'sdr')
        .single();

      if (nivelError || !nivelData) {
        console.error('❌ Erro ao buscar dados do nível:', nivelError);
        return null;
      }

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

      // Buscar reuniões realizadas na semana
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('sdr_id', sdrId)
        .gte('data_agendamento', inicioSemana.toISOString())
        .lte('data_agendamento', fimSemana.toISOString())
        .in('resultado_reuniao', ['compareceu', 'comprou', 'compareceu_nao_comprou'])
        .eq('status', 'finalizado');

      if (agendamentosError) {
        console.error('❌ Erro ao buscar agendamentos:', agendamentosError);
        return null;
      }

      const reunioesRealizadas = agendamentos?.length || 0;
      const metaSemanalReunioes = nivelData.meta_semanal_inbound;
      const variabelSemanal = nivelData.variavel_semanal;

      // Calcular percentual de atingimento
      const percentualAtingimento = metaSemanalReunioes > 0 
        ? (reunioesRealizadas / metaSemanalReunioes) * 100 
        : 0;

      // Calcular comissão usando o mesmo sistema dos vendedores
      const { multiplicador, valor } = await ComissionamentoService.calcularComissao(
        reunioesRealizadas,
        metaSemanalReunioes,
        variabelSemanal,
        'sdr'
      );

      return {
        sdrId,
        nome: sdrData.name,
        nivel: sdrData.nivel,
        tipoUsuario: sdrData.user_type,
        ano,
        semana,
        reunioesRealizadas,
        metaSemanalReunioes,
        variabelSemanal,
        percentualAtingimento: Math.round(percentualAtingimento * 100) / 100,
        multiplicador,
        valorComissao: valor
      };

    } catch (error) {
      console.error('❌ Erro ao calcular comissionamento SDR:', error);
      return null;
    }
  }

  static async calcularComissionamentoTodosSDRs(
    ano: number, 
    semana: number
  ): Promise<SDRComissionamentoData[]> {
    try {
      // Buscar todos os SDRs ativos
      const { data: sdrs, error: sdrsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'sdr_inbound')
        .eq('ativo', true);

      if (sdrsError || !sdrs) {
        console.error('❌ Erro ao buscar SDRs:', sdrsError);
        return [];
      }

      // Calcular comissionamento para cada SDR
      const resultados = await Promise.all(
        sdrs.map(sdr => this.calcularComissionamentoSDRSemanal(sdr.id, ano, semana))
      );

      return resultados.filter(resultado => resultado !== null) as SDRComissionamentoData[];

    } catch (error) {
      console.error('❌ Erro ao calcular comissionamento de todos os SDRs:', error);
      return [];
    }
  }
}