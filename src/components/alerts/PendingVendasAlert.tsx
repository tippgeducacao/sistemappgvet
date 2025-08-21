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
      className="border-l-4 border-l-primary bg-primary/5 border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <AlertTriangle className="h-4 w-4 text-primary" />
      <AlertTitle className="text-foreground font-semibold">Atenção Secretaria</AlertTitle>
      <AlertDescription className="text-foreground/80">
        Há <span className="font-semibold text-primary">{vendasPendentes}</span> {vendasPendentes === 1 ? 'venda aguardando' : 'vendas aguardando'} análise e aprovação
      </AlertDescription>
    </Alert>
  );
};

export default PendingVendasAlert;