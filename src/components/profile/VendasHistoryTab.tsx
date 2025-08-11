import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Search, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

  const VendaDetailsModal = ({ venda }: { venda: any }) => (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-semibold">
              {venda.aluno?.nome || 'Nome não informado'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Detalhes da Venda #{venda.id?.slice(0, 8)}
            </p>
            <p className="text-sm text-muted-foreground">
              Informações completas sobre a venda cadastrada
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(venda.status)} variant="outline">
              {venda.status}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Email: {venda.aluno?.email || 'Não informado'}
            </div>
            <div className="text-sm text-muted-foreground">
              Curso: {venda.curso?.nome || 'Não informado'}
            </div>
            <div className="text-sm text-muted-foreground">
              Enviado: {format(new Date(venda.enviado_em), 'dd/MM/yyyy, HH:mm')}
            </div>
            <div className="text-sm font-medium text-primary">
              Pontuação: {venda.pontuacao_validada || venda.pontuacao_esperada || 0} pts
            </div>
          </div>
        </div>
        {venda.data_aprovacao && (
          <div className="text-sm text-muted-foreground mt-2">
            Data de Matrícula: {format(new Date(venda.data_aprovacao), 'dd/MM/yyyy')}
          </div>
        )}
      </DialogHeader>
      
      <div className="space-y-6 pt-4">
        {/* Informações Básicas */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-3">Informações Básicas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-blue-700">Nome:</label>
              <p className="text-sm text-blue-900">{venda.aluno?.nome || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-blue-700">Email:</label>
              <p className="text-sm text-blue-900">{venda.aluno?.email || 'Não informado'}</p>
            </div>
            {venda.aluno?.telefone && (
              <div>
                <label className="text-sm font-medium text-blue-700">Telefone:</label>
                <p className="text-sm text-blue-900">{venda.aluno.telefone}</p>
              </div>
            )}
            {venda.aluno?.crmv && (
              <div>
                <label className="text-sm font-medium text-blue-700">CRMV:</label>
                <p className="text-sm text-blue-900">{venda.aluno.crmv}</p>
              </div>
            )}
          </div>
        </div>

        {/* Informações do Curso */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-3">Informações do Curso</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-green-700">Curso:</label>
              <p className="text-sm text-green-900">{venda.curso?.nome || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-green-700">Modalidade:</label>
              <p className="text-sm text-green-900">{venda.curso?.modalidade || 'Não informado'}</p>
            </div>
            {venda.turma && (
              <div>
                <label className="text-sm font-medium text-green-700">Turma:</label>
                <p className="text-sm text-green-900">{venda.turma}</p>
              </div>
            )}
            {venda.abertura && (
              <div>
                <label className="text-sm font-medium text-green-700">Abertura:</label>
                <p className="text-sm text-green-900">{venda.abertura}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status da Venda */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-purple-900">Status da Venda</h3>
            <Badge className={getStatusColor(venda.status)} variant="outline">
              {venda.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-purple-700">Status Atual:</label>
              <Badge className={getStatusColor(venda.status)} variant="outline">
                {venda.status}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-700">Pontuação (calculada automaticamente):</label>
              <p className="text-sm text-blue-600 font-medium">
                {venda.pontuacao_esperada || 0} pts
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-purple-700">Pontuação Validada:</label>
              <p className="text-sm text-green-600 font-medium">
                {venda.pontuacao_validada ? `${venda.pontuacao_validada} pts` : '- pts'}
              </p>
            </div>
            {venda.motivo_pendencia && (
              <div>
                <label className="text-sm font-medium text-purple-700">Motivo da Pendência:</label>
                <p className="text-sm text-purple-900">{venda.motivo_pendencia}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Documento Comprobatório */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">📄</span>
              </div>
              <h3 className="font-semibold text-gray-900">Documento Comprobatório</h3>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo de Venda:</label>
                <p className="text-sm text-gray-900">
                  {venda.documento_comprobatorio || 'Não informado'}
                </p>
              </div>
              {venda.documento_comprobatorio && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">💬</span>
              </div>
              <h3 className="font-semibold text-gray-900">Observações</h3>
            </div>
            <p className="text-sm text-gray-700">
              {venda.observacoes || 'Nenhuma observação registrada'}
            </p>
          </div>
        </div>

        {/* Detalhes do Formulário */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">
            Detalhes do Formulário
            <span className="text-sm text-gray-600 ml-2">
              (Informações da venda)
            </span>
          </h3>
          
          <div className="bg-white p-3 rounded border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Informações Básicas (Campos principais)
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Data de Envio:</span>
                <span className="text-gray-900">
                  {format(new Date(venda.enviado_em), 'yyyy-MM-dd')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID da Venda:</span>
                <span className="text-gray-900">{venda.id?.slice(0, 8)}</span>
              </div>
              {venda.created_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Data de Criação:</span>
                  <span className="text-gray-900">
                    {format(new Date(venda.created_at), 'yyyy-MM-dd')}
                  </span>
                </div>
              )}
              {venda.atualizado_em && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Última Atualização:</span>
                  <span className="text-gray-900">
                    {format(new Date(venda.atualizado_em), 'yyyy-MM-dd')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros e Exportação */}
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

        <Button onClick={exportToExcel} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Lista de vendas */}
      <div className="space-y-3">
        {filteredVendas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                Nenhuma venda encontrada para os filtros selecionados
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredVendas.map((venda) => (
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <VendaDetailsModal venda={venda} />
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default VendasHistoryTab;