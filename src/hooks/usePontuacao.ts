
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RegrasPontuacao, NewRule } from '@/types/pontuacao';

export const usePontuacao = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [newRule, setNewRule] = useState<NewRule>({
    campo_nome: '',
    opcao_valor: '',
    pontos: 0
  });
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Buscar regras de pontuação
  const { data: regras, isLoading } = useQuery({
    queryKey: ['regras-pontuacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regras_pontuacao')
        .select('*')
        .order('campo_nome', { ascending: true })
        .order('opcao_valor', { ascending: true });
      
      if (error) throw error;
      return data as RegrasPontuacao[];
    }
  });

  // Mutation para atualizar pontuação
  const updateMutation = useMutation({
    mutationFn: async ({ id, pontos }: { id: string; pontos: number }) => {
      const { error } = await supabase
        .from('regras_pontuacao')
        .update({ pontos })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regras-pontuacao'] });
      setEditingId(null);
      toast({
        title: "Sucesso",
        description: "Pontuação atualizada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar pontuação: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para adicionar nova regra
  const addMutation = useMutation({
    mutationFn: async (newRule: NewRule) => {
      const { error } = await supabase
        .from('regras_pontuacao')
        .insert([{
          campo_nome: newRule.campo_nome,
          opcao_valor: newRule.opcao_valor,
          pontos: newRule.pontos
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regras-pontuacao'] });
      setNewRule({ campo_nome: '', opcao_valor: '', pontos: 0 });
      setShowAddDialog(false);
      toast({
        title: "Sucesso",
        description: "Nova regra adicionada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar regra: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para deletar regra
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('regras_pontuacao')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regras-pontuacao'] });
      toast({
        title: "Sucesso",
        description: "Regra removida com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover regra: " + error.message,
        variant: "destructive",
      });
    }
  });

  const handleStartEdit = (id: string, currentValue: number) => {
    setEditingId(id);
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, pontos: editValue });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue(0);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta regra de pontuação?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddRule = () => {
    if (!newRule.campo_nome || !newRule.opcao_valor) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    addMutation.mutate(newRule);
  };

  return {
    regras,
    isLoading,
    editingId,
    editValue,
    setEditValue,
    newRule,
    setNewRule,
    showAddDialog,
    setShowAddDialog,
    updateMutation,
    addMutation,
    deleteMutation,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDelete,
    handleAddRule,
  };
};
