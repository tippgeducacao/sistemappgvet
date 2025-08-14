import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/AuthStore';
import { toast } from 'sonner';

export interface Agendamento {
  id: string;
  lead_id: string;
  sdr_id: string;
  vendedor_id: string;
  data_agendamento: string;
  data_fim_agendamento?: string;
  pos_graduacao_interesse: string;
  link_reuniao: string;
  observacoes?: string;
  status: string;
  resultado_reuniao?: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou' | null;
  data_resultado?: string;
  observacoes_resultado?: string;
  created_at: string;
  updated_at: string;
  lead?: {
    nome: string;
    email?: string;
    whatsapp?: string;
  };
  sdr?: {
    name: string;
    email: string;
  };
  vendedor?: {
    name: string;
    email: string;
  };
}

export const useAgendamentos = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuthStore();

  const fetchAgendamentos = async () => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          leads (
            nome,
            email,
            whatsapp
          )
        `)
        .eq('vendedor_id', profile.id)
        .in('status', ['agendado', 'atrasado', 'realizado', 'remarcado']) // Incluir todos os status relevantes
        .order('data_agendamento', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        toast.error('Erro ao carregar agendamentos');
        return;
      }

      console.log('🔍 DADOS RETORNADOS DO SUPABASE:', JSON.stringify(data, null, 2));
      console.log('🔍 PRIMEIRO AGENDAMENTO:', data?.[0]);

      // Buscar dados dos SDRs separadamente
      const sdrIds = [...new Set((data || []).map(a => a.sdr_id).filter(Boolean))];
      console.log('🔍 SDR IDs ENCONTRADOS:', sdrIds);
      
      let sdrsData: any[] = [];
      if (sdrIds.length > 0) {
        const { data: sdrs, error: sdrError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', sdrIds);
        
        if (sdrError) {
          console.error('Erro ao buscar SDRs:', sdrError);
        } else {
          sdrsData = sdrs || [];
          console.log('🔍 DADOS DOS SDRS:', sdrsData);
        }
      }

      // Mapear os dados para o formato esperado
      const agendamentosMapeados = (data || []).map(agendamento => {
        const sdr = sdrsData.find(s => s.id === agendamento.sdr_id);
        console.log(`🔍 MAPEANDO AGENDAMENTO ${agendamento.id}:`, {
          sdr_id: agendamento.sdr_id,
          sdr_encontrado: sdr
        });
        
        return {
          ...agendamento,
          lead: agendamento.leads,
          sdr: sdr || null
        };
      });

      console.log('🔍 AGENDAMENTOS MAPEADOS:', agendamentosMapeados[0]);
      console.log('🔍 SDR MAPEADO:', agendamentosMapeados[0]?.sdr);

      setAgendamentos(agendamentosMapeados as Agendamento[]);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgendamentosCancelados = async () => {
    if (!profile?.id) return [];

    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          leads (
            nome,
            email,
            whatsapp
          )
        `)
        .eq('vendedor_id', profile.id)
        .eq('status', 'cancelado')
        .order('updated_at', { ascending: false })
        .limit(10); // Limitar a 10 cancelamentos mais recentes

      if (error) {
        console.error('Erro ao buscar agendamentos cancelados:', error);
        return [];
      }

      // Buscar dados dos SDRs separadamente
      const sdrIds = [...new Set((data || []).map(a => a.sdr_id).filter(Boolean))];
      
      let sdrsData: any[] = [];
      if (sdrIds.length > 0) {
        const { data: sdrs, error: sdrError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', sdrIds);
        
        if (!sdrError) {
          sdrsData = sdrs || [];
        }
      }

      // Mapear os dados para o formato esperado
      const agendamentosMapeados = (data || []).map(agendamento => {
        const sdr = sdrsData.find(s => s.id === agendamento.sdr_id);
        return {
          ...agendamento,
          lead: agendamento.leads,
          sdr: sdr || null
        };
      });

      return agendamentosMapeados as Agendamento[];
    } catch (error) {
      console.error('Erro ao buscar agendamentos cancelados:', error);
      return [];
    }
  };

  const atualizarResultadoReuniao = async (
    agendamentoId: string, 
    resultado: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou',
    observacoes?: string
  ) => {
    try {
      console.log('🔄 Iniciando atualização do resultado da reunião:', {
        agendamentoId,
        resultado,
        observacoes,
        userId: profile?.id,
        userEmail: profile?.email
      });

      // Usar status 'realizado' para qualquer resultado marcado pelo vendedor
      const novoStatus = 'realizado';

      const updateData = {
        resultado_reuniao: resultado,
        data_resultado: new Date().toISOString(),
        observacoes_resultado: observacoes || null,
        status: novoStatus
      };

      console.log('📝 Dados para atualização:', updateData);

      const { data, error } = await supabase
        .from('agendamentos')
        .update(updateData)
        .eq('id', agendamentoId)
        .select(); // Adicionar select para ver o que foi atualizado

      if (error) {
        console.error('❌ Erro ao atualizar resultado:', error);
        toast.error('Erro ao atualizar resultado da reunião');
        return false;
      }

      console.log('✅ Resultado atualizado com sucesso:', data);
      toast.success('Resultado da reunião atualizado com sucesso!');
      await fetchAgendamentos(); // Recarregar lista
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar resultado (catch):', error);
      toast.error('Erro ao atualizar resultado da reunião');
      return false;
    }
  };

  const marcarReuniaoComoComprou = async (agendamentoId: string): Promise<boolean> => {
    return await atualizarResultadoReuniao(
      agendamentoId, 
      'comprou', 
      'Venda cadastrada automaticamente pelo sistema'
    );
  };

  useEffect(() => {
    fetchAgendamentos();
  }, [profile?.id]);

  return {
    agendamentos,
    isLoading,
    fetchAgendamentos,
    fetchAgendamentosCancelados,
    atualizarResultadoReuniao,
    marcarReuniaoComoComprou
  };
};