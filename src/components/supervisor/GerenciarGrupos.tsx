import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Users, UserPlus, UserMinus, Target } from 'lucide-react';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useVendedores } from '@/hooks/useVendedores';
import LoadingSpinner from '@/components/LoadingSpinner';

const GerenciarGrupos: React.FC = () => {
  const { grupos, loading, createGrupo, addMembroGrupo, removeMembroGrupo, createMetaMensal } = useGruposSupervisores();
  const { vendedores } = useVendedores();
  
  const [showNewGrupoDialog, setShowNewGrupoDialog] = useState(false);
  const [showAddMembroDialog, setShowAddMembroDialog] = useState(false);
  const [showMetaDialog, setShowMetaDialog] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<string>('');
  
  const [novoGrupo, setNovoGrupo] = useState({
    nome: '',
    descricao: ''
  });
  
  const [novaMeta, setNovaMeta] = useState({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    metaVendas: 0
  });
  
  const [membroSelecionado, setMembroSelecionado] = useState('');

  const handleCreateGrupo = async () => {
    try {
      await createGrupo(novoGrupo.nome, novoGrupo.descricao);
      setNovoGrupo({ nome: '', descricao: '' });
      setShowNewGrupoDialog(false);
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    }
  };

  const handleAddMembro = async () => {
    try {
      await addMembroGrupo(selectedGrupo, membroSelecionado);
      setMembroSelecionado('');
      setShowAddMembroDialog(false);
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
    }
  };

  const handleCreateMeta = async () => {
    try {
      const { data: user } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getUser());
      if (!user.user) throw new Error('Usuário não autenticado');

      await createMetaMensal(
        user.user.id,
        selectedGrupo,
        novaMeta.ano,
        novaMeta.mes,
        novaMeta.metaVendas
      );
      setNovaMeta({
        ano: new Date().getFullYear(),
        mes: new Date().getMonth() + 1,
        metaVendas: 0
      });
      setShowMetaDialog(false);
    } catch (error) {
      console.error('Erro ao criar meta:', error);
    }
  };

  // Filtrar vendedores disponíveis (que não estão no grupo selecionado)
  const vendedoresDisponiveis = vendedores.filter(vendedor => {
    const grupo = grupos.find(g => g.id === selectedGrupo);
    return !grupo?.membros?.some(m => m.usuario_id === vendedor.id);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="mt-4 text-lg font-medium">Carregando grupos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciar Grupos</h2>
          <p className="text-muted-foreground">Gerencie seus grupos de usuários e metas</p>
        </div>
        
        <Dialog open={showNewGrupoDialog} onOpenChange={setShowNewGrupoDialog}>
          <DialogTrigger asChild>
            <Button className="bg-ppgvet-teal hover:bg-ppgvet-teal/90">
              <Plus className="h-4 w-4 mr-2" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Grupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nomeGrupo">Nome do Grupo</Label>
                <Input
                  id="nomeGrupo"
                  value={novoGrupo.nome}
                  onChange={(e) => setNovoGrupo(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite o nome do grupo"
                />
              </div>
              <div>
                <Label htmlFor="descricaoGrupo">Descrição (opcional)</Label>
                <Textarea
                  id="descricaoGrupo"
                  value={novoGrupo.descricao}
                  onChange={(e) => setNovoGrupo(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição do grupo"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowNewGrupoDialog(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateGrupo} className="flex-1 bg-ppgvet-teal hover:bg-ppgvet-teal/90">
                  Criar Grupo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {grupos.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum grupo encontrado</h3>
          <p className="text-gray-600 mb-4">Comece criando seu primeiro grupo de usuários</p>
          <Button onClick={() => setShowNewGrupoDialog(true)} className="bg-ppgvet-teal hover:bg-ppgvet-teal/90">
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Grupo
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {grupos.map((grupo) => (
            <Card key={grupo.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {grupo.nome_grupo}
                    </CardTitle>
                    {grupo.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">{grupo.descricao}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={showAddMembroDialog && selectedGrupo === grupo.id} onOpenChange={(open) => {
                      setShowAddMembroDialog(open);
                      if (open) setSelectedGrupo(grupo.id);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Adicionar Membro
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adicionar Membro ao Grupo</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Selecionar Usuário</Label>
                            <Select value={membroSelecionado} onValueChange={setMembroSelecionado}>
                              <SelectTrigger>
                                <SelectValue placeholder="Escolha um usuário" />
                              </SelectTrigger>
                              <SelectContent>
                                {vendedoresDisponiveis.map((vendedor) => (
                                  <SelectItem key={vendedor.id} value={vendedor.id}>
                                    {vendedor.name} - {vendedor.user_type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowAddMembroDialog(false)} className="flex-1">
                              Cancelar
                            </Button>
                            <Button onClick={handleAddMembro} className="flex-1 bg-ppgvet-teal hover:bg-ppgvet-teal/90">
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={showMetaDialog && selectedGrupo === grupo.id} onOpenChange={(open) => {
                      setShowMetaDialog(open);
                      if (open) setSelectedGrupo(grupo.id);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Target className="h-4 w-4 mr-2" />
                          Definir Meta
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Definir Meta Mensal</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Ano</Label>
                              <Input
                                type="number"
                                value={novaMeta.ano}
                                onChange={(e) => setNovaMeta(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                              />
                            </div>
                            <div>
                              <Label>Mês</Label>
                              <Input
                                type="number"
                                min="1"
                                max="12"
                                value={novaMeta.mes}
                                onChange={(e) => setNovaMeta(prev => ({ ...prev, mes: parseInt(e.target.value) }))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Meta de Vendas</Label>
                            <Input
                              type="number"
                              value={novaMeta.metaVendas}
                              onChange={(e) => setNovaMeta(prev => ({ ...prev, metaVendas: parseInt(e.target.value) }))}
                              placeholder="Quantidade de vendas"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowMetaDialog(false)} className="flex-1">
                              Cancelar
                            </Button>
                            <Button onClick={handleCreateMeta} className="flex-1 bg-ppgvet-teal hover:bg-ppgvet-teal/90">
                              Definir Meta
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <h4 className="font-medium mb-3">Membros ({grupo.membros?.length || 0})</h4>
                  {grupo.membros && grupo.membros.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Nível</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grupo.membros.map((membro) => (
                          <TableRow key={membro.id}>
                            <TableCell>{membro.usuario?.name}</TableCell>
                            <TableCell>{membro.usuario?.email}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {membro.usuario?.user_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {membro.usuario?.nivel || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMembroGrupo(grupo.id, membro.usuario_id)}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum membro adicionado ainda</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GerenciarGrupos;