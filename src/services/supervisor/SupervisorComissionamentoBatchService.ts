import { supabase } from '@/integrations/supabase/client';
import { ComissionamentoService } from '@/services/comissionamentoService';
import { getDataEfetivaVenda, isVendaInWeek } from '@/utils/vendaDateUtils';
import type { SupervisorComissionamentoData, SDRResumo } from './SupervisorComissionamentoService';

interface CachedMemberData {
  id: string;
  name: string;
  user_type: string;
  nivel: string;
  metaSemanal: number;
  variabelSemanal?: number;
}

interface BatchedWeekData {
  ano: number;
  mes: number;
  semana: number;
  inicioSemana: Date;
  fimSemana: Date;
}

export class SupervisorComissionamentoBatchService {
  private static memberDataCache = new Map<string, CachedMemberData>();
  private static nivelDataCache = new Map<string, any>();

  /**
   * Busca dados de comissionamento para múltiplas semanas em paralelo
   */
  static async calcularComissionamentoMultiplasSemanasParalelo(
    supervisorId: string,
    ano: number,
    mes: number,
    semanas: number[]
  ): Promise<SupervisorComissionamentoData[]> {
    console.log(`🚀 BATCH: Iniciando cálculo paralelo para ${semanas.length} semanas`);
    
    // Buscar dados do supervisor e grupo uma única vez
    const [supervisorData, grupoData] = await Promise.all([
      this.buscarSupervisor(supervisorId),
      this.buscarGrupoSupervisor(supervisorId)
    ]);

    if (!supervisorData || !grupoData) {
      console.error('❌ BATCH: Supervisor ou grupo não encontrado');
      return [];
    }

    // Buscar todos os membros uma única vez
    const todosMembrosMes = await this.buscarTodosMembrosDoMes(grupoData.id);
    
    // Pre-carregar níveis uma única vez
    await this.preCarregarNiveis();

    // Preparar dados das semanas
    const weekDataArray: BatchedWeekData[] = semanas.map(semana => {
      const { inicioSemana, fimSemana } = this.calcularDatasSemanaDoMes(ano, mes, semana);
      return { ano, mes, semana, inicioSemana, fimSemana };
    });

    // Processar todas as semanas em paralelo
    console.log(`⚡ BATCH: Processando ${weekDataArray.length} semanas em paralelo`);
    const resultados = await Promise.all(
      weekDataArray.map(weekData => 
        this.processarSemanaOtimizada(
          supervisorData,
          grupoData,
          todosMembrosMes,
          weekData
        )
      )
    );

    console.log(`✅ BATCH: Processamento paralelo concluído - ${resultados.length} semanas processadas`);
    return resultados;
  }

  /**
   * Busca dados do supervisor (cacheable)
   */
  private static async buscarSupervisor(supervisorId: string) {
    const { data: supervisorData, error } = await supabase
      .from('profiles')
      .select('name, nivel, user_type, ativo')
      .eq('id', supervisorId)
      .eq('user_type', 'supervisor')
      .eq('ativo', true)
      .maybeSingle();

    if (error || !supervisorData) {
      console.error('❌ BATCH: Erro ao buscar supervisor:', error);
      return null;
    }
    
    return { id: supervisorId, ...supervisorData };
  }

  /**
   * Busca grupo do supervisor (cacheable)
   */
  private static async buscarGrupoSupervisor(supervisorId: string) {
    const { data: grupoData, error } = await supabase
      .from('grupos_supervisores')
      .select('id, nome_grupo')
      .eq('supervisor_id', supervisorId)
      .maybeSingle();

    if (error || !grupoData) {
      console.error('❌ BATCH: Erro ao buscar grupo:', error);
      return null;
    }
    
    return grupoData;
  }

  /**
   * Busca TODOS os membros do mês uma única vez
   */
  private static async buscarTodosMembrosDoMes(grupoId: string) {
    const { data: todosMembrosDoMes } = await supabase
      .from('membros_grupos_supervisores')
      .select(`
        usuario_id,
        created_at,
        left_at,
        usuario:profiles!inner(id, name, user_type, nivel, ativo)
      `)
      .eq('grupo_id', grupoId);

    return todosMembrosDoMes || [];
  }

  /**
   * Pre-carrega todos os níveis necessários uma única vez
   */
  private static async preCarregarNiveis() {
    if (this.nivelDataCache.size > 0) return; // Já carregado

    const { data: niveisData } = await supabase
      .from('niveis_vendedores')
      .select('*');
    
    if (niveisData) {
      niveisData.forEach(nivel => {
        const key = `${nivel.nivel}-${nivel.tipo_usuario}`;
        this.nivelDataCache.set(key, nivel);
      });
    }

    console.log(`📊 BATCH: Pre-carregados ${this.nivelDataCache.size} níveis`);
  }

  /**
   * Obtem dados de nível do cache
   */
  private static obterNivelDoCache(nivel: string, tipoUsuario: string) {
    const key = `${nivel}-${tipoUsuario}`;
    return this.nivelDataCache.get(key);
  }

  /**
   * Processa uma semana de forma otimizada
   */
  private static async processarSemanaOtimizada(
    supervisorData: any,
    grupoData: any,
    todosMembrosMes: any[],
    weekData: BatchedWeekData
  ): Promise<SupervisorComissionamentoData> {
    const { semana, inicioSemana, fimSemana } = weekData;
    
    console.log(`📅 BATCH: Processando semana ${semana} (${inicioSemana.toLocaleDateString()} - ${fimSemana.toLocaleDateString()})`);

    // Filtrar membros ativos nesta semana específica
    const membrosValidosParaSemana = this.filtrarMembrosAtivosPorPeriodo(
      todosMembrosMes,
      inicioSemana,
      fimSemana
    );

    if (membrosValidosParaSemana.length === 0) {
      return this.criarResultadoVazio(supervisorData, grupoData, weekData);
    }

    // Buscar todas as atividades em paralelo
    const [agendamentosPorMembro, vendasPorMembro, respostasFormulario] = await Promise.all([
      this.buscarTodosAgendamentos(membrosValidosParaSemana, inicioSemana, fimSemana),
      this.buscarTodasVendas(membrosValidosParaSemana, inicioSemana, fimSemana),
      this.buscarTodasRespostasFormulario(membrosValidosParaSemana)
    ]);

    // Processar todos os membros em paralelo
    const sdrsDetalhes = await Promise.all(
      membrosValidosParaSemana.map(membro =>
        this.processarMembroOtimizado(
          membro,
          inicioSemana,
          fimSemana,
          agendamentosPorMembro.get(membro.usuario_id) || [],
          vendasPorMembro.get(membro.usuario_id) || [],
          respostasFormulario
        )
      )
    );

    // Calcular métricas finais
    const mediaPercentualAtingimento = this.calcularMediaPercentual(sdrsDetalhes);
    const { multiplicador, valor } = await this.calcularComissaoSupervisor(
      supervisorData,
      mediaPercentualAtingimento
    );

    return {
      supervisorId: supervisorData.id,
      nome: supervisorData.name,
      grupoId: grupoData.id,
      nomeGrupo: grupoData.nome_grupo,
      ano: weekData.ano,
      semana: weekData.semana,
      totalSDRs: membrosValidosParaSemana.length,
      mediaPercentualAtingimento: Math.round(mediaPercentualAtingimento * 100) / 100,
      variabelSemanal: supervisorData.variabel_semanal || 0,
      multiplicador,
      valorComissao: valor,
      sdrsDetalhes
    };
  }

  /**
   * Filtra membros ativos por período
   */
  private static filtrarMembrosAtivosPorPeriodo(
    todosMembrosMes: any[],
    inicioSemana: Date,
    fimSemana: Date
  ) {
    return todosMembrosMes.filter(membro => {
      const criadoEm = new Date(membro.created_at);
      const saídaEm = membro.left_at ? new Date(membro.left_at) : null;
      
      const foiCriadoAteOFimDaSemana = criadoEm <= fimSemana;
      const naoSaiuAntesDaSemana = !saídaEm || saídaEm > inicioSemana;
      const estaAtivo = membro.usuario?.ativo === true;
      const eTipoValido = ['sdr', 'sdr_inbound', 'sdr_outbound', 'vendedor'].includes(membro.usuario?.user_type);
      
      return foiCriadoAteOFimDaSemana && naoSaiuAntesDaSemana && estaAtivo && eTipoValido;
    });
  }

  /**
   * Busca todos os agendamentos de uma vez
   */
  private static async buscarTodosAgendamentos(
    membros: any[],
    inicioSemana: Date,
    fimSemana: Date
  ): Promise<Map<string, any[]>> {
    const sdrIds = membros
      .filter(m => ['sdr', 'sdr_inbound', 'sdr_outbound'].includes(m.usuario?.user_type))
      .map(m => m.usuario_id);

    if (sdrIds.length === 0) {
      return new Map();
    }

    const startISO = inicioSemana.toISOString();
    const endExclusive = new Date(fimSemana.getTime());
    endExclusive.setDate(endExclusive.getDate() + 1); // incluir o dia inteiro de terça
    const endISO = endExclusive.toISOString();

    console.log('🔎 BATCH DEBUG: Buscando agendamentos (data_resultado)', {
      sdrs: sdrIds.length,
      inicio: startISO,
      fimExclusive: endISO
    });

    let { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('sdr_id, id, data_resultado, resultado_reuniao')
      .in('sdr_id', sdrIds)
      .gte('data_resultado', startISO)
      .lt('data_resultado', endISO);

    if (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      return new Map();
    }

    if (!agendamentos || agendamentos.length === 0) {
      console.warn('⚠️ BATCH DEBUG: Nenhum agendamento por data_resultado. Tentando fallback por data_agendamento...');
      const fallback = await supabase
        .from('agendamentos')
        .select('sdr_id, id, data_resultado, data_agendamento, resultado_reuniao')
        .in('sdr_id', sdrIds)
        .gte('data_agendamento', startISO)
        .lt('data_agendamento', endISO);

      if (!fallback.error && fallback.data) {
        agendamentos = fallback.data;
        console.log('🟡 BATCH DEBUG: Fallback retornou agendamentos:', agendamentos.length);
      } else if (fallback.error) {
        console.error('❌ Erro no fallback por data_agendamento:', fallback.error);
      }
    }

    console.log('📊 BATCH DEBUG: Agendamentos retornados', {
      total: agendamentos?.length || 0,
      resultados: Array.from(new Set((agendamentos || []).map(a => a.resultado_reuniao)))
    });

    // Agrupar por sdr_id
    const agendamentosPorMembro = new Map<string, any[]>();
    agendamentos?.forEach(agendamento => {
      const sdrId = agendamento.sdr_id;
      if (!agendamentosPorMembro.has(sdrId)) {
        agendamentosPorMembro.set(sdrId, []);
      }
      agendamentosPorMembro.get(sdrId)!.push(agendamento);
    });

    return agendamentosPorMembro;
  }

  /**
   * Busca todas as vendas de uma vez
   */
  private static async buscarTodasVendas(
    membros: any[],
    inicioSemana: Date,
    fimSemana: Date
  ): Promise<Map<string, any[]>> {
    const vendedorIds = membros
      .filter(m => m.usuario?.user_type === 'vendedor')
      .map(m => m.usuario_id);

    if (vendedorIds.length === 0) {
      return new Map();
    }

    const { data: vendas } = await supabase
      .from('form_entries')
      .select(`
        vendedor_id,
        id,
        pontuacao_validada,
        enviado_em,
        data_assinatura_contrato,
        data_aprovacao
      `)
      .in('vendedor_id', vendedorIds)
      .eq('status', 'matriculado');

    // Agrupar por vendedor_id
    const vendasPorMembro = new Map<string, any[]>();
    vendas?.forEach(venda => {
      const vendedorId = venda.vendedor_id;
      if (!vendasPorMembro.has(vendedorId)) {
        vendasPorMembro.set(vendedorId, []);
      }
      vendasPorMembro.get(vendedorId)!.push(venda);
    });

    return vendasPorMembro;
  }

  /**
   * Busca todas as respostas do formulário de uma vez
   */
  private static async buscarTodasRespostasFormulario(membros: any[]): Promise<any[]> {
    const vendedorIds = membros
      .filter(m => m.usuario?.user_type === 'vendedor')
      .map(m => m.usuario_id);

    if (vendedorIds.length === 0) {
      return [];
    }

    // Buscar vendas dos vendedores primeiro
    const { data: vendas } = await supabase
      .from('form_entries')
      .select('id')
      .in('vendedor_id', vendedorIds)
      .eq('status', 'matriculado');

    if (!vendas || vendas.length === 0) {
      return [];
    }

    // Buscar respostas do formulário
    const { data: respostasFormulario } = await supabase
      .from('respostas_formulario')
      .select('form_entry_id, campo_nome, valor_informado')
      .in('form_entry_id', vendas.map(v => v.id));

    return respostasFormulario || [];
  }

  /**
   * Processa um membro de forma otimizada
   */
  private static async processarMembroOtimizado(
    membro: any,
    inicioSemana: Date,
    fimSemana: Date,
    agendamentos: any[],
    vendas: any[],
    respostasFormulario: any[]
  ): Promise<SDRResumo> {
    const membroId = membro.usuario_id;
    const membroNome = membro.usuario?.name || 'Membro';
    const membroNivel = membro.usuario?.nivel || 'junior';
    const membroTipo = membro.usuario?.user_type;

    // Buscar meta do cache
    const metaSemanal = this.obterMetaDoCache(membroNivel, membroTipo);
    
    // Calcular atividades realizadas
    let reunioesRealizadas = 0;
    
    if (['sdr', 'sdr_inbound', 'sdr_outbound'].includes(membroTipo)) {
      // Para SDRs: contar qualquer reunião finalizada (resultado_reuniao não nulo) exceto ausências/negativos
      const invalid = new Set(['nao_compareceu', 'nao compareceu', 'no_show', 'cancelado', 'cancelada']);
      reunioesRealizadas = agendamentos.filter(agendamento => {
        const res = (agendamento.resultado_reuniao || '').toString().trim().toLowerCase();
        return res && !invalid.has(res);
      }).length;
      console.log('📈 BATCH DEBUG SDR', {
        membroId,
        membroNome,
        totalAgendamentos: agendamentos.length,
        contados: reunioesRealizadas,
        resultados: Array.from(new Set(agendamentos.map(a => a.resultado_reuniao)))
      });
    } else if (membroTipo === 'vendedor') {
      // Filtrar vendas que estão na semana usando data efetiva
      const vendasNaSemana = vendas.filter(venda => 
        isVendaInWeek(venda, inicioSemana, fimSemana, respostasFormulario)
      );
      
      reunioesRealizadas = vendasNaSemana.reduce((total, venda) => 
        total + (venda.pontuacao_validada || 0), 0);
    }

    const percentualAtingimento = metaSemanal > 0 ? (reunioesRealizadas / metaSemanal) * 100 : 0;

    return {
      id: membroId,
      nome: membroNome,
      percentualAtingimento: Math.round(percentualAtingimento * 100) / 100,
      reunioesRealizadas,
      metaSemanal,
      userType: membroTipo,
      nivel: membroNivel
    };
  }

  /**
   * Obtem meta do cache ou calcula valor padrão
   */
  private static obterMetaDoCache(nivel: string, tipoUsuario: string): number {
    const nivelData = this.obterNivelDoCache(nivel, tipoUsuario === 'vendedor' ? 'vendedor' : 'sdr');
    
    // Valores padrão
    let metaPadrao = 0;
    if (tipoUsuario === 'vendedor') {
      metaPadrao = nivel === 'junior' ? 7 : nivel === 'pleno' ? 8 : nivel === 'senior' ? 10 : 7;
    } else {
      metaPadrao = nivel === 'junior' ? 55 : nivel === 'pleno' ? 70 : nivel === 'senior' ? 85 : 55;
    }
    
    if (!nivelData) return metaPadrao;
    
    if (tipoUsuario === 'vendedor') {
      return nivelData.meta_semanal_vendedor || metaPadrao;
    } else if (tipoUsuario === 'sdr_inbound') {
      return nivelData.meta_semanal_inbound || metaPadrao;
    } else if (tipoUsuario === 'sdr_outbound') {
      return nivelData.meta_semanal_outbound || metaPadrao;
    } else {
      return nivelData.meta_semanal_inbound || metaPadrao;
    }
  }

  /**
   * Calcula média percentual
   */
  private static calcularMediaPercentual(sdrsDetalhes: SDRResumo[]): number {
    if (sdrsDetalhes.length === 0) return 0;
    
    const somaPercentuais = sdrsDetalhes.reduce((soma, sdr) => soma + sdr.percentualAtingimento, 0);
    return somaPercentuais / sdrsDetalhes.length;
  }

  /**
   * Calcula comissão do supervisor
   */
  private static async calcularComissaoSupervisor(supervisorData: any, mediaPercentual: number) {
    // Buscar variável semanal do supervisor
    const nivelData = this.obterNivelDoCache(supervisorData.nivel, 'supervisor');
    const variabelSemanal = nivelData?.variavel_semanal || 1000;

    // Calcular comissão
    return await ComissionamentoService.calcularComissao(
      mediaPercentual,
      100, // Meta base de 100%
      variabelSemanal,
      'supervisor'
    );
  }

  /**
   * Cria resultado vazio para semana sem membros
   */
  private static criarResultadoVazio(
    supervisorData: any,
    grupoData: any,
    weekData: BatchedWeekData
  ): SupervisorComissionamentoData {
    return {
      supervisorId: supervisorData.id,
      nome: supervisorData.name,
      grupoId: grupoData.id,
      nomeGrupo: grupoData.nome_grupo,
      ano: weekData.ano,
      semana: weekData.semana,
      totalSDRs: 0,
      mediaPercentualAtingimento: 0,
      variabelSemanal: 0,
      multiplicador: 0,
      valorComissao: 0,
      sdrsDetalhes: []
    };
  }

  /**
   * Calcula datas da semana dentro do mês
   */
  private static calcularDatasSemanaDoMes(ano: number, mes: number, numeroSemana: number): { inicioSemana: Date; fimSemana: Date } {
    // Encontrar a primeira terça-feira do mês
    const primeiraTerca = new Date(ano, mes - 1, 1);
    while (primeiraTerca.getDay() !== 2) { // 2 = terça-feira
      primeiraTerca.setDate(primeiraTerca.getDate() + 1);
    }
    
    if (primeiraTerca.getDate() > 7) {
      primeiraTerca.setDate(primeiraTerca.getDate() - 7);
    }
    
    // Calcular a semana específica
    const inicioSemana = new Date(primeiraTerca);
    inicioSemana.setDate(inicioSemana.getDate() - 6 + (numeroSemana - 1) * 7);
    inicioSemana.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);
    
    return { inicioSemana, fimSemana };
  }

  /**
   * Limpa cache (útil para testes ou mudanças)
   */
  static limparCache() {
    this.memberDataCache.clear();
    this.nivelDataCache.clear();
  }
}