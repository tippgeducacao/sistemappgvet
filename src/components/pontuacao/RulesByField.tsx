
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RuleItem from './RuleItem';
import { RegrasPontuacao } from '@/types/pontuacao';

interface RulesByFieldProps {
  campo: string;
  regras: RegrasPontuacao[];
  editingId: string | null;
  editValue: number;
  onEditValueChange: (value: number) => void;
  onStartEdit: (id: string, currentValue: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  canDelete?: boolean;
}

const RulesByField: React.FC<RulesByFieldProps> = ({
  campo,
  regras,
  editingId,
  editValue,
  onEditValueChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  isUpdating,
  isDeleting,
  canDelete = false
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg capitalize">{campo.replace('_', ' ')}</CardTitle>
        <CardDescription>
          Regras de pontuação para o campo "{campo}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {regras.map((regra) => (
            <RuleItem
              key={regra.id}
              regra={regra}
              isEditing={editingId === regra.id}
              editValue={editValue}
              onEditValueChange={onEditValueChange}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={onDelete}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
              canDelete={canDelete}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RulesByField;
