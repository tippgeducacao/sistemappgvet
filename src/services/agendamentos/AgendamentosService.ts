import { supabase } from '@/integrations/supabase/client';

export interface Agendamento {
  id: string;
  lead_id: string;
  vendedor_id: string;
  sdr_id: string;
  pos_graduacao_interesse: string;
  data_agendamento: string;
  data_fim_agendamento?: string;
  link_reuniao: string;
  status: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  lead?: {
    id: string;
    nome: string;
    email?: string;
    whatsapp?: string;
  };
  vendedor?: {
    id: string;
    name: string;
    email: string;
  };
  sdr?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PosGraduacao {
  id: string;
  nome: string;
  ativo: boolean;
  modalidade: string;
  created_at: string;
}

export class AgendamentosService {
  static async criarAgendamento(dados: {
    lead_id: string;
    vendedor_id: string;
    pos_graduacao_interesse: string;
    data_agendamento: string;
    data_fim_agendamento?: string;
    link_reuniao: string;
    observacoes?: string;
  }, forcarAgendamento: boolean = false): Promise<Agendamento | null> {
    try {
      console.log('🚀 AgendamentosService.criarAgendamento - INÍCIO');
      console.log('📅 Dados recebidos:', JSON.stringify(dados, null, 2));
      console.log('🔧 forcarAgendamento:', forcarAgendamento);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      console.log('✅ Usuário autenticado:', user.id);

      // Validar se o link da reunião foi fornecido
      if (!dados.link_reuniao?.trim()) {
        console.error('❌ Link da reunião não fornecido');
        throw new Error('Link da reunião é obrigatório');
      }
      console.log('✅ Link da reunião validado');

      // Validar se a data/hora é no futuro (com margem de 5 minutos)
      const dataAgendamento = new Date(dados.data_agendamento);
      const agora = new Date();
      const cincoMinutosAtras = new Date(agora.getTime() - 5 * 60 * 1000);
      
      console.log('📅 Validação de data/hora:');
      console.log('  - Data agendamento:', dataAgendamento.toISOString());
      console.log('  - Agora (original):', agora.toISOString());
      console.log('  - 5 min atrás:', cincoMinutosAtras.toISOString());
      console.log('  - É futuro?', dataAgendamento > cincoMinutosAtras);
      
      if (dataAgendamento <= cincoMinutosAtras) {
        console.error('❌ Data/hora já passou');
        throw new Error('Não é possível agendar para uma data/hora que já passou');
      }
      console.log('✅ Data/hora validada');

      // Verificar horário de trabalho do vendedor (apenas se não for agendamento forçado)
      if (!forcarAgendamento) {
        console.log('🕒 Verificando horário de trabalho...');
        const verificacaoHorario = await this.verificarHorarioTrabalho(
          dados.vendedor_id, 
          dados.data_agendamento, 
          dados.data_fim_agendamento
        );
        
        console.log('🕒 Resultado verificação horário:', verificacaoHorario);
        
        if (!verificacaoHorario.valido) {
          console.error('❌ Horário inválido:', verificacaoHorario.motivo);
          throw new Error(verificacaoHorario.motivo || 'Horário inválido');
        }
      console.log('✅ Horário de trabalho validado');
      } else {
        console.log('🚀 AGENDAMENTO FORÇADO - Pulando validação de horário de trabalho');
      }

      // Verificar conflitos com eventos especiais
      console.log('📅 Verificando conflitos com eventos especiais...');
      const temConflitosEventos = await this.verificarConflitosEventosEspeciais(dados.data_agendamento, dados.data_fim_agendamento);
      console.log('📅 Resultado verificação eventos especiais:', temConflitosEventos);
      
      if (temConflitosEventos) {
        console.error('❌ Conflito com evento especial detectado');
        throw new Error('Este horário está bloqueado por um evento especial/recorrente');
      }
      console.log('✅ Sem conflitos com eventos especiais');

      // Sempre verificar conflitos de agenda, mesmo em agendamentos forçados
      console.log('⚔️ Verificando conflitos de agenda...');
      const temConflito = await this.verificarConflitosAgenda(dados.vendedor_id, dados.data_agendamento, dados.data_fim_agendamento);
      console.log('⚔️ Resultado verificação conflitos:', temConflito);
      
      if (temConflito) {
        console.error('❌ Conflito de agenda detectado');
        throw new Error('Vendedor já possui agendamento neste horário');
      }
      console.log('✅ Sem conflitos de agenda');

      console.log('💾 Inserindo agendamento no banco de dados...');
      console.log('💾 Dados para inserção:', {
        lead_id: dados.lead_id,
        vendedor_id: dados.vendedor_id,
        sdr_id: user.id,
        pos_graduacao_interesse: dados.pos_graduacao_interesse,
        data_agendamento: dados.data_agendamento,
        data_fim_agendamento: dados.data_fim_agendamento,
        link_reuniao: dados.link_reuniao,
        observacoes: dados.observacoes,
        status: 'agendado'
      });

      // ANTES DE INSERIR: Fazer uma última verificação de conflitos
      console.log('🛡️ VERIFICAÇÃO FINAL DE CONFLITOS antes da inserção...');
      const conflitosAntesFinal = await this.verificarConflitosAgenda(
        dados.vendedor_id, 
        dados.data_agendamento, 
        dados.data_fim_agendamento
      );
      
      if (conflitosAntesFinal) {
        console.error('❌ CONFLITO DETECTADO NA VERIFICAÇÃO FINAL!');
        throw new Error('Horário não disponível - conflito detectado na verificação final');
      }
      
      console.log('✅ Verificação final OK - prosseguindo com inserção');

      const { data, error } = await supabase
        .from('agendamentos')
        .insert({
          lead_id: dados.lead_id,
          vendedor_id: dados.vendedor_id,
          sdr_id: user.id,
          pos_graduacao_interesse: dados.pos_graduacao_interesse,
          data_agendamento: dados.data_agendamento,
          data_fim_agendamento: dados.data_fim_agendamento,
          link_reuniao: dados.link_reuniao,
          observacoes: dados.observacoes || '',
          status: 'agendado'
        })
        .select(`
          *,
          lead:leads(id, nome, email, whatsapp),
          vendedor:profiles!agendamentos_vendedor_id_fkey(id, name, email),
          sdr:profiles!agendamentos_sdr_id_fkey(id, name, email)
        `)
        .single();

      console.log('💾 Resultado da inserção:');
      console.log('  - Data:', data ? 'Presente' : 'Null');
      console.log('  - Error:', error);

      if (error) {
        console.error('❌ Erro do Supabase ao inserir agendamento:', error);
        throw error;
      }
      
      console.log('✅ Agendamento inserido com sucesso!');
      console.log('✅ ID do agendamento criado:', data?.id);
      
      return data;
    } catch (error) {
      console.error('🚨 ERRO DETALHADO AO CRIAR AGENDAMENTO:', error);
      console.error('📅 Dados enviados:', dados);
      
      if (error instanceof Error) {
        console.error('📝 Mensagem de erro:', error.message);
        console.error('📝 Stack trace:', error.stack);
        // Re-lançar o erro para mostrar a mensagem específica
        throw error;
      }
      
      throw new Error('Erro inesperado ao criar agendamento');
    }
  }

  static async criarAgendamentoVendedor(dados: {
    lead_id: string;
    vendedor_id: string;
    pos_graduacao_interesse: string;
    data_agendamento: string;
    data_fim_agendamento?: string;
    link_reuniao: string;
    observacoes?: string;
  }): Promise<Agendamento | null> {
    try {
      console.log('🚀 AgendamentosService.criarAgendamentoVendedor - INÍCIO');
      console.log('📅 Dados recebidos (vendedor agendando para si):', JSON.stringify(dados, null, 2));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      // Verificar se o usuário é realmente o vendedor que está tentando agendar para si
      if (user.id !== dados.vendedor_id) {
        console.error('❌ Vendedor só pode agendar para si mesmo');
        throw new Error('Você só pode agendar reuniões para você mesmo');
      }

      console.log('✅ Vendedor verificado:', user.id);

      // Validar se o link da reunião foi fornecido
      if (!dados.link_reuniao?.trim()) {
        console.error('❌ Link da reunião não fornecido');
        throw new Error('Link da reunião é obrigatório');
      }
      console.log('✅ Link da reunião validado');

      // Validar se a data/hora é no futuro (com margem de 5 minutos)
      const dataAgendamento = new Date(dados.data_agendamento);
      const agora = new Date();
      const cincoMinutosAtras = new Date(agora.getTime() - 5 * 60 * 1000);
      
      console.log('📅 Validação de data/hora:');
      console.log('  - Data agendamento:', dataAgendamento.toISOString());
      console.log('  - Agora (original):', agora.toISOString());
      console.log('  - 5 min atrás:', cincoMinutosAtras.toISOString());
      console.log('  - É futuro?', dataAgendamento > cincoMinutosAtras);
      
      if (dataAgendamento <= cincoMinutosAtras) {
        console.error('❌ Data/hora já passou');
        throw new Error('Não é possível agendar para uma data/hora que já passou');
      }
      console.log('✅ Data/hora validada');

      // Vendedores podem agendar fora do horário de trabalho - não verificar horário

      // Verificar conflitos com eventos especiais
      console.log('📅 Verificando conflitos com eventos especiais...');
      const temConflitosEventos = await this.verificarConflitosEventosEspeciais(dados.data_agendamento, dados.data_fim_agendamento);
      console.log('📅 Resultado verificação eventos especiais:', temConflitosEventos);
      
      if (temConflitosEventos) {
        console.error('❌ Conflito com evento especial detectado');
        throw new Error('Este horário está bloqueado por um evento especial/recorrente');
      }
      console.log('✅ Sem conflitos com eventos especiais');

      // Verificar conflitos de agenda
      console.log('⚔️ Verificando conflitos de agenda...');
      const temConflito = await this.verificarConflitosAgenda(dados.vendedor_id, dados.data_agendamento, dados.data_fim_agendamento);
      console.log('⚔️ Resultado verificação conflitos:', temConflito);
      
      if (temConflito) {
        console.error('❌ Conflito de agenda detectado');
        throw new Error('Você já possui agendamento neste horário');
      }
      console.log('✅ Sem conflitos de agenda');

      console.log('💾 Inserindo agendamento no banco de dados...');
      console.log('💾 Dados para inserção (vendedor como SDR):', {
        lead_id: dados.lead_id,
        vendedor_id: dados.vendedor_id,
        sdr_id: user.id, // Vendedor é também o SDR que está agendando
        pos_graduacao_interesse: dados.pos_graduacao_interesse,
        data_agendamento: dados.data_agendamento,
        data_fim_agendamento: dados.data_fim_agendamento,
        link_reuniao: dados.link_reuniao,
        observacoes: dados.observacoes,
        status: 'agendado'
      });

      // Inserir agendamento - vendedor agenda para si mesmo
      const { data, error } = await supabase
        .from('agendamentos')
        .insert({
          lead_id: dados.lead_id,
          vendedor_id: dados.vendedor_id, // Vendedor que vai fazer a reunião
          sdr_id: dados.vendedor_id, // Vendedor que está agendando (mesmo ID)
          pos_graduacao_interesse: dados.pos_graduacao_interesse,
          data_agendamento: dados.data_agendamento,
          data_fim_agendamento: dados.data_fim_agendamento,
          link_reuniao: dados.link_reuniao,
          observacoes: dados.observacoes || 'Reunião agendada pelo próprio vendedor',
          status: 'agendado'
        })
        .select(`
          *,
          lead:leads(id, nome, email, whatsapp),
          vendedor:profiles!agendamentos_vendedor_id_fkey(id, name, email),
          sdr:profiles!agendamentos_sdr_id_fkey(id, name, email)
        `)
        .single();

      console.log('💾 Resultado da inserção:');
      console.log('  - Data:', data ? 'Presente' : 'Null');
      console.log('  - Error:', error);

      if (error) {
        console.error('❌ Erro do Supabase ao inserir agendamento:', error);
        throw error;
      }
      
      console.log('✅ Agendamento do vendedor inserido com sucesso!');
      console.log('✅ ID do agendamento criado:', data?.id);
      
      return data;
    } catch (error) {
      console.error('🚨 ERRO DETALHADO AO CRIAR AGENDAMENTO DO VENDEDOR:', error);
      console.error('📅 Dados enviados:', dados);
      
      if (error instanceof Error) {
        console.error('📝 Mensagem de erro:', error.message);
        console.error('📝 Stack trace:', error.stack);
        // Re-lançar o erro para mostrar a mensagem específica
        throw error;
      }
      
      throw new Error('Erro inesperado ao criar agendamento');
    }
  }

  static async buscarAgendamentos(): Promise<Agendamento[]> {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          lead:leads(id, nome, email, whatsapp),
          vendedor:profiles!agendamentos_vendedor_id_fkey(id, name, email),
          sdr:profiles!agendamentos_sdr_id_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return [];
    }
  }

  static async buscarPosGraduacoes(): Promise<PosGraduacao[]> {
    try {
      // Voltar a buscar pós-graduações individuais para o formulário
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('ativo', true)
        .eq('modalidade', 'Pós-Graduação')
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pós-graduações:', error);
      return [];
    }
  }

  static async buscarVendedoresPorPosGraduacao(posGraduacao: string): Promise<any[]> {
    try {
      console.log('🔍 Buscando vendedores para pós-graduação:', posGraduacao);
      
      // Primeiro, buscar o ID do curso pela nome da pós-graduação
      const { data: cursoData, error: cursoError } = await supabase
        .from('cursos')
        .select('id')
        .eq('nome', posGraduacao)
        .eq('ativo', true)
        .single();

      if (cursoError || !cursoData) {
        console.log('🔍 Curso não encontrado:', posGraduacao);
        return [];
      }

      const cursoId = cursoData.id;
      console.log('✅ Curso encontrado:', cursoId);

      // Sistema direto: buscar vendedores que vendem este curso específico
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, pos_graduacoes, horario_trabalho')
        .eq('user_type', 'vendedor')
        .eq('ativo', true);

      if (error) throw error;
      
      // Filtrar vendedores que têm este curso específico em suas pós-graduações
      const vendedoresFiltrados = (data || []).filter(vendedor => {
        if (!vendedor.pos_graduacoes || !Array.isArray(vendedor.pos_graduacoes)) {
          return false;
        }
        // Verificar se o vendedor tem este curso específico
        return vendedor.pos_graduacoes.includes(cursoId);
      });

      console.log('🔍 Vendedores encontrados para', posGraduacao, '(via grupos):', vendedoresFiltrados);
      return vendedoresFiltrados;
    } catch (error) {
      console.error('Erro ao buscar vendedores por pós-graduação:', error);
      return [];
    }
  }

  static async verificarConflitosAgenda(vendedorId: string, dataAgendamento: string, dataFimAgendamento?: string, ignoreAgendamentoId?: string): Promise<boolean> {
    try {
      console.log('🔍 VERIFICANDO CONFLITOS DE AGENDA:', {
        vendedorId,
        dataAgendamento,
        dataFimAgendamento
      });

      // Converter para objetos Date usando horário local (SEM UTC)
      const dataInicio = new Date(dataAgendamento);
      const dataFim = dataFimAgendamento 
        ? new Date(dataFimAgendamento)
        : new Date(dataInicio.getTime() + 45 * 60 * 1000);

      console.log('📅 Datas convertidas:', {
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        dataInicioLocal: dataInicio.toLocaleString('pt-BR'),
        dataFimLocal: dataFim.toLocaleString('pt-BR')
      });

      // Buscar agendamentos do vendedor no mesmo dia (usando formato sem timezone)
      const dataConsulta = dataAgendamento.split('T')[0]; // YYYY-MM-DD
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, data_agendamento, data_fim_agendamento, status')
        .eq('vendedor_id', vendedorId)
        .in('status', ['agendado', 'atrasado', 'finalizado', 'finalizado_venda'])
        .gte('data_agendamento', `${dataConsulta}T00:00:00`)
        .lte('data_agendamento', `${dataConsulta}T23:59:59`);

      if (error) {
        console.error('❌ Erro na query de conflitos:', error);
        throw error;
      }
      
      console.log('📋 Agendamentos encontrados para verificação:', data?.length || 0);
      
      // Verificar sobreposição de horários usando lógica rigorosa
        for (const agendamento of data || []) {
          if (ignoreAgendamentoId && agendamento.id === ignoreAgendamentoId) {
            continue;
          }
          const agendamentoInicio = new Date(agendamento.data_agendamento);
          const agendamentoFim = agendamento.data_fim_agendamento 
            ? new Date(agendamento.data_fim_agendamento)
            : new Date(agendamentoInicio.getTime() + 45 * 60 * 1000);
          
        console.log('🔍 Verificando conflito com agendamento:', {
          id: agendamento.id,
          status: agendamento.status,
          existente: {
            inicio: agendamentoInicio.toLocaleString('pt-BR'),
            fim: agendamentoFim.toLocaleString('pt-BR')
          },
          novo: {
            inicio: dataInicio.toLocaleString('pt-BR'),
            fim: dataFim.toLocaleString('pt-BR')
          }
        });
        
        // Lógica rigorosa de sobreposição: 
        // Há conflito se o início do novo é antes do fim do existente E o fim do novo é depois do início do existente
        const temSobreposicao = dataInicio < agendamentoFim && dataFim > agendamentoInicio;
        
        if (temSobreposicao) {
          console.log('⚠️ CONFLITO DETECTADO!', {
            agendamentoExistente: {
              id: agendamento.id,
              inicio: agendamentoInicio.toLocaleString('pt-BR'),
              fim: agendamentoFim.toLocaleString('pt-BR')
            },
            novoAgendamento: {
              inicio: dataInicio.toLocaleString('pt-BR'),
              fim: dataFim.toLocaleString('pt-BR')
            }
          });
          return true;
        }
      }
      
      console.log('✅ Nenhum conflito detectado');
      return false;
    } catch (error) {
      console.error('❌ Erro ao verificar conflitos de agenda:', error);
      // Em caso de erro, retornar TRUE para ser conservador e evitar conflitos
      return true;
    }
  }

  static async verificarHorarioTrabalho(vendedorId: string, dataAgendamento: string, dataFimAgendamento?: string): Promise<{ valido: boolean; motivo?: string }> {
    try {
      // Buscar horário de trabalho do vendedor
      const { data: vendedor, error } = await supabase
        .from('profiles')
        .select('horario_trabalho')
        .eq('id', vendedorId)
        .single();

      if (error || !vendedor) {
        return { valido: false, motivo: 'Vendedor não encontrado' };
      }

      const horarioTrabalho = vendedor.horario_trabalho as any;
      if (!horarioTrabalho) {
        return { valido: false, motivo: 'Horário de trabalho não definido para este vendedor' };
      }

      const dataInicio = new Date(dataAgendamento);
      const dataFim = dataFimAgendamento ? new Date(dataFimAgendamento) : new Date(dataInicio.getTime() + 60 * 60 * 1000);
      
      const diaSemana = dataInicio.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
      const horarioInicioReuniao = dataInicio.toTimeString().slice(0, 5);
      const horarioFimReuniao = dataFim.toTimeString().slice(0, 5);

      // Verificar se é formato antigo ou novo
      let periodosTrabalho: any[] = [];
      
      if (horarioTrabalho.manha_inicio) {
        // Formato antigo
        periodosTrabalho = [
          {
            inicio: horarioTrabalho.manha_inicio,
            fim: horarioTrabalho.manha_fim
          },
          {
            inicio: horarioTrabalho.tarde_inicio,
            fim: horarioTrabalho.tarde_fim
          }
        ];
      } else {
        // Formato novo - verificar com base na configuração de dias de trabalho
        let trabalhaNesteDia = false;
        
        if (horarioTrabalho.dias_trabalho === 'segunda_sabado') {
          trabalhaNesteDia = diaSemana >= 1 && diaSemana <= 6; // Segunda a sábado
        } else if (horarioTrabalho.dias_trabalho === 'personalizado') {
          const diasMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
          const diaAtual = diasMap[diaSemana];
          trabalhaNesteDia = horarioTrabalho.dias_personalizados?.includes(diaAtual) || false;
        }
        
        if (!trabalhaNesteDia) {
          return { valido: false, motivo: 'Vendedor não trabalha neste dia da semana' };
        }

        // Determinar qual configuração de horário usar baseado no dia e configuração
        if (diaSemana === 6 && horarioTrabalho.sabado) {
          // Sábado - usar configuração específica do sábado
          periodosTrabalho = [
            {
              inicio: horarioTrabalho.sabado.periodo1_inicio,
              fim: horarioTrabalho.sabado.periodo1_fim
            }
          ];
          if (horarioTrabalho.sabado.periodo2_inicio && horarioTrabalho.sabado.periodo2_fim) {
            periodosTrabalho.push({
              inicio: horarioTrabalho.sabado.periodo2_inicio,
              fim: horarioTrabalho.sabado.periodo2_fim
            });
          }
        } else if (diaSemana >= 1 && diaSemana <= 5 && horarioTrabalho.segunda_sexta) {
          // Segunda a sexta - usar configuração de segunda a sexta
          periodosTrabalho = [
            {
              inicio: horarioTrabalho.segunda_sexta.periodo1_inicio,
              fim: horarioTrabalho.segunda_sexta.periodo1_fim
            }
          ];
          if (horarioTrabalho.segunda_sexta.periodo2_inicio && horarioTrabalho.segunda_sexta.periodo2_fim) {
            periodosTrabalho.push({
              inicio: horarioTrabalho.segunda_sexta.periodo2_inicio,
              fim: horarioTrabalho.segunda_sexta.periodo2_fim
            });
          }
        }
      }

      // Verificar se a reunião se encaixa em algum período de trabalho
      const reuniaoCabeNoPeriodo = periodosTrabalho.some(periodo => {
        return horarioInicioReuniao >= periodo.inicio && 
               horarioFimReuniao <= periodo.fim;
      });

      if (!reuniaoCabeNoPeriodo) {
        const periodosFormatados = periodosTrabalho
          .filter(p => p.inicio && p.fim)
          .map(p => `${p.inicio} às ${p.fim}`)
          .join(' e ');
        return { 
          valido: false, 
          motivo: `Reunião fora do horário de trabalho do vendedor. Horários disponíveis: ${periodosFormatados}` 
        };
      }

      return { valido: true };
    } catch (error) {
      console.error('Erro ao verificar horário de trabalho:', error);
      return { valido: false, motivo: 'Erro ao verificar horário de trabalho' };
    }
  }

  static async atualizarStatusLead(leadId: string, novoStatus: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: novoStatus })
        .eq('id', leadId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar status do lead:', error);
      throw error;
    }
  }

  static async buscarLeads(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, nome, email, whatsapp, status')
        .in('status', ['novo', 'em_andamento', 'contatado', 'qualificado'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      return [];
    }
  }

  static async atualizarStatusAgendamento(
    id: string, 
    status: string, 
    observacoes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          status, 
          observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do agendamento:', error);
      return false;
    }
  }

  static async atualizarAgendamentoSDR(
    id: string,
    dados: {
      data_agendamento?: string;
      data_fim_agendamento?: string;
      pos_graduacao_interesse?: string;
      observacoes?: string;
    }
  ): Promise<boolean> {
    try {
      // Validar se a nova data/hora é no futuro (se fornecida) - com margem de 5 minutos
      if (dados.data_agendamento) {
        const dataAgendamento = new Date(dados.data_agendamento);
        const agora = new Date();
        
        // Ajustar agora para horário brasileiro (UTC-3)
        const agoraBrasil = new Date(agora.getTime() - (3 * 60 * 60 * 1000));
        const cincoMinutosAtras = new Date(agoraBrasil.getTime() - 5 * 60 * 1000);
        
        if (dataAgendamento <= cincoMinutosAtras) {
          throw new Error('Não é possível agendar para uma data/hora que já passou');
        }

        // Buscar o vendedor do agendamento para verificar horário de trabalho
        const { data: agendamento, error: agendamentoError } = await supabase
          .from('agendamentos')
          .select('vendedor_id')
          .eq('id', id)
          .single();

        if (agendamentoError || !agendamento) {
          throw new Error('Agendamento não encontrado');
        }

        // Verificar horário de trabalho do vendedor
        const verificacaoHorario = await this.verificarHorarioTrabalho(
          agendamento.vendedor_id, 
          dados.data_agendamento, 
          dados.data_fim_agendamento
        );
        
        if (!verificacaoHorario.valido) {
          throw new Error(verificacaoHorario.motivo || 'Horário inválido');
        }

        // Verificar conflitos com eventos especiais
        const temConflitosEventos = await this.verificarConflitosEventosEspeciais(dados.data_agendamento, dados.data_fim_agendamento);
        if (temConflitosEventos) {
          throw new Error('Este horário está bloqueado por um evento especial/recorrente');
        }

        // Verificar conflitos de agenda (ignorando o próprio agendamento)
        const temConflito = await this.verificarConflitosAgenda(
          agendamento.vendedor_id,
          dados.data_agendamento,
          dados.data_fim_agendamento,
          id
        );
        if (temConflito) {
          throw new Error('Vendedor já possui agendamento neste horário');
        }
      }

      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          ...dados,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar agendamento (SDR):', error);
      
      if (error instanceof Error) {
        // Re-lançar o erro para mostrar a mensagem específica
        throw error;
      }
      
      throw new Error('Erro inesperado ao atualizar agendamento');
    }
  }

  static async cancelarAgendamento(id: string, motivo?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          status: 'cancelado',
          observacoes: motivo ? `Cancelado: ${motivo}` : 'Cancelado',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      return false;
    }
  }

  static async atualizarLinkReuniao(id: string, linkReuniao: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          link_reuniao: linkReuniao,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar link da reunião:', error);
      return false;
    }
  }

  static async verificarConflitosEventosEspeciais(dataAgendamento: string, dataFimAgendamento?: string): Promise<boolean> {
    try {
      console.log('🎯 ===== VERIFICANDO CONFLITOS COM EVENTOS ESPECIAIS =====');
      console.log('🎯 Dados recebidos:', {
        dataAgendamento,
        dataFimAgendamento
      });

      // Se não há data de fim, assumir 45 minutos
      const dataFim = dataFimAgendamento || new Date(new Date(dataAgendamento).getTime() + 45 * 60 * 1000).toISOString();
      
      console.log('🎯 Dados processados:', {
        dataInicio: dataAgendamento,
        dataFim: dataFim
      });

      // TESTE 1: Verificar se há eventos especiais na base
      const { data: todosEventos, error: errorTodos } = await supabase
        .from('eventos_especiais')
        .select('*');
        
      console.log('🎯 TESTE 1 - Todos os eventos na base:', todosEventos?.length || 0, todosEventos);
      
      if (errorTodos) {
        console.error('❌ Erro ao buscar todos os eventos:', errorTodos);
      }

      // TESTE 2: Verificar qual dia da semana é a data do agendamento
      const dataObj = new Date(dataAgendamento);
      const diaSemana = dataObj.getDay();
      console.log('🎯 TESTE 2 - Data do agendamento:', {
        dataOriginal: dataAgendamento,
        dataObj: dataObj.toISOString(),
        diaSemana: diaSemana,
        diaSemanaTexto: ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][diaSemana]
      });

      // Usar a função SQL para verificar conflitos
      console.log('🎯 TESTE 3 - Chamando função SQL com:', {
        data_inicio_agendamento: dataAgendamento,
        data_fim_agendamento: dataFim
      });
      
      const { data, error } = await supabase.rpc('verificar_conflito_evento_especial', {
        data_inicio_agendamento: dataAgendamento,
        data_fim_agendamento: dataFim
      });

      console.log('🎯 TESTE 4 - Resultado da função SQL:', { data, error });

      if (error) {
        console.error('❌ Erro ao verificar conflitos com eventos especiais:', error);
        // Em caso de erro, ser conservador e retornar true (conflito)
        return true;
      }

      console.log('🎯 RESULTADO FINAL:', data === true ? 'CONFLITO DETECTADO' : 'SEM CONFLITOS');
      console.log('🎯 ===============================================');
      return data === true;
    } catch (error) {
      console.error('❌ Erro na verificação de eventos especiais:', error);
      // Em caso de erro, ser conservador
      return true;
    }
  }

  static async atualizarAgendamentoDiretor(
    id: string,
    dados: {
      data_agendamento?: string;
      data_fim_agendamento?: string;
      pos_graduacao_interesse?: string;
      observacoes?: string;
      resultado_reuniao?: string;
      observacoes_resultado?: string;
    }
  ): Promise<boolean> {
    try {
      // Se está alterando a data, verificar conflitos
      if (dados.data_agendamento) {
        // Buscar o vendedor do agendamento
        const { data: agendamento, error: agendamentoError } = await supabase
          .from('agendamentos')
          .select('vendedor_id')
          .eq('id', id)
          .single();

        if (agendamentoError || !agendamento) {
          throw new Error('Agendamento não encontrado');
        }

        // Verificar conflitos com eventos especiais
        const temConflitosEventos = await this.verificarConflitosEventosEspeciais(dados.data_agendamento, dados.data_fim_agendamento);
        if (temConflitosEventos) {
          throw new Error('Este horário está bloqueado por um evento especial/recorrente');
        }

        // Verificar conflitos de agenda (ignorando o próprio agendamento)
        const temConflito = await this.verificarConflitosAgenda(
          agendamento.vendedor_id,
          dados.data_agendamento,
          dados.data_fim_agendamento,
          id
        );
        if (temConflito) {
          throw new Error('Vendedor já possui agendamento neste horário');
        }
      }

      const { error } = await supabase
        .from('agendamentos')
        .update({
          ...dados,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar agendamento (Diretor):', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Erro inesperado ao atualizar agendamento');
    }
  }
}