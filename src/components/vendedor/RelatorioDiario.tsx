import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Save, TrendingUp, Users, Target, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useDadosDiarios, useRelatorioDiario, useSalvarRelatorioDiario } from '@/hooks/useRelatorioDiario';
import LoadingSpinner from '@/components/LoadingSpinner';

export const RelatorioDiario: React.FC = () => {
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [principaisObjecoes, setPrincipaisObjecoes] = useState('');
  const [acoesProximoDia, setAcoesProximoDia] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');
  
  const { data: dadosDiarios, isLoading: loadingDados } = useDadosDiarios(dataFormatada);
  const { data: relatorioExistente, isLoading: loadingRelatorio } = useRelatorioDiario(dataFormatada);
  const { mutate: salvarRelatorio, isPending: salvando } = useSalvarRelatorioDiario();

  // Carregar dados do relatório existente
  useEffect(() => {
    if (relatorioExistente) {
      setPrincipaisObjecoes(relatorioExistente.principais_objecoes || '');
      setAcoesProximoDia(relatorioExistente.acoes_proximo_dia || '');
    } else {
      setPrincipaisObjecoes('');
      setAcoesProximoDia('');
    }
  }, [relatorioExistente]);

  const handleSalvar = () => {
    if (!dadosDiarios) return;

    salvarRelatorio({
      data: dataFormatada,
      reunioesRealizadas: dadosDiarios.reunioesRealizadas,
      vendasFechadas: dadosDiarios.vendasFechadas,
      taxaFechamento: dadosDiarios.taxaFechamento,
      principaisObjecoes,
      acoesProximoDia
    });
  };

  const isLoading = loadingDados || loadingRelatorio;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Relatório Diário</h1>
        
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !dataSelecionada && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataSelecionada ? (
                format(dataSelecionada, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={dataSelecionada}
              onSelect={(date) => {
                if (date) {
                  setDataSelecionada(date);
                  setCalendarOpen(false);
                }
              }}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Cards de Métricas Automáticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reuniões Realizadas</p>
                    <p className="text-2xl font-bold text-foreground">{dadosDiarios?.reunioesRealizadas || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vendas Fechadas</p>
                    <p className="text-2xl font-bold text-foreground">{dadosDiarios?.vendasFechadas || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Percent className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Fechamento</p>
                    <p className="text-2xl font-bold text-foreground">{dadosDiarios?.taxaFechamento.toFixed(1) || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="text-sm font-semibold text-foreground">
                      {relatorioExistente ? 'Relatório Salvo' : 'Pendente'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário de Relatório */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Principais Objeções do Dia</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="objecoes">
                    Quais foram as principais objeções que você enfrentou hoje?
                  </Label>
                  <Textarea
                    id="objecoes"
                    placeholder="Ex: Preço muito alto, falta de tempo para estudar, incerteza sobre a área..."
                    value={principaisObjecoes}
                    onChange={(e) => setPrincipaisObjecoes(e.target.value)}
                    className="min-h-[120px] mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Ações do Próximo Dia</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="acoes">
                    O que você planeja fazer amanhã para melhorar seus resultados?
                  </Label>
                  <Textarea
                    id="acoes"
                    placeholder="Ex: Estudar argumentos sobre preço, preparar material sobre flexibilidade de horários..."
                    value={acoesProximoDia}
                    onChange={(e) => setAcoesProximoDia(e.target.value)}
                    className="min-h-[120px] mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botão de Salvar */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSalvar} 
              disabled={salvando}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{salvando ? 'Salvando...' : 'Salvar Relatório'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};