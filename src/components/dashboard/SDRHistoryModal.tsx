import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, TrendingUp, Award, BookOpen } from 'lucide-react';
import { useSDRHistory } from '@/hooks/useSDRHistory';

interface SDRHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SDRHistoryModal: React.FC<SDRHistoryModalProps> = ({ isOpen, onClose }) => {
  const {
    sdrs,
    selectedSDR,
    setSelectedSDR,
    selectedPeriodType,
    setSelectedPeriodType,
    historyData,
    statistics,
    formatPeriodLabel
  } = useSDRHistory();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Histórico de Pontuação SDR
          </DialogTitle>
          <DialogDescription>
            Acompanhe o desempenho histórico dos SDRs baseado em vendas de cursos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">SDR</label>
              <Select value={selectedSDR} onValueChange={setSelectedSDR}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um SDR" />
                </SelectTrigger>
                <SelectContent>
                  {sdrs.map(sdr => (
                    <SelectItem key={sdr.id} value={sdr.id}>
                      {sdr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={selectedPeriodType} onValueChange={(value: 'semana' | 'mes' | 'ano') => setSelectedPeriodType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Por Semana</SelectItem>
                  <SelectItem value="mes">Por Mês</SelectItem>
                  <SelectItem value="ano">Por Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSDR && (
            <>
              {/* Estatísticas Gerais */}
              {statistics && (
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="text-2xl font-bold">{statistics.totalPontos}</p>
                          <p className="text-xs text-muted-foreground">Total de Pontos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{statistics.mediaPorPeriodo}</p>
                          <p className="text-xs text-muted-foreground">Média por Período</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">{statistics.melhorPeriodo.pontos}</p>
                          <p className="text-xs text-muted-foreground">Melhor Período</p>
                          <p className="text-xs text-muted-foreground">{statistics.melhorPeriodo.periodo}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-2xl font-bold">{statistics.totalPeriodos}</p>
                          <p className="text-xs text-muted-foreground">Períodos Ativos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Histórico Detalhado */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico Detalhado</CardTitle>
                  <CardDescription>
                    Vendas e pontuação por {selectedPeriodType}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {historyData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma venda encontrada para este SDR
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {historyData.map((periodData, index) => (
                          <div key={periodData.periodo} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold">
                                {formatPeriodLabel(periodData.periodo, selectedPeriodType)}
                              </h4>
                              <Badge variant="secondary" className="font-bold">
                                {periodData.pontosVendas} pontos
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              {periodData.vendas.map((venda, vendaIndex) => (
                                <div key={venda.id}>
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex-1">
                                      <p className="font-medium">{venda.alunoNome}</p>
                                      <p className="text-muted-foreground">{venda.curso}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium text-green-600">+{venda.pontos} pt</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(venda.data).toLocaleDateString('pt-BR')}
                                      </p>
                                    </div>
                                  </div>
                                  {vendaIndex < periodData.vendas.length - 1 && (
                                    <Separator className="mt-2" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}

          {!selectedSDR && (
            <div className="text-center py-12 text-muted-foreground">
              Selecione um SDR para visualizar o histórico
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SDRHistoryModal;