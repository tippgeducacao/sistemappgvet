import { supabase } from '@/integrations/supabase/client';

export interface Agendamento {
  id: string;
  lead_id: string;
  vendedor_id: string;
  sdr_id: string;
  pos_graduacao_interesse: string;
  data_agendamento: string;
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
    observacoes?: string;
  }): Promise<Agendamento | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, pos_graduacoes, horario_trabalho')
        .eq('user_type', 'vendedor')
        .eq('ativo', true);

      if (error) throw error;
      
      // Filtrar vendedores que têm a pós-graduação no portfolio
      const vendedoresFiltrados = (data || []).filter(vendedor => {
        return vendedor.pos_graduacoes && 
               vendedor.pos_graduacoes.includes(posGraduacao);
      });

      console.log('🔍 Vendedores encontrados para', posGraduacao, ':', vendedoresFiltrados);
      return vendedoresFiltrados;
    } catch (error) {
      console.error('Erro ao buscar vendedores por pós-graduação:', error);
      return [];
    }
  }

  static async buscarLeads(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, nome, email, whatsapp, status')
        .in('status', ['novo', 'em_andamento'])
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
}