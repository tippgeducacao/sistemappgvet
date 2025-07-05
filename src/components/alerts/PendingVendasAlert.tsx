
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useUserRoles } from '@/hooks/useUserRoles';

const PendingVendasAlert: React.FC = () => {
  const { vendas, isLoading } = useAllVendas();
  const { isAdmin, isSecretaria } = useUserRoles();

  // Só mostrar para admin/secretaria
  if (!isAdmin && !isSecretaria) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  const vendasPendentes = vendas.filter(v => v.status === 'pendente');
  
  if (vendasPendentes.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-red-800 font-medium">
        <strong>ATENÇÃO SECRETARIA:</strong> Há {vendasPendentes.length} {vendasPendentes.length === 1 ? 'venda aguardando' : 'vendas aguardando'} análise e aprovação
      </AlertDescription>
    </Alert>
  );
};

export default PendingVendasAlert;
