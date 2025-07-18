import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, List, Users } from 'lucide-react';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import ReunioesPlanilha from './ReunioesPlanilha';
import ReunisoesCalendario from './ReunisoesCalendario';

const VendedorReunioes: React.FC = () => {
  const { agendamentos, isLoading, atualizarResultadoReuniao } = useAgendamentos();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Carregando reuniões...</p>
        </CardContent>
      </Card>
    );
  }

  const reunioesPendentes = agendamentos.filter(agendamento => !agendamento.resultado_reuniao);
  const reunioesFinalizadas = agendamentos.filter(agendamento => agendamento.resultado_reuniao);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reuniões</h1>
          <p className="text-muted-foreground">
            Gerencie suas reuniões agendadas pelos SDRs
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reuniões</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agendamentos.length}</div>
            <p className="text-xs text-muted-foreground">
              {reunioesPendentes.length} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reunioesFinalizadas.length}</div>
            <p className="text-xs text-muted-foreground">
              reuniões com resultado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Comparecimento</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reunioesFinalizadas.length > 0 
                ? Math.round((reunioesFinalizadas.filter(r => r.resultado_reuniao !== 'nao_compareceu').length / reunioesFinalizadas.length) * 100)
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              leads que compareceram
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualizações */}
      <Tabs defaultValue="planilha" className="space-y-4">
        <TabsList>
          <TabsTrigger value="planilha" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Planilha
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planilha">
          <ReunioesPlanilha 
            agendamentos={agendamentos}
            onAtualizarResultado={atualizarResultadoReuniao}
          />
        </TabsContent>

        <TabsContent value="calendario">
          <ReunisoesCalendario 
            agendamentos={agendamentos}
            onAtualizarResultado={atualizarResultadoReuniao}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendedorReunioes;