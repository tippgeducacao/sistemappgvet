import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Lock, Unlock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useHistoricoMensal, useMesFechado } from '@/hooks/useHistoricoMensal';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';

interface FechamentoMensalDialogProps {
  ano: number;
  mes: number;
  children: React.ReactNode;
}

const FechamentoMensalDialog: React.FC<FechamentoMensalDialogProps> = ({
  ano,
  mes,
  children
}) => {
  const { 
    fecharMes, 
    reabrirMes, 
    isFecharMesLoading, 
    isReabrirMesLoading 
  } = useHistoricoMensal();
  
  const { data: isFechado, isLoading: isLoadingStatus } = useMesFechado(ano, mes);
  const { isDiretor, isAdmin } = useUserRoles();

  const canManageMonth = isDiretor || isAdmin;
  const canReopen = isDiretor; // Apenas diretores podem reabrir

  const handleFecharMes = () => {
    if (!canManageMonth) {
      toast.error('Você não tem permissão para fechar meses.');
      return;
    }

    fecharMes({ ano, mes });
  };

  const handleReabrirMes = () => {
    if (!canReopen) {
      toast.error('Apenas diretores podem reabrir meses.');
      return;
    }

    reabrirMes({ ano, mes });
  };

  const mesNome = new Date(ano, mes - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Controle Mensal
          </DialogTitle>
          <DialogDescription>
            Gerencie o fechamento do mês de {mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status atual */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Status do Mês</CardTitle>
                {isLoadingStatus ? (
                  <Badge variant="secondary">Carregando...</Badge>
                ) : isFechado ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Fechado
                  </Badge>
                ) : (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Unlock className="h-3 w-3" />
                    Aberto
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription>
                {isFechado 
                  ? 'Os dados deste mês estão salvos historicamente e não serão afetados por mudanças nas regras atuais.'
                  : 'Este mês está aberto e utilizará as regras e metas atuais do sistema.'
                }
              </CardDescription>
            </CardContent>
          </Card>

          {/* Informações importantes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Ao fechar o mês, um snapshot dos dados atuais será salvo</p>
                <p>• Mudanças futuras nas metas/regras não afetarão este mês</p>
                <p>• Apenas diretores podem reabrir meses fechados</p>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          {canManageMonth && (
            <div className="flex gap-2">
              {!isFechado ? (
                <Button 
                  onClick={handleFecharMes}
                  disabled={isFecharMesLoading}
                  className="flex-1"
                >
                  {isFecharMesLoading ? (
                    'Fechando...'
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Fechar Mês
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-green-600 flex-1">
                    <CheckCircle className="h-4 w-4" />
                    Mês fechado com sucesso
                  </div>
                  
                  {canReopen && (
                    <Button 
                      variant="outline"
                      onClick={handleReabrirMes}
                      disabled={isReabrirMesLoading}
                    >
                      {isReabrirMesLoading ? (
                        'Reabrindo...'
                      ) : (
                        <>
                          <Unlock className="h-4 w-4 mr-2" />
                          Reabrir
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {!canManageMonth && (
            <div className="text-sm text-muted-foreground text-center py-2">
              Você não tem permissão para gerenciar fechamentos mensais.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FechamentoMensalDialog;