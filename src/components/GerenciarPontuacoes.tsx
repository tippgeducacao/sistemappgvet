
import React from 'react';
import { useScoring } from '@/hooks/useScoring';
import AddRuleDialog from '@/components/pontuacao/AddRuleDialog';
import RulesByField from '@/components/pontuacao/RulesByField';
import EmptyState from '@/components/pontuacao/EmptyState';
import { ScoringRule } from '@/services/scoringService';
import { useUserRoles } from '@/hooks/useUserRoles';

const GerenciarPontuacoes: React.FC = () => {
  const { isDiretor } = useUserRoles();
  const {
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
  } = useScoring();

  // Verificar se o usuário tem permissão (apenas diretor)
  const hasPermission = isDiretor;

  // Se não tiver permissão, mostrar mensagem de acesso negado
  if (!hasPermission) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta área. 
            Esta funcionalidade está disponível apenas para diretores.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">
              Apenas usuários com perfil de diretor podem gerenciar as regras de pontuação do sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Agrupar regras por campo
  const rulesByField = rules?.reduce((acc, rule) => {
    if (!acc[rule.campo_nome]) {
      acc[rule.campo_nome] = [];
    }
    acc[rule.campo_nome].push(rule);
    return acc;
  }, {} as Record<string, ScoringRule[]>);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-ppgvet-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando regras de pontuação...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Pontuações</h2>
          <p className="text-gray-600">Configure as regras de pontuação para as vendas</p>
        </div>
        
        <AddRuleDialog
          showAddDialog={showAddDialog}
          setShowAddDialog={setShowAddDialog}
          newRule={newRule}
          setNewRule={setNewRule}
          onAddRule={handleAddRule}
          isAdding={addMutation.isPending}
        />
      </div>

      <div className="space-y-6">
        {rulesByField && Object.keys(rulesByField).map((campo) => (
          <RulesByField
            key={campo}
            campo={campo}
            regras={rulesByField[campo]}
            editingId={editingId}
            editValue={editValue}
            onEditValueChange={setEditValue}
            onStartEdit={handleStartEdit}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onDelete={handleDelete}
            isUpdating={updateMutation.isPending}
            isDeleting={deleteMutation.isPending}
            canDelete={true}
          />
        ))}
      </div>

      {(!rulesByField || Object.keys(rulesByField).length === 0) && (
        <EmptyState onAddRule={() => setShowAddDialog(true)} />
      )}
    </div>
  );
};

export default GerenciarPontuacoes;
