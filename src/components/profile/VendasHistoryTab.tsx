import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Search, TrendingUp, DollarSign } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAllVendas } from '@/hooks/useVendas';
import type { DateRange } from 'react-day-picker';

interface VendasHistoryTabProps {
  userId: string;
}

const VendasHistoryTab: React.FC<VendasHistoryTabProps> = ({ userId }) => {
  const { vendas, isLoading } = useAllVendas();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Filtrar vendas do usuário
  const userVendas = useMemo(() => {
    if (!vendas) return [];
    
    return vendas.filter(venda => {
      if (venda.vendedor_id !== userId) return false;
      
      // Filtro por data
      if (dateRange?.from || dateRange?.to) {
        const vendaDate = new Date(venda.enviado_em);
        if (dateRange.from && vendaDate < dateRange.from) return false;
        if (dateRange.to && vendaDate > dateRange.to) return false;
      }
      
      // Filtro por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          venda.aluno?.nome.toLowerCase().includes(searchLower) ||
          venda.curso?.nome.toLowerCase().includes(searchLower) ||
          venda.status.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    }).sort((a, b) => new Date(b.enviado_em).getTime() - new Date(a.enviado_em).getTime());
  }, [vendas, userId, searchTerm, dateRange]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = userVendas.length;
    const matriculadas = userVendas.filter(v => v.status === 'matriculado').length;
    const pendentes = userVendas.filter(v => v.status === 'pendente').length;
    const rejeitadas = userVendas.filter(v => v.status === 'desistiu').length;
    
    const taxaConversao = total > 0 ? (matriculadas / total) * 100 : 0;
    const pontosTotais = userVendas.reduce((sum, v) => 
      sum + (v.pontuacao_validada || v.pontuacao_esperada || 0), 0
    );

    return {
      total,
      matriculadas,
      pendentes,
      rejeitadas,
      taxaConversao,
      pontosTotais
    };
  }, [userVendas]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matriculado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'desistiu': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'matriculado': return 'Matriculado';
      case 'pendente': return 'Pendente';
      case 'desistiu': return 'Desistiu';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total de Vendas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.matriculadas}</div>
                <div className="text-xs text-muted-foreground">Matriculadas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">
                  {stats.taxaConversao.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Taxa de Conversão</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-yellow-500 rounded-full" />
              <div>
                <div className="text-2xl font-bold">{stats.pontosTotais.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Pontos Totais</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por aluno, curso ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                "Filtrar por data"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
            />
            <div className="p-3 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setDateRange(undefined)}
              >
                Limpar Filtro
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Lista de vendas */}
      <div className="space-y-3">
        {userVendas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                Nenhuma venda encontrada com os filtros aplicados
              </div>
            </CardContent>
          </Card>
        ) : (
          userVendas.map((venda) => (
            <Card key={venda.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{venda.aluno?.nome || 'Nome não informado'}</h4>
                      <Badge className={getStatusColor(venda.status)}>
                        {getStatusLabel(venda.status)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Curso: {venda.curso?.nome || 'Curso não informado'}</div>
                      <div>
                        Data: {format(new Date(venda.enviado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                      {venda.data_aprovacao && (
                        <div>
                          Aprovado em: {format(new Date(venda.data_aprovacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {(venda.pontuacao_validada || venda.pontuacao_esperada || 0).toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">pontos</div>
                  </div>
                </div>

                {venda.observacoes && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      <strong>Observações:</strong> {venda.observacoes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default VendasHistoryTab;