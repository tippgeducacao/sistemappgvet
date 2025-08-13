import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useMetas } from '@/hooks/useMetas';
import { useMetasHistoricas, useNiveisHistoricos } from '@/hooks/useHistoricoMensal';

interface MetasHistoryTabProps {
  userId: string;
  userType: string;
}

const MetasHistoryTab: React.FC<MetasHistoryTabProps> = ({ userId, userType }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  
  const { metas: metasMensais } = useMetas();
  const { metasSemanais } = useMetasSemanais();
  const { data: metasHistoricas } = useMetasHistoricas(selectedYear, selectedMonth);
  const { data: niveisHistoricos } = useNiveisHistoricos(selectedYear, selectedMonth);

  // Filtrar metas do usuário
  const userMetasMensais = metasMensais.filter(meta => meta.vendedor_id === userId);
  const userMetasSemanais = metasSemanais.filter(meta => meta.vendedor_id === userId);

  // Filtrar metas históricas do usuário se disponível
  const userMetasHistoricas = metasHistoricas?.filter(meta => meta.vendedor_id === userId) || [];

  const getStatusBadge = (metaAtual: number, metaAnterior?: number) => {
    if (!metaAnterior) {
      return <Badge variant="secondary"><Minus className="h-3 w-3 mr-1" />Primeira meta</Badge>;
    }
    
    if (metaAtual > metaAnterior) {
      return <Badge variant="destructive"><TrendingUp className="h-3 w-3 mr-1" />Aumentou</Badge>;
    } else if (metaAtual < metaAnterior) {
      return <Badge variant="default"><TrendingDown className="h-3 w-3 mr-1" />Diminuiu</Badge>;
    } else {
      return <Badge variant="secondary"><Minus className="h-3 w-3 mr-1" />Manteve</Badge>;
    }
  };

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Ano</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Mês (opcional)</label>
              <Select value={selectedMonth?.toString() || "all"} onValueChange={(value) => setSelectedMonth(value === "all" ? undefined : parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metas Mensais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Metas Mensais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userMetasMensais.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma meta mensal encontrada para este usuário.
            </div>
          ) : (
            <div className="space-y-4">
              {userMetasMensais
                .filter(meta => {
                  if (selectedMonth) {
                    return meta.ano === selectedYear && meta.mes === selectedMonth;
                  }
                  return meta.ano === selectedYear;
                })
                .sort((a, b) => {
                  if (a.ano !== b.ano) return b.ano - a.ano;
                  return b.mes - a.mes;
                })
                .map((meta, index, array) => {
                  const metaAnterior = array[index + 1];
                  return (
                    <div key={meta.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">
                            {months.find(m => m.value === meta.mes)?.label} {meta.ano}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Meta: {meta.meta_vendas} vendas
                          </p>
                        </div>
                        {getStatusBadge(meta.meta_vendas, metaAnterior?.meta_vendas)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Criado em: {new Date(meta.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metas Semanais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Histórico de Metas Semanais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userMetasSemanais.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma meta semanal encontrada para este usuário.
            </div>
          ) : (
            <div className="space-y-4">
              {userMetasSemanais
                .filter(meta => meta.ano === selectedYear)
                .sort((a, b) => {
                  if (a.ano !== b.ano) return b.ano - a.ano;
                  return b.semana - a.semana;
                })
                .slice(0, 20) // Limitar a 20 registros para melhor performance
                .map((meta, index, array) => {
                  const metaAnterior = array[index + 1];
                  return (
                    <div key={meta.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">
                            Semana {meta.semana} - {meta.ano}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Meta: {meta.meta_vendas} vendas
                          </p>
                        </div>
                        {getStatusBadge(meta.meta_vendas, metaAnterior?.meta_vendas)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Criado em: {new Date(meta.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metas Históricas (se disponível) */}
      {userMetasHistoricas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dados Históricos Fechados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userMetasHistoricas.map((meta) => (
                <div key={`${meta.vendedor_id}-${meta.ano}-${meta.semana}`} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">
                        Semana {meta.semana} - {meta.ano} (Histórico)
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Meta: {meta.meta_vendas} vendas
                      </p>
                    </div>
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      Período fechado
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dados históricos do período fechado
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MetasHistoryTab;