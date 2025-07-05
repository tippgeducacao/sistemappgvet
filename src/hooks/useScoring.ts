
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ScoringService, ScoringRule, NewScoringRule } from '@/services/scoringService';

export const useScoring = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [newRule, setNewRule] = useState<NewScoringRule>({
    campo_nome: '',
    opcao_valor: '',
    pontos: 0
  });
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['scoring-rules'],
    queryFn: ScoringService.fetchScoringRules
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, pontos }: { id: string; pontos: number }) => 
      ScoringService.updateScoringRule(id, pontos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-rules'] });
      setEditingId(null);
      toast({
        title: "Sucesso",
        description: "Pontuação atualizada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar pontuação: " + error.message,
        variant: "destructive",
      });
    }
  });

  const addMutation = useMutation({
    mutationFn: ScoringService.addScoringRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-rules'] });
      setNewRule({ campo_nome: '', opcao_valor: '', pontos: 0 });
      setShowAddDialog(false);
      toast({
        title: "Sucesso",
        description: "Nova regra adicionada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar regra: " + error.message,
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ScoringService.deleteScoringRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-rules'] });
      toast({
        title: "Sucesso",
        description: "Regra removida com sucesso",
      });
    },
    onError: (error: Error) => {
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
    rules,
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
