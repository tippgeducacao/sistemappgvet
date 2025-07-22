import { supabase } from '@/integrations/supabase/client';

export interface Agendamento {
  id: string;
  lead_id: string;
  vendedor_id: string;
  sdr_id: string;
  pos_graduacao_interesse: string;
  data_agendamento: string;
  data_fim_agendamento?: string;
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
    observacoes?: string;
  }): Promise<Agendamento | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Validar se a data/hora é no futuro
      const dataAgendamento = new Date(dados.data_agendamento);
      const agora = new Date();
      
      if (dataAgendamento <= agora) {
        throw new Error('Não é possível agendar para uma data/hora que já passou');
      }

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

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      return null;
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

  static async verificarConflitosAgenda(vendedorId: string, dataAgendamento: string): Promise<boolean> {
    try {
      const dataInicio = new Date(dataAgendamento);
      const dataFim = new Date(dataAgendamento);
      dataFim.setHours(dataFim.getHours() + 1); // Assumindo reuniões de 1 hora

      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, data_agendamento')
        .eq('vendedor_id', vendedorId)
        .eq('status', 'agendado')
        .gte('data_agendamento', dataInicio.toISOString())
        .lt('data_agendamento', dataFim.toISOString());

      if (error) throw error;
      
      return (data || []).length > 0; // Retorna true se há conflitos
    } catch (error) {
      console.error('Erro ao verificar conflitos de agenda:', error);
      return false;
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
      // Validar se a nova data/hora é no futuro (se fornecida)
      if (dados.data_agendamento) {
        const dataAgendamento = new Date(dados.data_agendamento);
        const agora = new Date();
        
        if (dataAgendamento <= agora) {
          throw new Error('Não é possível agendar para uma data/hora que já passou');
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
      return false;
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
}