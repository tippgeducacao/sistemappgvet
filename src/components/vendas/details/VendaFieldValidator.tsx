import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertTriangle } from 'lucide-react';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
interface VendaFieldValidatorProps {
  campo: string;
  valor: string;
  pontos: number;
  status?: 'pendente' | 'aprovado' | 'rejeitado';
  observacao?: string;
  onStatusChange: (campo: string, status: 'aprovado' | 'rejeitado', observacao?: string) => void;
}
const VendaFieldValidator: React.FC<VendaFieldValidatorProps> = ({
  campo,
  valor,
  pontos,
  status,
  observacao,
  onStatusChange
}) => {
  const [localObservacao, setLocalObservacao] = useState(observacao || '');
  const [showObservacao, setShowObservacao] = useState(false);
  const handleApprove = () => {
    onStatusChange(campo, 'aprovado');
    setShowObservacao(false);
  };
  const handleReject = () => {
    setShowObservacao(true);
  };
  const handleSaveReject = () => {
    onStatusChange(campo, 'rejeitado', localObservacao);
    setShowObservacao(false);
  };
  const getStatusIcon = () => {
    switch (status) {
      case 'aprovado':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'rejeitado':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return;
    }
  };
  const getStatusColor = () => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-50 border-green-200';
      case 'rejeitado':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };
  return <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{campo}:</span>
            {getStatusIcon()}
            <Badge variant={pontos >= 0 ? "default" : "destructive"} className="ml-auto">
              {pontos >= 0 ? '+' : ''}{pontos} pts
            </Badge>
          </div>
          <p className="text-sm text-gray-700 mb-2">{valor}</p>
          
        </div>
      </div>

      {status === 'rejeitado' && observacao && <div className="bg-red-100 border border-red-200 rounded p-2 mb-3">
          <span className="text-xs font-medium text-red-800">Observação:</span>
          <p className="text-xs text-red-700">{observacao}</p>
        </div>}

      {showObservacao && <div className="space-y-2 mb-3">
          <Label htmlFor={`obs-${campo}`} className="text-xs">
            Motivo da rejeição:
          </Label>
          <Input id={`obs-${campo}`} value={localObservacao} onChange={e => setLocalObservacao(e.target.value)} placeholder="Digite o motivo..." className="text-xs" />
        </div>}

      <div className="flex gap-2">
        {status !== 'aprovado'}

        {status !== 'rejeitado' && !showObservacao}

        {showObservacao && <>
            <Button size="sm" variant="destructive" onClick={handleSaveReject} className="text-xs h-7" disabled={!localObservacao.trim()}>
              Confirmar Rejeição
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowObservacao(false)} className="text-xs h-7">
              Cancelar
            </Button>
          </>}
      </div>
    </div>;
};
export default VendaFieldValidator;