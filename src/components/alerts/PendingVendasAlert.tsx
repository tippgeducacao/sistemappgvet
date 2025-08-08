import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    <Alert
      variant="default"
      className="relative border border-primary/40 bg-primary/10 dark:bg-primary/15 shadow-sm"
    >
      <AlertTriangle className="h-4 w-4 text-primary animate-pulse" />
      <AlertTitle className="text-foreground font-semibold">Atenção Secretaria</AlertTitle>
      <AlertDescription className="text-foreground">
        Há {vendasPendentes} {vendasPendentes === 1 ? 'venda aguardando' : 'vendas aguardando'} análise e aprovação
      </AlertDescription>
    </Alert>
  );
};

export default PendingVendasAlert;