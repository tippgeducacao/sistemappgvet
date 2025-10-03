import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Download, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  selectedLeadIds: string[];
  onClear: () => void;
  onDelete: () => void;
  onExport: () => void;
  isDeleting?: boolean;
  isExporting?: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  selectedLeadIds,
  onClear,
  onDelete,
  onExport,
  isDeleting = false,
  isExporting = false,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t shadow-lg animate-in slide-in-from-bottom-4">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Contador */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm font-semibold">
                {selectedCount} {selectedCount === 1 ? 'lead selecionado' : 'leads selecionados'}
              </Badge>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Botão Excluir */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting || isExporting}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Button>

              {/* Botão Exportar */}
              <Button
                variant="default"
                size="sm"
                onClick={onExport}
                disabled={isDeleting || isExporting}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exportando...' : 'Exportar'}
              </Button>

              {/* Botão Cancelar */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                disabled={isDeleting || isExporting}
                className="flex-1 sm:flex-none"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir <strong>{selectedCount}</strong>{' '}
              {selectedCount === 1 ? 'lead' : 'leads'} selecionado{selectedCount === 1 ? '' : 's'}?
              <br />
              <br />
              Esta ação não pode ser desfeita e irá remover permanentemente{' '}
              {selectedCount === 1 ? 'o lead' : 'os leads'} e todas as suas interações do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedCount === 1 ? 'Lead' : 'Leads'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
