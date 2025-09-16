import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bug, RefreshCw, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { VendedorSelectionService, VendedorSelectionDebugInfo } from '@/services/vendedores/VendedorSelectionService';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VendedorSelectionDebugProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const VendedorSelectionDebug: React.FC<VendedorSelectionDebugProps> = ({
  isOpen,
  onOpenChange
}) => {
  const { isAdmin, isDiretor } = useUserRoles();
  const [debugLog, setDebugLog] = useState<VendedorSelectionDebugInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Apenas admins e diretores podem ver este debug
  if (!isAdmin && !isDiretor) {
    return null;
  }

  const loadDebugLog = () => {
    setLoading(true);
    try {
      const log = VendedorSelectionService.getDebugLog();
      setDebugLog(log);
      toast.success(`${log.length} registros de debug carregados`);
    } catch (error) {
      console.error('Erro ao carregar debug log:', error);
      toast.error('Erro ao carregar registros de debug');
    } finally {
      setLoading(false);
    }
  };

  const clearDebugLog = () => {
    VendedorSelectionService.clearDebugLog();
    setDebugLog([]);
    toast.success('Log de debug limpo');
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
    } catch {
      return timestamp;
    }
  };

  const renderDiagnostico = (diagnostico: any) => {
    if (!diagnostico) return null;

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Total Vendedores: <Badge variant="outline">{diagnostico.total_vendedores}</Badge></div>
          <div>Disponíveis: <Badge variant="outline">{diagnostico.vendedores_disponiveis}</Badge></div>
          <div>Fora Horário: <Badge variant="outline">{diagnostico.vendedores_fora_horario}</Badge></div>
          <div>Com Conflito: <Badge variant="outline">{diagnostico.vendedores_com_conflito}</Badge></div>
        </div>
        
        {diagnostico.agendamentos_por_vendedor && (
          <div className="mt-3">
            <h5 className="font-medium text-sm mb-2">Agendamentos por Vendedor:</h5>
            <div className="space-y-1">
              {diagnostico.agendamentos_por_vendedor.map((v: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span>{v.nome}</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {v.agendamentos_count} agend.
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {v.taxa_conversao.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bug className="h-4 w-4" />
          Debug Seleção
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug da Seleção Automática de Vendedores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                onClick={loadDebugLog} 
                disabled={loading}
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Carregar Log
              </Button>
              <Button 
                onClick={clearDebugLog} 
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Log
              </Button>
            </div>
            <Badge variant="outline">
              {debugLog.length} registros
            </Badge>
          </div>

          <ScrollArea className="h-[500px]">
            {debugLog.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum registro de debug encontrado.</p>
                    <p className="text-sm">Clique em "Carregar Log" para atualizar.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {debugLog.map((entry, index) => (
                  <Card key={index} className={entry.divergencia_detectada ? 'border-red-200' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {entry.divergencia_detectada ? (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {entry.user_name}
                          </CardTitle>
                          <CardDescription>
                            {formatTimestamp(entry.timestamp)}
                          </CardDescription>
                        </div>
                        {entry.divergencia_detectada && (
                          <Badge variant="destructive">Divergência</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Tabs defaultValue="resultado">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="resultado">Resultado</TabsTrigger>
                          <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
                          <TabsTrigger value="input">Input</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="resultado" className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Resultado do Banco:</h4>
                              <div className="space-y-1 text-sm">
                                <div>
                                  Vendedor: <Badge variant="outline">
                                    {entry.resultado_database.vendedor_nome || 'NENHUM'}
                                  </Badge>
                                </div>
                                <div>
                                  Agendamentos: <Badge variant="secondary">
                                    {entry.resultado_database.agendamentos_ativos}
                                  </Badge>
                                </div>
                                <div>
                                  Taxa Conversão: <Badge variant="outline">
                                    {entry.resultado_database.taxa_conversao.toFixed(1)}%
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            {entry.resultado_frontend && (
                              <div>
                                <h4 className="font-medium mb-2">Resultado Frontend:</h4>
                                <div className="space-y-1 text-sm">
                                  <div>
                                    Vendedor: <Badge variant="outline">
                                      {entry.resultado_frontend.vendedor?.name || 'NENHUM'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="diagnostico">
                          {renderDiagnostico(entry.resultado_database.diagnostico)}
                        </TabsContent>
                        
                        <TabsContent value="input" className="space-y-3">
                          <div>
                            <h4 className="font-medium mb-2">Vendedores de Entrada:</h4>
                            <div className="flex flex-wrap gap-1">
                              {entry.vendedores_input.map((v, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {v.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Horário:</h4>
                            <div className="text-sm space-y-1">
                              <div>Início: {entry.data_agendamento}</div>
                              <div>Fim: {entry.data_fim_agendamento}</div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VendedorSelectionDebug;