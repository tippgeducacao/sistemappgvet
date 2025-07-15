import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { MODALIDADE_OPTIONS } from '@/constants/formOptions';

const GerenciarCursos: React.FC = () => {
  const { courses, loading, addCourse, updateCourse, toggleCourseStatus, removeCourse, isDiretor } = useCourses();
  const [novoCurso, setNovoCurso] = useState('');
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<'Curso' | 'Pós-Graduação'>('Curso');
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEditando, setNomeEditando] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [alterandoStatusId, setAlterandoStatusId] = useState<string | null>(null);

  const handleAdicionarCurso = async () => {
    if (!novoCurso.trim()) return;
    
    try {
      setAdicionando(true);
      await addCourse(novoCurso.trim(), modalidadeSelecionada);
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

  const handleAlterarStatus = async (curso: any) => {
    const acao = curso.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Tem certeza que deseja ${acao} o curso "${curso.nome}"?`)) return;
    
    try {
      setAlterandoStatusId(curso.id);
      await toggleCourseStatus(curso.id);
    } catch (error) {
      console.error('Erro ao alterar status do curso:', error);
    } finally {
      setAlterandoStatusId(null);
    }
  };

  const handleExcluirCurso = async (curso: any) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o curso "${curso.nome}"? Esta ação não pode ser desfeita.`)) return;
    
    try {
      setExcluindoId(curso.id);
      await removeCourse(curso.id);
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
    } finally {
      setExcluindoId(null);
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
            Adicionar Novo {modalidadeSelecionada}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Modalidade</Label>
              <Select value={modalidadeSelecionada} onValueChange={(value: 'Curso' | 'Pós-Graduação') => setModalidadeSelecionada(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a modalidade" />
                </SelectTrigger>
                <SelectContent>
                  {MODALIDADE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value as 'Curso' | 'Pós-Graduação'}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="novoCurso">Nome do {modalidadeSelecionada}</Label>
                <Input
                  id="novoCurso"
                  value={novoCurso}
                  onChange={(e) => setNovoCurso(e.target.value)}
                  placeholder={`Digite o nome do novo ${modalidadeSelecionada.toLowerCase()}`}
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
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[120px]">Modalidade</TableHead>
                    {isDiretor && <TableHead className="w-[100px]">Status</TableHead>}
                    <TableHead className={isDiretor ? "w-[220px]" : "w-[100px]"}>Ações</TableHead>
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          curso.modalidade === 'Curso' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {curso.modalidade}
                        </span>
                      </TableCell>
                      {isDiretor && (
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            curso.ativo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {curso.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>
                        {editandoId !== curso.id && (
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => iniciarEdicao(curso)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Editar
                            </Button>
                            {isDiretor && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAlterarStatus(curso)}
                                  disabled={alterandoStatusId === curso.id}
                                  className={`flex items-center gap-1 ${
                                    curso.ativo 
                                      ? 'text-orange-600 hover:text-orange-700 hover:border-orange-300' 
                                      : 'text-green-600 hover:text-green-700 hover:border-green-300'
                                  }`}
                                >
                                  {curso.ativo ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                                  {alterandoStatusId === curso.id 
                                    ? 'Alterando...' 
                                    : curso.ativo ? 'Desativar' : 'Ativar'
                                  }
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExcluirCurso(curso)}
                                  disabled={excluindoId === curso.id}
                                  className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  {excluindoId === curso.id ? 'Excluindo...' : 'Excluir'}
                                </Button>
                              </>
                            )}
                          </div>
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
