import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';

const GerenciarCursos: React.FC = () => {
  const { courses, loading, addCourse, updateCourse } = useCourses();
  const [novoCurso, setNovoCurso] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEditando, setNomeEditando] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const handleAdicionarCurso = async () => {
    if (!novoCurso.trim()) return;
    
    try {
      setAdicionando(true);
      await addCourse(novoCurso.trim());
      setNovoCurso('');
    } catch (error) {
      console.error('Erro ao adicionar curso:', error);
    } finally {
      setAdicionando(false);
    }
  };

  const iniciarEdicao = (curso: any) => {
    setEditandoId(curso.id);
    setNomeEditando(curso.nome);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setNomeEditando('');
  };

  const salvarEdicao = async () => {
    if (!nomeEditando.trim() || !editandoId) return;
    
    try {
      setSalvandoEdicao(true);
      await updateCourse(editandoId, nomeEditando.trim());
      cancelarEdicao();
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
    } finally {
      setSalvandoEdicao(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Cursos</h1>
        <p className="text-gray-600 mt-2">
          Adicione e edite cursos disponíveis para matrículas
        </p>
      </div>

      {/* Formulário para adicionar curso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Novo Curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="novoCurso">Nome do Curso</Label>
              <Input
                id="novoCurso"
                value={novoCurso}
                onChange={(e) => setNovoCurso(e.target.value)}
                placeholder="Digite o nome do novo curso"
                onKeyPress={(e) => e.key === 'Enter' && handleAdicionarCurso()}
              />
            </div>
            <Button 
              onClick={handleAdicionarCurso}
              disabled={!novoCurso.trim() || adicionando}
              className="min-w-[120px]"
            >
              {adicionando ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de cursos */}
      <Card>
        <CardHeader>
          <CardTitle>Cursos Cadastrados ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando cursos...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum curso cadastrado</p>
              <p className="text-sm text-gray-400 mt-2">
                Adicione o primeiro curso usando o formulário acima
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Nome do Curso</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((curso, index) => (
                    <TableRow key={curso.id}>
                      <TableCell className="font-medium text-gray-500">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        {editandoId === curso.id ? (
                          <div className="flex gap-2 items-center">
                            <Input
                              value={nomeEditando}
                              onChange={(e) => setNomeEditando(e.target.value)}
                              className="flex-1"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') salvarEdicao();
                                if (e.key === 'Escape') cancelarEdicao();
                              }}
                              autoFocus
                            />
                            <Button 
                              size="sm" 
                              onClick={salvarEdicao}
                              disabled={!nomeEditando.trim() || salvandoEdicao}
                            >
                              {salvandoEdicao ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={cancelarEdicao}
                              disabled={salvandoEdicao}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <span className="font-medium">{curso.nome}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editandoId !== curso.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => iniciarEdicao(curso)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarCursos;
