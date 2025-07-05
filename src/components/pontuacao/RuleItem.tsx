
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Save, X, Trash } from 'lucide-react';
import { RegrasPontuacao } from '@/types/pontuacao';

interface RuleItemProps {
  regra: RegrasPontuacao;
  isEditing: boolean;
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

const RuleItem: React.FC<RuleItemProps> = ({
  regra,
  isEditing,
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
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <span className="font-medium text-gray-900">{regra.opcao_valor}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Input
              type="number"
              value={editValue}
              onChange={(e) => onEditValueChange(Number(e.target.value))}
              className="w-20"
              min="0"
            />
            <Button
              size="sm"
              variant="default"
              onClick={onSaveEdit}
              disabled={isUpdating}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelEdit}
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <span className="font-semibold text-ppgvet-teal min-w-[3rem] text-right">
              {regra.pontos} pts
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStartEdit(regra.id, regra.pontos)}
              disabled={isUpdating}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(regra.id)}
                disabled={isDeleting}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RuleItem;
