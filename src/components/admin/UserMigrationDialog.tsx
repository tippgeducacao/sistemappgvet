import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, Users, ArrowRight } from 'lucide-react';
import { UserMigrationService, type MigrationResult } from '@/services/migration/UserMigrationService';
import { useToast } from '@/hooks/use-toast';

interface UserMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserMigrationDialog({ open, onOpenChange }: UserMigrationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [migrationCheck, setMigrationCheck] = useState<{ usersToMigrate: number; details: Array<{ name: string; courseCount: number }> } | null>(null);
  const { toast } = useToast();

  const checkMigration = async () => {
    setIsLoading(true);
    try {
      const result = await UserMigrationService.checkMigrationNeeded();
      setMigrationCheck(result);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao verificar usuários para migração",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeMigration = async () => {
    setIsLoading(true);
    try {
      const result = await UserMigrationService.migrateUsersToGroups();
      setMigrationResult(result);
      
      if (result.success) {
        toast({
          title: "Migração Concluída",
          description: `${result.migratedUsers} usuários migrados com sucesso`,
        });
      } else {
        toast({
          title: "Migração com Erros",
          description: `${result.migratedUsers} usuários migrados, ${result.errors.length} erros`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na Migração",
        description: "Erro durante a execução da migração",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialog = () => {
    setMigrationResult(null);
    setMigrationCheck(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Migração de Usuários para Grupos
          </DialogTitle>
          <DialogDescription>
            Migra usuários do sistema antigo (pós-graduações individuais) para o novo sistema de grupos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!migrationCheck && !migrationResult && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Clique para verificar quantos usuários precisam ser migrados.
              </p>
              <Button onClick={checkMigration} disabled={isLoading}>
                {isLoading ? "Verificando..." : "Verificar Migração"}
              </Button>
            </div>
          )}

          {migrationCheck && !migrationResult && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">
                    {migrationCheck.usersToMigrate} usuários precisam ser migrados
                  </span>
                </div>
                
                {migrationCheck.details.length > 0 && (
                  <ScrollArea className="h-32 mt-3">
                    <div className="space-y-2">
                      {migrationCheck.details.map((user, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{user.name}</span>
                          <Badge variant="outline">
                            {user.courseCount} pós-graduações
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">O que esta migração fará:</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    Converter IDs de cursos individuais para IDs de grupos
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    Respeitar o limite de 10 grupos por usuário
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    Manter apenas usuários que precisam de migração
                  </li>
                </ul>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetDialog}>
                  Cancelar
                </Button>
                <Button onClick={executeMigration} disabled={isLoading}>
                  {isLoading ? "Migrando..." : "Executar Migração"}
                </Button>
              </div>
            </div>
          )}

          {migrationResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${migrationResult.success ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {migrationResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    Migração {migrationResult.success ? 'Concluída' : 'Parcial'}
                  </span>
                </div>
                <p className="text-sm">
                  {migrationResult.migratedUsers} usuários migrados com sucesso
                </p>
              </div>

              {migrationResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    Erros ({migrationResult.errors.length}):
                  </h4>
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {migrationResult.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-700 dark:text-red-300">
                          {error}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => handleOpenChange(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}