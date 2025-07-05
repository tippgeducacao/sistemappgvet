
import React from 'react';
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
import { useDeleteLead } from '@/hooks/useDeleteLead';
import type { Lead } from '@/hooks/useLeads';

interface DeleteLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteLeadDialog: React.FC<DeleteLeadDialogProps> = ({
  lead,
  open,
  onOpenChange,
}) => {
  const { deleteLead, isDeleting } = useDeleteLead();

  const handleDelete = async () => {
    if (!lead) return;
    
    try {
      await deleteLead(lead.id);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
      console.error('Erro na exclusão:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o lead <strong>{lead?.nome}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita e também removerá todas as interações 
            relacionadas a este lead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteLeadDialog;
