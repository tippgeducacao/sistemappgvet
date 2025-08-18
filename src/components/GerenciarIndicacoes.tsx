import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Phone, User, GraduationCap, MessageSquare, Eye, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Indicacao {
  id: string;
  cadastrado_por: string;
  nome_aluno: string;
  whatsapp_aluno: string;
  nome_indicado: string;
  whatsapp_indicado: string;
  formacao?: string;
  area_interesse?: string;
  observacoes?: string;
  vendedor_atribuido?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface IndicadorStats {
  cadastrado_por: string;
  total_indicados: number;
  indicados_hoje: number;
  indicados_esta_semana: number;
  indicados_este_mes: number;
}

const GerenciarIndicacoes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cadastradoPorFilter, setCadastradoPorFilter] = useState<string>('all');
  const [dataFilter, setDataFilter] = useState<string>('all');
  const [areaInteresseFilter, setAreaInteresseFilter] = useState<string>('all');
  const [indicadorSelecionado, setIndicadorSelecionado] = useState<string | null>(null);

  const { data: indicacoes, isLoading, refetch } = useQuery({
    queryKey: ['indicacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('indicacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Indicacao[];
    },
  });

  const { data: vendedores } = useQuery({
    queryKey: ['vendedores-for-indicacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('user_type', 'vendedor')
        .eq('ativo', true);

      if (error) throw error;
      return data;
    },
  });

  // Calcular estatísticas dos indicadores
  const indicadoresStats = React.useMemo(() => {
    if (!indicacoes) return [];
    
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    const stats = indicacoes.reduce((acc, indicacao) => {
      const cadastrador = indicacao.cadastrado_por;
      const dataIndicacao = new Date(indicacao.created_at);
      
      if (!acc[cadastrador]) {
        acc[cadastrador] = {
          cadastrado_por: cadastrador,
          total_indicados: 0,
          indicados_hoje: 0,
          indicados_esta_semana: 0,
          indicados_este_mes: 0,
        };
      }
      
      acc[cadastrador].total_indicados++;
      
      if (dataIndicacao >= hoje) {
        acc[cadastrador].indicados_hoje++;
      }
      
      if (dataIndicacao >= inicioSemana) {
        acc[cadastrador].indicados_esta_semana++;
      }
      
      if (dataIndicacao >= inicioMes) {
        acc[cadastrador].indicados_este_mes++;
      }
      
      return acc;
    }, {} as Record<string, IndicadorStats>);

    return Object.values(stats).sort((a, b) => b.total_indicados - a.total_indicados);
  }, [indicacoes]);

  // Filtros únicos para os selects
  const cadastradoresPor = React.useMemo(() => {
    if (!indicacoes) return [];
    const cadastradores = [...new Set(indicacoes.map(i => i.cadastrado_por))];
    return cadastradores.sort();
  }, [indicacoes]);

  const areasInteresse = React.useMemo(() => {
    if (!indicacoes) return [];
    const areas = [...new Set(indicacoes.filter(i => i.area_interesse).map(i => i.area_interesse))];
    return areas.sort();
  }, [indicacoes]);

  const updateIndicacaoStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('indicacoes')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    toast.success('Status atualizado com sucesso');
    refetch();
  };

  const assignVendedor = async (id: string, vendedorId: string) => {
    const { error } = await supabase
      .from('indicacoes')
      .update({ vendedor_atribuido: vendedorId })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atribuir vendedor');
      return;
    }

    toast.success('Vendedor atribuído com sucesso');
    refetch();
  };

  // Filtros para a aba "Todos os indicados"
  const filteredIndicacoes = indicacoes?.filter((indicacao) => {
    const matchesSearch = 
      indicacao.nome_indicado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indicacao.nome_aluno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indicacao.whatsapp_aluno.includes(searchTerm) ||
      indicacao.whatsapp_indicado.includes(searchTerm);
    
    const matchesCadastradoPor = cadastradoPorFilter === 'all' || indicacao.cadastrado_por === cadastradoPorFilter;
    const matchesAreaInteresse = areaInteresseFilter === 'all' || indicacao.area_interesse === areaInteresseFilter;
    
    // Filtro por data
    let matchesData = true;
    if (dataFilter !== 'all') {
      const agora = new Date();
      const dataIndicacao = new Date(indicacao.created_at);
      
      switch (dataFilter) {
        case 'hoje':
          const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
          matchesData = dataIndicacao >= hoje;
          break;
        case 'esta_semana':
          const inicioSemana = new Date(agora);
          inicioSemana.setDate(agora.getDate() - agora.getDay());
          matchesData = dataIndicacao >= inicioSemana;
          break;
        case 'este_mes':
          const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
          matchesData = dataIndicacao >= inicioMes;
          break;
      }
    }
    
    return matchesSearch && matchesCadastradoPor && matchesAreaInteresse && matchesData;
  });

  // Filtrar indicações do indicador selecionado
  const indicacoesDoIndicador = indicacoes?.filter(indicacao => 
    indicacao.cadastrado_por === indicadorSelecionado
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando indicações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Indicações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as indicações recebidas
          </p>
        </div>
      </div>

      <Tabs defaultValue="todos-indicados" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista-indicadores">Lista de indicadores</TabsTrigger>
          <TabsTrigger value="todos-indicados">Todos os indicados</TabsTrigger>
        </TabsList>

        {/* Aba Lista de Indicadores */}
        <TabsContent value="lista-indicadores" className="space-y-4">
          <div className="grid gap-4">
            {indicadoresStats.map((indicador) => (
              <Card key={indicador.cadastrado_por}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {indicador.cadastrado_por.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{indicador.cadastrado_por}</h3>
                        <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">LEADS INDICADOS:</span>
                            <span className="font-medium ml-1">{indicador.total_indicados}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">HOJE:</span>
                            <span className="font-medium ml-1">{indicador.indicados_hoje}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ESSA SEMANA:</span>
                            <span className="font-medium ml-1">{indicador.indicados_esta_semana}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ESSE MÊS:</span>
                            <span className="font-medium ml-1">{indicador.indicados_este_mes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIndicadorSelecionado(indicador.cadastrado_por)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver leads ({indicador.total_indicados})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba Todos os Indicados */}
        <TabsContent value="todos-indicados" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Caixa de pesquisa por nome do indicado</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Nome do indicado..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Filtro por cadastrado por</label>
                  <Select value={cadastradoPorFilter} onValueChange={setCadastradoPorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cadastrado por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {cadastradoresPor.map((cadastrador) => (
                        <SelectItem key={cadastrador} value={cadastrador}>
                          {cadastrador}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Filtro por data</label>
                  <Select value={dataFilter} onValueChange={setDataFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Data" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as datas</SelectItem>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="esta_semana">Esta semana</SelectItem>
                      <SelectItem value="este_mes">Este mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Filtro por área de interesse</label>
                  <Select value={areaInteresseFilter} onValueChange={setAreaInteresseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Área de interesse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as áreas</SelectItem>
                      {areasInteresse.map((area) => (
                        <SelectItem key={area} value={area!}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Indicados */}
          <div className="grid gap-4">
            {filteredIndicacoes?.map((indicacao) => (
              <Card key={indicacao.id}>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Cadastrado Por:</label>
                        <p className="text-sm">{indicacao.cadastrado_por}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Nome do aluno:</label>
                        <p className="text-sm">{indicacao.nome_aluno}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">WhatsApp do aluno:</label>
                        <p className="text-sm">{indicacao.whatsapp_aluno}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Nome do indicado:</label>
                        <p className="text-sm">{indicacao.nome_indicado}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">WhatsApp do indicado:</label>
                        <p className="text-sm">{indicacao.whatsapp_indicado}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Formação:</label>
                        <p className="text-sm">{indicacao.formacao || 'Não informado'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Área de interesse:</label>
                        <p className="text-sm">{indicacao.area_interesse || 'Não informado'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Observações:</label>
                        <p className="text-sm">{indicacao.observacoes || 'Nenhuma observação'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Data de cadastro:</label>
                        <p className="text-sm">
                          {format(new Date(indicacao.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end items-center mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver todas as informações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredIndicacoes?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-muted-foreground">
                  {searchTerm || cadastradoPorFilter !== 'all' || dataFilter !== 'all' || areaInteresseFilter !== 'all'
                    ? 'Nenhuma indicação encontrada com os filtros aplicados'
                    : 'Nenhuma indicação cadastrada ainda'
                  }
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal para mostrar leads do indicador */}
      <Dialog open={!!indicadorSelecionado} onOpenChange={() => setIndicadorSelecionado(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Leads de {indicadorSelecionado}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIndicadorSelecionado(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {indicacoesDoIndicador.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum lead encontrado para este indicador
              </div>
            ) : (
              indicacoesDoIndicador.map((indicacao) => (
                <Card key={indicacao.id}>
                  <CardContent className="p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Nome do indicado:</label>
                          <p className="text-sm font-medium">{indicacao.nome_indicado}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">WhatsApp:</label>
                          <p className="text-sm">{indicacao.whatsapp_indicado}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Formação:</label>
                          <p className="text-sm">{indicacao.formacao || 'Não informado'}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Área de interesse:</label>
                          <p className="text-sm">{indicacao.area_interesse || 'Não informado'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Status:</label>
                          <Badge variant={
                            indicacao.status === 'novo' ? 'default' :
                            indicacao.status === 'em_andamento' ? 'secondary' :
                            indicacao.status === 'convertido' ? 'default' : 'destructive'
                          }>
                            {indicacao.status === 'novo' ? 'Novo' :
                             indicacao.status === 'em_andamento' ? 'Em andamento' :
                             indicacao.status === 'convertido' ? 'Convertido' : 'Descartado'}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Data de cadastro:</label>
                          <p className="text-sm">
                            {format(new Date(indicacao.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {indicacao.observacoes && (
                      <div className="mt-3 pt-3 border-t">
                        <label className="text-xs font-medium text-muted-foreground">Observações:</label>
                        <p className="text-sm mt-1">{indicacao.observacoes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarIndicacoes;