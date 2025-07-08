import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useUserRoles } from '@/hooks/useUserRoles';

const PendingVendasAlert: React.FC = () => {
  const { vendas } = useAllVendas();
  const { isAdmin, isSecretaria } = useUserRoles();

  // Apenas mostrar para admin e secretaria
  if (!isAdmin && !isSecretaria) {
    return null;
  }

  const vendasPendentes = vendas.filter(venda => venda.status === 'pendente').length;

  if (vendasPendentes === 0) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <span className="font-semibold">ATENÇÃO SECRETARIA:</span> Há {vendasPendentes} {vendasPendentes === 1 ? 'venda aguardando' : 'vendas aguardando'} análise e aprovação
      </AlertDescription>
    </Alert>
  );
};

export default PendingVendasAlert;