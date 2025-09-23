import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AgendamentoSDR } from '@/hooks/useAgendamentosSDR';

interface ReunioesCanceladasSDRProps {
  fetchAgendamentosCancelados: () => Promise<AgendamentoSDR[]>;
}

const ReunioesCanceladasSDR: React.FC<ReunioesCanceladasSDRProps> = ({
  fetchAgendamentosCancelados
}) => {
  const [agendamentosCancelados, setAgendamentosCancelados] = useState<AgendamentoSDR[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    carregarAgendamentosCancelados();
  }, []);

  const carregarAgendamentosCancelados = async () => {
    try {
      setLoading(true);
      const cancelados = await fetchAgendamentosCancelados();
      setAgendamentosCancelados(cancelados);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (error) {
      console.error('Erro ao carregar agendamentos cancelados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(agendamentosCancelados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = agendamentosCancelados.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendamentos Cancelados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendamentos Cancelados
            <Badge variant="destructive">{agendamentosCancelados.length}</Badge>
          </div>
          {agendamentosCancelados.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {startIndex + 1}-{Math.min(endIndex, agendamentosCancelados.length)} de {agendamentosCancelados.length} agendamentos
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {agendamentosCancelados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum agendamento cancelado</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Data/Horário</TableHead>
                    <TableHead>Pós-graduação</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Cancelado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((agendamento) => (
                    <TableRow key={agendamento.id} className="bg-destructive/5 dark:bg-destructive/10">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">Cancelado</Badge>
                          {agendamento.lead?.nome}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
                          <br />
                          <span className="text-muted-foreground">
                            {format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR })}
                            {agendamento.data_fim_agendamento && (
                              <>
                                {' às '}
                                {format(new Date(agendamento.data_fim_agendamento), 'HH:mm', { locale: ptBR })}
                              </>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {agendamento.pos_graduacao_interesse}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {agendamento.vendedor?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-xs truncate" title={agendamento.observacoes || ''}>
                          {agendamento.observacoes || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(agendamento.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                          <br />
                          <span className="text-xs">
                            {format(new Date(agendamento.updated_at), "HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ReunioesCanceladasSDR;