
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface RejectVendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (motivo: string) => void;
  isLoading?: boolean;
  vendaNome?: string;
}

const RejectVendaDialog: React.FC<RejectVendaDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  vendaNome
}) => {
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    if (motivo.trim()) {
      onConfirm(motivo.trim());
      setMotivo(''); // Limpar o campo após confirmação
    }
  };

  const handleCancel = () => {
    setMotivo(''); // Limpar o campo ao cancelar
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <X className="h-5 w-5" />
            Rejeitar Venda
          </DialogTitle>
          <DialogDescription>
            {vendaNome ? (
              <>Você está rejeitando a venda de <strong>{vendaNome}</strong>. Por favor, informe o motivo da rejeição.</>
            ) : (
              <>Por favor, informe o motivo da rejeição desta venda.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="motivo">Motivo da Rejeição *</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Documentação incompleta, dados incorretos, não atende aos critérios..."
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Este motivo será enviado ao vendedor para que ele possa fazer as correções necessárias.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !motivo.trim()}
          >
            {isLoading ? 'Rejeitando...' : 'Confirmar Rejeição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectVendaDialog;
