import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Phone, User, GraduationCap, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

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

const GerenciarIndicacoes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const filteredIndicacoes = indicacoes?.filter((indicacao) => {
    const matchesSearch = 
      indicacao.nome_aluno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indicacao.nome_indicado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indicacao.whatsapp_aluno.includes(searchTerm) ||
      indicacao.whatsapp_indicado.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || indicacao.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'novo': return 'bg-blue-500';
      case 'em_andamento': return 'bg-yellow-500';
      case 'convertido': return 'bg-green-500';
      case 'descartado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

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
        <Badge variant="outline" className="text-lg px-3 py-1">
          {filteredIndicacoes?.length || 0} indicações
        </Badge>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou WhatsApp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="convertido">Convertido</SelectItem>
                <SelectItem value="descartado">Descartado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Indicações */}
      <div className="grid gap-4">
        {filteredIndicacoes?.map((indicacao) => (
          <Card key={indicacao.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {indicacao.nome_aluno} → {indicacao.nome_indicado}
                  </CardTitle>
                  <CardDescription>
                    Cadastrado por: {indicacao.cadastrado_por}
                  </CardDescription>
                </div>
                <Badge className={`${getStatusBadgeColor(indicacao.status)} text-white`}>
                  {indicacao.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados do Aluno (Indicador)
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {indicacao.whatsapp_aluno}
                    </div>
                    {indicacao.formacao && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3 w-3" />
                        {indicacao.formacao}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados do Indicado
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {indicacao.whatsapp_indicado}
                    </div>
                    {indicacao.area_interesse && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3 w-3" />
                        Interesse: {indicacao.area_interesse}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {indicacao.observacoes && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Observações
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {indicacao.observacoes}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Select 
                  value={indicacao.status} 
                  onValueChange={(value) => updateIndicacaoStatus(indicacao.id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="convertido">Convertido</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={indicacao.vendedor_atribuido || ''} 
                  onValueChange={(value) => assignVendedor(indicacao.id, value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Atribuir vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores?.map((vendedor) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>
                        {vendedor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIndicacoes?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhuma indicação encontrada com os filtros aplicados'
                : 'Nenhuma indicação cadastrada ainda'
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GerenciarIndicacoes;