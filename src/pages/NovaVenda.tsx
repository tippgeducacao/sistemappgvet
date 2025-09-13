
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import NovaVendaForm from '@/components/NovaVendaForm';
import { useAuthStore } from '@/stores/AuthStore';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useFormStore } from '@/store/FormStore';
import { supabase } from '@/integrations/supabase/client';

const NovaVenda: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuthStore();
  const { isAdmin, isVendedor, isSDR } = useUserRoles();
  const editId = searchParams.get('edit');
  const agendamentoId = searchParams.get('agendamentoId');

  const { updateField } = useFormStore();

  console.log('🔍 NovaVenda: Estado atual:', {
    currentUser: currentUser?.email,
    editId,
    agendamentoId,
    isAdmin,
    isVendedor,
    isSDR,
    userType: currentUser?.user_type
  });

  useEffect(() => {
    if (!currentUser) {
      console.log('❌ NovaVenda: Usuário não logado');
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você precisa estar logado para acessar esta página."
      });
      navigate('/auth');
      return;
    }

    // Se for admin e não tem editId, não deve acessar
    if (isAdmin && !editId) {
      console.log('❌ NovaVenda: Admin tentando criar nova venda');
      toast({
        variant: "destructive", 
        title: "Acesso negado",
        description: "Apenas vendedores podem cadastrar novas vendas. Administradores gerenciam as vendas existentes."
      });
      navigate('/');
      return;
    }

    // Se não é vendedor, admin nem SDR, não pode acessar
    if (!isVendedor && !isAdmin && !isSDR) {
      console.log('❌ NovaVenda: Usuário sem permissão');
      toast({
        variant: "destructive",
        title: "Acesso negado", 
        description: "Você não tem permissão para acessar esta página."
      });
      navigate('/');
      return;
    }

    console.log('✅ NovaVenda: Acesso permitido');
  }, [currentUser, isAdmin, isVendedor, navigate, toast, editId]);

  // Effect para carregar dados do agendamento quando fornecido via URL
  useEffect(() => {
    const loadAgendamentoData = async () => {
      if (!agendamentoId || !currentUser?.id) return;

      try {
        console.log('🔍 Carregando dados do agendamento:', agendamentoId);
        
        const { data: agendamento, error } = await supabase
          .from('agendamentos')
          .select(`
            id,
            sdr_id,
            vendedor_id,
            leads (
              nome,
              email,
              whatsapp
            )
          `)
          .eq('id', agendamentoId)
          .single();

        if (error) {
          console.error('❌ Erro ao buscar agendamento:', error);
          toast({
            variant: "destructive",
            title: "Erro ao carregar agendamento",
            description: "Não foi possível carregar os dados da reunião."
          });
          return;
        }

        if (!agendamento) {
          console.warn('⚠️ Agendamento não encontrado:', agendamentoId);
          return;
        }

        console.log('✅ Agendamento carregado:', agendamento);

        // Atualizar FormStore com os dados
        updateField('agendamentoId', agendamentoId);
        
        if (agendamento.sdr_id) {
          updateField('sdrId', agendamento.sdr_id);
        }

        // Pre-preencher dados do lead se disponível
        if (agendamento.leads) {
          if (agendamento.leads.nome) {
            updateField('nomeAluno', agendamento.leads.nome);
          }
          if (agendamento.leads.email) {
            updateField('emailAluno', agendamento.leads.email);
          }
          if (agendamento.leads.whatsapp) {
            updateField('telefone', agendamento.leads.whatsapp);
          }
        }

        toast({
          title: "Dados da reunião carregados",
          description: "As informações do lead foram pré-preenchidas automaticamente."
        });

      } catch (error) {
        console.error('❌ Erro ao carregar agendamento:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro inesperado ao carregar dados da reunião."
        });
      }
    };

    loadAgendamentoData();
  }, [agendamentoId, currentUser?.id, updateField, toast]);

  const handleCancel = () => {
    // Se veio de um agendamento, volta para reuniões, senão vai para home
    navigate(agendamentoId ? '/reunioes' : '/');
  };

  if (!currentUser) {
    return null;
  }

  // Permitir acesso se for vendedor, SDR ou se for admin editando
  if (!isVendedor && !isSDR && !(isAdmin && editId)) {
    console.log('❌ NovaVenda: Bloqueando renderização do componente');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <NovaVendaForm 
        onCancel={handleCancel}
        editId={editId}
      />
    </div>
  );
};

export default NovaVenda;
