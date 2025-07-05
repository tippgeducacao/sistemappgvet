
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteVendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  vendaId: string;
  vendaNome?: string;
}

const DeleteVendaDialog: React.FC<DeleteVendaDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  vendaId,
  vendaNome
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const expectedText = 'EXCLUIR PERMANENTEMENTE';

  const handleConfirm = async () => {
    if (confirmationText === expectedText) {
      try {
        await onConfirm();
        onOpenChange(false);
        setConfirmationText('');
      } catch (error) {
        // Error handling is done in the hook
        console.error('Erro na confirmação de exclusão:', error);
      }
    }
  };

  const isConfirmationValid = confirmationText === expectedText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Venda Permanentemente
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A venda será completamente removida do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <strong>ATENÇÃO:</strong> Esta é uma exclusão permanente!
              <br />
              Todos os dados relacionados serão perdidos para sempre.
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm">
              <strong>Venda:</strong> {vendaNome || 'Nome não disponível'}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>ID:</strong> {vendaId.substring(0, 8)}...
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Para confirmar, digite: <code className="bg-gray-100 px-1 rounded text-sm font-mono">{expectedText}</code>
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Digite exatamente o texto acima"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isLoading}
          >
            {isLoading ? 'Excluindo...' : 'Excluir Permanentemente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteVendaDialog;
