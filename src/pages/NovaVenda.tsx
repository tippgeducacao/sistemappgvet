
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import NovaVendaForm from '@/components/NovaVendaForm';
import { useAuthStore } from '@/stores/AuthStore';
import { useUserRoles } from '@/hooks/useUserRoles';

const NovaVenda: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuthStore();
  const { isAdmin, isVendedor } = useUserRoles();
  const editId = searchParams.get('edit');

  console.log('🔍 NovaVenda: Estado atual:', {
    currentUser: currentUser?.email,
    editId,
    isAdmin,
    isVendedor,
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

    // Se não é vendedor nem admin, não pode acessar
    if (!isVendedor && !isAdmin) {
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

  const handleCancel = () => {
    navigate('/');
  };

  if (!currentUser) {
    return null;
  }

  // Permitir acesso se for vendedor ou se for admin editando
  if (!isVendedor && !(isAdmin && editId)) {
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
