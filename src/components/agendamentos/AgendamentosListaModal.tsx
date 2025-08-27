import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Eye } from 'lucide-react';
import { useAgendamentosPorVendedorSemana } from '@/hooks/useAgendamentosPorVendedorSemana';
import AgendamentoDetailsModal from './AgendamentoDetailsModal';
import LoadingState from '@/components/ui/loading-state';

interface AgendamentosListaModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendedorId: string;
  vendedorName: string;
  startDate: Date;
  endDate: Date;
  initialTab?: 'convertidas' | 'pendentes' | 'compareceram' | 'naoCompareceram';
}

export const AgendamentosListaModal: React.FC<AgendamentosListaModalProps> = ({
  isOpen,
  onClose,
  vendedorId,
  vendedorName,
  startDate,
  endDate,
  initialTab = 'convertidas'
}) => {
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [selectedAgendamento, setSelectedAgendamento] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { 
    convertidas, 
    pendentesReuniao, 
    pendentesPorVenda,
    compareceram, 
    naoCompareceram, 
    isLoading 
  } = useAgendamentosPorVendedorSemana(vendedorId, startDate, endDate);

  useEffect(() => {
    setSelectedTab(initialTab);
  }, [initialTab]);

  const handleViewDetails = (item: any) => {
    setSelectedAgendamento(item);
    setIsDetailsModalOpen(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const AgendamentoCard = ({ item, type }: { item: any; type: string }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatDate(item.data_agendamento)} às {formatTime(item.data_agendamento)}
              </span>
              {type === 'convertidas' && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Convertida
                </Badge>
              )}
              {type === 'pendentes' && (
                <Badge variant="secondary">
                  Pendente
                </Badge>
              )}
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              {item.leads && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>{item.leads.nome}</span>
                </div>
              )}
              
              {item.pos_graduacao_interesse && (
                <div>
                  <span className="font-medium">Interesse:</span> {item.pos_graduacao_interesse}
                </div>
              )}
              
              {item.resultado_reuniao && (
                <div>
                  <span className="font-medium">Resultado:</span> {item.resultado_reuniao}
                </div>
              )}
              
              {type === 'convertidas' && item.curso && (
                <div>
                  <span className="font-medium">Curso:</span> {item.curso.nome}
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(item)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const totalPendentes = pendentesReuniao.length + pendentesPorVenda.length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes das Reuniões - {vendedorName}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Período: {startDate.toLocaleDateString('pt-BR')} - {endDate.toLocaleDateString('pt-BR')}
            </p>
          </DialogHeader>

          {isLoading ? (
            <LoadingState message="Carregando detalhes..." />
          ) : (
            <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="convertidas">
                  Convertidas ({convertidas.length})
                </TabsTrigger>
                <TabsTrigger value="pendentes">
                  Pendentes ({totalPendentes})
                </TabsTrigger>
                <TabsTrigger value="compareceram">
                  Compareceram ({compareceram.length})
                </TabsTrigger>
                <TabsTrigger value="naoCompareceram">
                  Não Compareceram ({naoCompareceram.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="convertidas" className="mt-4">
                <div className="space-y-2">
                  {convertidas.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma venda convertida neste período
                    </p>
                  ) : (
                    convertidas.map((item) => (
                      <AgendamentoCard 
                        key={`convertida-${item.id}`} 
                        item={item} 
                        type="convertidas" 
                      />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pendentes" className="mt-4">
                <div className="space-y-2">
                  {totalPendentes === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma reunião pendente neste período
                    </p>
                  ) : (
                    <>
                      {pendentesReuniao.map((item) => (
                        <AgendamentoCard 
                          key={`pendente-reuniao-${item.id}`} 
                          item={item} 
                          type="pendentes" 
                        />
                      ))}
                      {pendentesPorVenda.map((item) => (
                        <AgendamentoCard 
                          key={`pendente-venda-${item.id}`} 
                          item={item} 
                          type="pendentes" 
                        />
                      ))}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="compareceram" className="mt-4">
                <div className="space-y-2">
                  {compareceram.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma reunião com comparecimento neste período
                    </p>
                  ) : (
                    compareceram.map((item) => (
                      <AgendamentoCard 
                        key={`compareceu-${item.id}`} 
                        item={item} 
                        type="compareceram" 
                      />
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="naoCompareceram" className="mt-4">
                <div className="space-y-2">
                  {naoCompareceram.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma ausência neste período
                    </p>
                  ) : (
                    naoCompareceram.map((item) => (
                      <AgendamentoCard 
                        key={`nao-compareceu-${item.id}`} 
                        item={item} 
                        type="naoCompareceram" 
                      />
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {selectedAgendamento && (
        <AgendamentoDetailsModal
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          agendamento={selectedAgendamento}
        />
      )}
    </>
  );
};