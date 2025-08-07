import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSDRComissionamentoTodosSemanal } from '@/hooks/useSDRComissionamento';
import { Calendar, Users, Target, DollarSign } from 'lucide-react';

export const SDRComissionamentoSemanal = () => {
  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(
    Math.ceil(((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (24 * 60 * 60 * 1000) + new Date(new Date().getFullYear(), 0, 1).getDay()) / 7)
  );

  const { data: comissionamentoData, isLoading } = useSDRComissionamentoTodosSemanal(selectedYear, selectedWeek);

  const getStatusBadge = (percentual: number) => {
    if (percentual >= 100) {
      return <Badge variant="default" className="bg-success text-success-foreground">Meta Atingida</Badge>;
    } else if (percentual >= 71) {
      return <Badge variant="secondary" className="bg-warning text-warning-foreground">Comissão Desbloqueada</Badge>;
    } else {
      return <Badge variant="destructive">Comissão Bloqueada</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Comissionamento SDRs - Semana {selectedWeek}/{selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalComissao = comissionamentoData?.reduce((sum, sdr) => sum + sdr.valorComissao, 0) || 0;
  const totalReunioes = comissionamentoData?.reduce((sum, sdr) => sum + sdr.reunioesRealizadas, 0) || 0;
  const totalMeta = comissionamentoData?.reduce((sum, sdr) => sum + sdr.metaSemanalReunioes, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Comissionamento SDRs por Reuniões
        </CardTitle>
        <div className="flex gap-4 items-center">
          <Select value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Semana" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                <SelectItem key={week} value={week.toString()}>
                  Semana {week}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Semana {selectedWeek}/{selectedYear}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {comissionamentoData?.length || 0} SDRs
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {totalReunioes}/{totalMeta} reuniões
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {formatCurrency(totalComissao)} total
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comissionamentoData?.map((sdr) => (
            <div key={sdr.sdrId} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{sdr.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {sdr.nivel} • {sdr.tipoUsuario}
                  </p>
                </div>
                {getStatusBadge(sdr.percentualAtingimento)}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Reuniões</p>
                  <p className="font-medium">{sdr.reunioesRealizadas}/{sdr.metaSemanalReunioes}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Atingimento</p>
                  <p className="font-medium">{sdr.percentualAtingimento}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Multiplicador</p>
                  <p className="font-medium">{sdr.multiplicador}x</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Variável Semanal</p>
                  <p className="font-medium">{formatCurrency(sdr.variabelSemanal)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Comissão</p>
                  <p className="font-medium text-primary">{formatCurrency(sdr.valorComissao)}</p>
                </div>
              </div>
              
              {/* Barra de progresso */}
              <div className="mt-3">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      sdr.percentualAtingimento >= 100 ? 'bg-success' :
                      sdr.percentualAtingimento >= 71 ? 'bg-warning' : 'bg-destructive'
                    }`}
                    style={{ width: `${Math.min(sdr.percentualAtingimento, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {(!comissionamentoData || comissionamentoData.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum SDR encontrado para a semana selecionada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};