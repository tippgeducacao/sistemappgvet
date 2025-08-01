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
      console.log('  - Agora:', agora.toISOString());
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
        ...dados,
        sdr_id: user.id
      });

      const { data, error } = await supabase
        .from('agendamentos')
        .insert({
          ...dados,
          sdr_id: user.id
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

      // Buscar vendedores que têm essa pós-graduação
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, pos_graduacoes, horario_trabalho')
        .eq('user_type', 'vendedor')
        .eq('ativo', true);

      if (error) throw error;
      
      // Filtrar vendedores que têm a pós-graduação no portfolio
      const vendedoresFiltrados = (data || []).filter(vendedor => {
        return vendedor.pos_graduacoes && 
               vendedor.pos_graduacoes.includes(cursoId);
      });

      console.log('🔍 Vendedores encontrados para', posGraduacao, '(ID:', cursoId, '):', vendedoresFiltrados);
      return vendedoresFiltrados;
    } catch (error) {
      console.error('Erro ao buscar vendedores por pós-graduação:', error);
      return [];
    }
  }

  static async verificarConflitosAgenda(vendedorId: string, dataAgendamento: string, dataFimAgendamento?: string): Promise<boolean> {
    try {
      const dataInicio = new Date(dataAgendamento);
      const dataFim = dataFimAgendamento 
        ? new Date(dataFimAgendamento)
        : new Date(new Date(dataAgendamento).getTime() + 45 * 60 * 1000); // +45 minutos se não informado

      // Buscar TODOS os agendamentos do vendedor para detectar conflitos
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, data_agendamento, data_fim_agendamento')
        .eq('vendedor_id', vendedorId)
        .in('status', ['agendado', 'atrasado', 'finalizado', 'finalizado_venda'])
        .gte('data_agendamento', dataInicio.toISOString().split('T')[0] + 'T00:00:00') // Dia todo
        .lt('data_agendamento', dataInicio.toISOString().split('T')[0] + 'T23:59:59');

      if (error) throw error;
      
      // Verificar sobreposição de horários
      for (const agendamento of data || []) {
        const agendamentoInicio = new Date(agendamento.data_agendamento);
        const agendamentoFim = agendamento.data_fim_agendamento 
          ? new Date(agendamento.data_fim_agendamento)
          : new Date(agendamentoInicio.getTime() + 45 * 60 * 1000); // +45 minutos se não tem fim definido
        
        // Verificar se há sobreposição
        if (dataInicio < agendamentoFim && dataFim > agendamentoInicio) {
          console.log('⚠️ Conflito detectado:', {
            novoAgendamento: { inicio: dataInicio, fim: dataFim },
            agendamentoExistente: { inicio: agendamentoInicio, fim: agendamentoFim }
          });
          return true;
        }
      }
      
      return false; // Sem conflitos
    } catch (error) {
      console.error('Erro ao verificar conflitos de agenda:', error);
      return false;
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
        const cincoMinutosAtras = new Date(agora.getTime() - 5 * 60 * 1000);
        
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
}