import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useGruposPosGraduacoes, type GrupoPosGraduacao } from '@/hooks/useGruposPosGraduacoes';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, Users, Search } from 'lucide-react';

const GerenciarGruposPosGraduacao: React.FC = () => {
  const {
    grupos,
    cursosDisponiveis,
    loading,
    criarGrupo,
    editarGrupo,
    excluirGrupo,
  } = useGruposPosGraduacoes();

  const [novoGrupo, setNovoGrupo] = useState({
    nome: '',
    descricao: '',
    cursosIds: [] as string[]
  });

  const [grupoEditando, setGrupoEditando] = useState<GrupoPosGraduacao | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [cursosEditando, setCursosEditando] = useState<string[]>([]);
  const [pesquisaCursos, setPesquisaCursos] = useState('');
  const [pesquisaCursosEdicao, setPesquisaCursosEdicao] = useState('');

  const handleCriarGrupo = async () => {
    if (!novoGrupo.nome.trim()) return;

    try {
      await criarGrupo(novoGrupo.nome, novoGrupo.descricao, novoGrupo.cursosIds);
      setNovoGrupo({ nome: '', descricao: '', cursosIds: [] });
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    }
  };

  const iniciarEdicao = (grupo: GrupoPosGraduacao) => {
    setGrupoEditando(grupo);
    setCursosEditando(grupo.cursos?.map(c => c.id) || []);
    setPesquisaCursosEdicao('');
    setDialogAberto(true);
  };

  const salvarEdicao = async () => {
    if (!grupoEditando) return;

    try {
      await editarGrupo(
        grupoEditando.id,
        grupoEditando.nome,
        grupoEditando.descricao,
        cursosEditando
      );
      setGrupoEditando(null);
      setCursosEditando([]);
      setPesquisaCursosEdicao('');
      setDialogAberto(false);
    } catch (error) {
      console.error('Erro ao editar grupo:', error);
    }
  };

  const handleExcluirGrupo = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este grupo?')) {
      await excluirGrupo(id);
    }
  };

  const toggleCursoNovoGrupo = (cursoId: string) => {
    setNovoGrupo(prev => ({
      ...prev,
      cursosIds: prev.cursosIds.includes(cursoId)
        ? prev.cursosIds.filter(id => id !== cursoId)
        : [...prev.cursosIds, cursoId]
    }));
  };

  const toggleCursoEdicao = (cursoId: string) => {
    setCursosEditando(prev =>
      prev.includes(cursoId)
        ? prev.filter(id => id !== cursoId)
        : [...prev, cursoId]
    );
  };

  // Filtrar cursos baseado na pesquisa
  const cursosFiltrados = cursosDisponiveis.filter(curso =>
    curso.nome.toLowerCase().includes(pesquisaCursos.toLowerCase())
  );

  const cursosFiltradosEdicao = cursosDisponiveis.filter(curso =>
    curso.nome.toLowerCase().includes(pesquisaCursosEdicao.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Formulário para criar novo grupo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Criar Novo Grupo de Pós-Graduações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Grupo</Label>
            <Input
              id="nome"
              value={novoGrupo.nome}
              onChange={(e) => setNovoGrupo(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Digite o nome do grupo"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={novoGrupo.descricao}
              onChange={(e) => setNovoGrupo(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição do grupo"
              rows={3}
            />
          </div>

          <div>
            <Label>Pós-Graduações do Grupo</Label>
            <div className="space-y-3 mt-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar pós-graduações..."
                  value={pesquisaCursos}
                  onChange={(e) => setPesquisaCursos(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-3 bg-muted/50">
                {cursosFiltrados.length === 0 ? (
                  <div className="col-span-full text-center text-muted-foreground py-4">
                    {pesquisaCursos ? 'Nenhuma pós-graduação encontrada' : 'Nenhuma pós-graduação disponível'}
                  </div>
                ) : (
                  cursosFiltrados.map((curso) => (
                    <div key={curso.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`curso-${curso.id}`}
                        checked={novoGrupo.cursosIds.includes(curso.id)}
                        onCheckedChange={() => toggleCursoNovoGrupo(curso.id)}
                      />
                      <Label htmlFor={`curso-${curso.id}`} className="text-sm">
                        {curso.nome}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCriarGrupo}
            disabled={!novoGrupo.nome.trim()}
            className="w-full"
          >
            Criar Grupo
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Lista de grupos existentes */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Grupos Cadastrados ({grupos.length})
        </h3>

        {grupos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nenhum grupo cadastrado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {grupos.map((grupo) => (
              <Card key={grupo.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{grupo.nome}</h4>
                      {grupo.descricao && (
                        <p className="text-muted-foreground text-sm mt-1">
                          {grupo.descricao}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => iniciarEdicao(grupo)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExcluirGrupo(grupo.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">
                      Pós-Graduações ({grupo.cursos?.length || 0}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {grupo.cursos?.map((curso) => (
                        <Badge key={curso.id} variant="secondary">
                          {curso.nome}
                        </Badge>
                      )) || (
                        <p className="text-muted-foreground text-sm">
                          Nenhuma pós-graduação selecionada
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog para editar grupo */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
            <DialogDescription>
              Edite as informações do grupo de pós-graduações
            </DialogDescription>
          </DialogHeader>

          {grupoEditando && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-nome">Nome do Grupo</Label>
                <Input
                  id="edit-nome"
                  value={grupoEditando.nome}
                  onChange={(e) => setGrupoEditando(prev => 
                    prev ? { ...prev, nome: e.target.value } : null
                  )}
                />
              </div>

              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={grupoEditando.descricao || ''}
                  onChange={(e) => setGrupoEditando(prev => 
                    prev ? { ...prev, descricao: e.target.value } : null
                  )}
                  rows={3}
                />
              </div>

              <div>
                <Label>Pós-Graduações do Grupo</Label>
                <div className="space-y-3 mt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar pós-graduações..."
                      value={pesquisaCursosEdicao}
                      onChange={(e) => setPesquisaCursosEdicao(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3 bg-muted/50">
                    {cursosFiltradosEdicao.length === 0 ? (
                      <div className="col-span-full text-center text-muted-foreground py-4">
                        {pesquisaCursosEdicao ? 'Nenhuma pós-graduação encontrada' : 'Nenhuma pós-graduação disponível'}
                      </div>
                    ) : (
                      cursosFiltradosEdicao.map((curso) => (
                        <div key={curso.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-curso-${curso.id}`}
                            checked={cursosEditando.includes(curso.id)}
                            onCheckedChange={() => toggleCursoEdicao(curso.id)}
                          />
                          <Label htmlFor={`edit-curso-${curso.id}`} className="text-sm">
                            {curso.nome}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogAberto(false)}>
                  Cancelar
                </Button>
                <Button onClick={salvarEdicao}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarGruposPosGraduacao;