import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Lock, Unlock, History, Download } from 'lucide-react';
import { useHistoricoMensal } from '@/hooks/useHistoricoMensal';
import { useUserRoles } from '@/hooks/useUserRoles';
import FechamentoMensalDialog from './FechamentoMensalDialog';

const HistoricoMensalManager: React.FC = () => {
  const { historicos, isLoadingHistoricos } = useHistoricoMensal();
  const { isDiretor, isAdmin } = useUserRoles();

  const canViewManager = isDiretor || isAdmin;

  if (!canViewManager) {
    return null;
  }

  // Gerar lista de meses dos últimos 12 meses para garantir que todos apareçam
  const hoje = new Date();
  const mesesParaExibir = [];
  
  for (let i = 0; i < 12; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const ano = data.getFullYear();
    const mes = data.getMonth() + 1;
    
    const historicoExistente = historicos.find(h => h.ano === ano && h.mes === mes);
    
    mesesParaExibir.push({
      ano,
      mes,
      historico: historicoExistente,
      isFechado: historicoExistente?.status === 'fechado',
      mesNome: data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Controle de Fechamento Mensal
        </CardTitle>
        <CardDescription>
          Gerencie o fechamento de meses para preservar histórico das planilhas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingHistoricos ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {mesesParaExibir.map(({ ano, mes, historico, isFechado, mesNome }) => (
              <div 
                key={`${ano}-${mes}`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {ano} - Mês {mes}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status */}
                  {isFechado ? (
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

                  {/* Data de fechamento */}
                  {historico?.data_fechamento && (
                    <div className="text-xs text-muted-foreground">
                      Fechado em {new Date(historico.data_fechamento).toLocaleDateString('pt-BR')}
                    </div>
                  )}

                  {/* Ação */}
                  <FechamentoMensalDialog ano={ano} mes={mes}>
                    <Button variant="outline" size="sm">
                      {isFechado ? 'Gerenciar' : 'Fechar Mês'}
                    </Button>
                  </FechamentoMensalDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Informações sobre o histórico */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Como funciona o histórico mensal?
              </div>
              <div className="text-blue-700 dark:text-blue-200 space-y-1">
                <p>• Meses <strong>abertos</strong> usam as regras e metas atuais do sistema</p>
                <p>• Meses <strong>fechados</strong> mantêm os dados como estavam no momento do fechamento</p>
                <p>• Alterações nas metas ou regras não afetam meses já fechados</p>
                <p>• Ideal para preservar histórico de comissionamento e performance</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricoMensalManager;