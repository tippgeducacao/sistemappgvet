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

  if (!venda) return null;

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            Gerenciar Venda #{venda.id.substring(0, 8)}
            {getStatusBadge(venda.status)}
          </DialogTitle>
        </DialogHeader>

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
              </CardTitle>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Tipo de Venda:</p>
                <p className="font-medium">OUTRO</p>
              </div>
              
              {venda.documento_comprobatorio ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
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

        {/* Informações do Curso */}
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

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              {venda.observacoes || 'Nenhuma observação'}
            </p>
          </CardContent>
        </Card>

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
                placeholder={venda.status === 'pendente' ? 'Venda revertida para análise' : 'Digite o motivo...'}
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
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
              variant="outline"
              onClick={handleMarcarPendente}
              disabled={isUpdating}
              className="text-yellow-600 hover:text-yellow-700"
            >
              Marcar como Pendente
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageVendaDialog;