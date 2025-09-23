import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Search, Download, Eye, Grid, List } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import VendaDetailsDialog from '@/components/vendas/VendaDetailsDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAllVendas } from '@/hooks/useVendas';
import type { DateRange } from 'react-day-picker';
import * as XLSX from 'xlsx';

interface VendasHistoryTabProps {
  userId: string;
  userType: string;
}

const VendasHistoryTab: React.FC<VendasHistoryTabProps> = ({ userId, userType }) => {
  const { vendas, isLoading } = useAllVendas();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedVenda, setSelectedVenda] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Filtrar vendas do usuário
  const filteredVendas = useMemo(() => {
    if (!vendas) return [];
    
    return vendas.filter(venda => {
      // Filtrar por vendedor
      if (venda.vendedor_id !== userId) return false;
      
      // Filtrar por período
      if (dateRange?.from || dateRange?.to) {
        const vendaDate = new Date(venda.enviado_em);
        if (dateRange.from && vendaDate < dateRange.from) return false;
        if (dateRange.to && vendaDate > dateRange.to) return false;
      }
      
      // Filtro por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          venda.aluno?.nome?.toLowerCase().includes(searchLower) ||
          venda.curso?.nome?.toLowerCase().includes(searchLower) ||
          venda.status?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [vendas, userId, searchTerm, dateRange]);

  // Exportar para Excel
  const exportToExcel = () => {
    const data = filteredVendas.map(venda => ({
      'Data Envio': format(new Date(venda.enviado_em), 'dd/MM/yyyy'),
      'Aluno': venda.aluno?.nome || 'Não informado',
      'Curso': venda.curso?.nome || 'Não informado',
      'Status': venda.status,
      'Pontuação Esperada': venda.pontuacao_esperada || 0,
      'Pontuação Validada': venda.pontuacao_validada || 0,
      'Observações': venda.observacoes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico de Vendas');
    
    const filename = `historico_vendas_${userId}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matriculado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      {/* Filtros, Alternância de Visualização e Exportação */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
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
                  "Filtrar por período"
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

        <div className="flex gap-2">
          <div className="flex border rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="px-3"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={exportToExcel} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Lista de vendas */}
      {filteredVendas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              Nenhuma venda encontrada para os filtros selecionados
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Aprovado</TableHead>
                  <TableHead>Pontuação</TableHead>
                  <TableHead>Validada</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendas.map((venda) => (
                  <TableRow key={venda.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {venda.aluno?.nome || 'Não informado'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {venda.aluno?.email || 'Não informado'}
                    </TableCell>
                    <TableCell>
                      {venda.curso?.nome || 'Não informado'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(venda.status)}>
                        {venda.status === 'matriculado' ? 'Matriculado' : 
                         venda.status === 'pendente' ? 'Pendente' : 'Rejeitado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(venda.enviado_em), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {venda.data_aprovacao 
                        ? format(new Date(venda.data_aprovacao), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {venda.pontuacao_esperada || 0} pts
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {venda.pontuacao_validada ? `${venda.pontuacao_validada} pts` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => setSelectedVenda(venda)}
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredVendas.map((venda) => (
            <Card key={venda.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">
                        {format(new Date(venda.enviado_em), 'dd/MM/yyyy')}
                      </h4>
                      <Badge className={getStatusColor(venda.status)}>
                        {venda.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Aluno</div>
                        <div className="font-medium">
                          {venda.aluno?.nome || 'Não informado'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Curso</div>
                        <div className="font-medium">
                          {venda.curso?.nome || 'Não informado'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Pontuação</div>
                        <div className="font-medium">
                          {venda.pontuacao_validada || venda.pontuacao_esperada || 0} pts
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setSelectedVenda(venda)}
                    >
                      <Eye className="h-4 w-4" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VendaDetailsDialog
        venda={selectedVenda}
        open={!!selectedVenda}
        onOpenChange={(open) => !open && setSelectedVenda(null)}
      />
    </div>
  );
};

export default VendasHistoryTab;