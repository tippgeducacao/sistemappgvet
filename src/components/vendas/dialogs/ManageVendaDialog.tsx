import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Eye, RefreshCw } from 'lucide-react';
import { useFormResponses } from '@/hooks/useFormResponses';
import type { VendaCompleta } from '@/hooks/useVendas';

interface ManageVendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venda: VendaCompleta | null;
  onAprovar: (vendaId: string, pontuacao: number) => Promise<void>;
  onRejeitar: (vendaId: string, motivo: string) => Promise<void>;
  onMarcarPendente: (vendaId: string, motivo: string) => Promise<void>;
  isUpdating: boolean;
}

const ManageVendaDialog: React.FC<ManageVendaDialogProps> = ({
  open,
  onOpenChange,
  venda,
  onAprovar,
  onRejeitar,
  onMarcarPendente,
  isUpdating
}) => {
  const [motivoPendencia, setMotivoPendencia] = useState('');
  const { data: formResponses } = useFormResponses(venda?.id || null);

  if (!venda) return null;

  // Função para buscar valor de campo específico
  const getFieldValue = (fieldName: string): string => {
    const response = formResponses?.find(r => r.campo_nome === fieldName);
    return response?.valor_informado || 'Não informado';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matriculado':
        return <Badge className="bg-green-100 text-green-800">Matriculado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'desistiu':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAprovar = async () => {
    await onAprovar(venda.id, venda.pontuacao_esperada || 0);
    onOpenChange(false);
  };

  const handleRejeitar = async () => {
    if (!motivoPendencia.trim()) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }
    await onRejeitar(venda.id, motivoPendencia);
    onOpenChange(false);
    setMotivoPendencia('');
  };

  const handleMarcarPendente = async () => {
    if (!motivoPendencia.trim()) {
      alert('Por favor, informe o motivo da pendência');
      return;
    }
    await onMarcarPendente(venda.id, motivoPendencia);
    onOpenChange(false);
    setMotivoPendencia('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        {/* Header fixo */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <DialogTitle>Gerenciar Venda #{venda.id.substring(0, 8)}</DialogTitle>
            {getStatusBadge(venda.status)}
          </div>
          <p className="text-sm text-gray-600">Aprovar, rejeitar ou alterar status da venda</p>
        </DialogHeader>

        {/* Área scrollável do conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Primeira linha: Informações do Aluno e Documento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações do Aluno */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Aluno</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nome:</p>
                    <p className="font-medium">{venda.aluno?.nome || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email:</p>
                    <p className="font-medium">{venda.aluno?.email || 'Não informado'}</p>
                  </div>
                </div>
                {venda.aluno?.telefone && (
                  <div>
                    <p className="text-sm text-gray-600">Telefone:</p>
                    <p className="font-medium">{venda.aluno.telefone}</p>
                  </div>
                )}
                {venda.aluno?.crmv && (
                  <div>
                    <p className="text-sm text-gray-600">CRMV:</p>
                    <p className="font-medium">{venda.aluno.crmv}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documento Comprobatório */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documento Comprobatório
                  <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                </CardTitle>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Tipo de Venda:</p>
                  <p className="font-medium">{getFieldValue('tipo_venda')}</p>
                </div>
                
                {venda.documento_comprobatorio ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-2 text-blue-600">
                      <Eye className="h-4 w-4" />
                      Visualizar
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-2 text-green-600">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum documento anexado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha: Informações do Curso */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm text-gray-600">Curso:</p>
                <p className="font-medium">{venda.curso?.nome || 'Não informado'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Terceira linha: Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[80px] bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                {venda.observacoes ? (
                  <p className="text-gray-700">{venda.observacoes}</p>
                ) : (
                  <p className="text-gray-400">Nenhuma observação registrada</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detalhes do Formulário */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Detalhes do Formulário</CardTitle>
              <span className="text-sm text-gray-500">{formResponses?.length || 0} respostas</span>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Informações Básicas */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Informações Básicas (6 campos)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Data de Chegada do Lead:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('data_chegada_lead')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nome Completo:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{venda.aluno?.nome || 'Não informado'}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{venda.aluno?.email || 'Não informado'}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Formação Acadêmica:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('formacao_academica')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Instituição de Ensino Superior:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('instituicao_ensino')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vendedor Responsável:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{venda.vendedor?.name || 'Não informado'}</div>
                  </div>
                </div>
              </div>

              {/* Informações do Curso */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Informações do Curso (5 campos)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Curso Selecionado:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('curso_selecionado')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reembolso de Matrícula:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('reembolso_matricula')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lote da Pós:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('lote_pos')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Número da Matrícula:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('numero_matricula')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Modalidade:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('modalidade')}</div>
                  </div>
                </div>
              </div>

              {/* Condições Comerciais */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Condições Comerciais (8 campos)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Valor Total do Contrato:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('valor_total_contrato')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Desconto Aplicado (%):</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('desconto_aplicado')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data do 1º Pagamento:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('data_primeiro_pagamento')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Carência para 1ª Cobrança:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('carencia_primeira_cobranca')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Parcelamento:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('parcelamento')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Forma de Pagamento:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('forma_pagamento')}</div>
                  </div>
                </div>
              </div>

              {/* Origem e Captação */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Origem e Captação (4 campos)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Foi Indicado?:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('foi_indicado')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Como Chegou o Lead:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('como_chegou_lead')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo da Venda:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('tipo_venda')}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">É Venda Casada?:</p>
                    <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('venda_casada')}</div>
                  </div>
                </div>
              </div>

              {/* Outras Informações */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Outras Informações (1 campo)</h4>
                <div>
                  <p className="text-sm text-gray-600">Detalhes da Carência:</p>
                  <div className="bg-gray-100 p-2 rounded text-sm">{getFieldValue('detalhes_carencia')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards destacados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-yellow-800">Forma de Pagamento:</h4>
                <p className="text-yellow-700">{getFieldValue('forma_pagamento')}</p>
              </CardContent>
            </Card>
            
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-yellow-800">Tipo de Venda:</h4>
                <p className="text-yellow-700">{getFieldValue('tipo_venda')}</p>
              </CardContent>
            </Card>
            
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-yellow-800">Venda Casada:</h4>
                <p className="text-yellow-700">{getFieldValue('venda_casada')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Status da Venda */}
          <Card>
            <CardHeader>
              <CardTitle>Status da Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status Atual:</p>
                  {getStatusBadge(venda.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendedor:</p>
                  <p className="font-medium">{venda.vendedor?.name || 'Não informado'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Pontuação Esperada:</p>
                  <p className="font-medium">{venda.pontuacao_esperada || 0} pts</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pontuação Validada:</p>
                  <p className="font-medium">{venda.pontuacao_validada || '1.0'} pts</p>
                </div>
              </div>

              {/* Motivo da Pendência */}
              <div>
                <label className="text-sm text-gray-600 block mb-2">
                  Motivo da Pendência (opcional)
                </label>
                <Textarea
                  value={motivoPendencia}
                  onChange={(e) => setMotivoPendencia(e.target.value)}
                  placeholder={venda.status === 'pendente' ? 'Venda revertida para análise' : 'Digite o motivo caso seja necessário...'}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer fixo com botões */}
        <div className="border-t bg-white p-4">
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            
            {venda.status === 'pendente' && (
              <>
                <Button 
                  variant="destructive"
                  onClick={handleRejeitar}
                  disabled={isUpdating}
                >
                  Rejeitar
                </Button>
                <Button 
                  onClick={handleAprovar}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Aprovar
                </Button>
              </>
            )}
            
            {venda.status === 'matriculado' && (
              <Button 
                onClick={handleMarcarPendente}
                disabled={isUpdating}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Marcar como Pendente
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageVendaDialog;