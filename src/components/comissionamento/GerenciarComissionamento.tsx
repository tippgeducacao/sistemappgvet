import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useComissionamento } from '@/hooks/useComissionamento';
import { Loader2, Save, Edit2, Check, X } from 'lucide-react';
import { RegraComissionamento } from '@/services/comissionamentoService';

export const GerenciarComissionamento = () => {
  const { regras, loading, updateRegra } = useComissionamento('vendedor');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<RegraComissionamento>>({});

  const handleEdit = (regra: RegraComissionamento) => {
    setEditingId(regra.id);
    setEditingData({
      percentual_minimo: regra.percentual_minimo,
      percentual_maximo: regra.percentual_maximo,
      multiplicador: regra.multiplicador,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    
    try {
      await updateRegra(editingId, editingData);
      setEditingId(null);
      setEditingData({});
    } catch (error) {
      console.error('Erro ao salvar regra:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleChange = (field: keyof RegraComissionamento, value: string) => {
    setEditingData(prev => ({
      ...prev,
      [field]: field === 'multiplicador' ? parseFloat(value) : parseInt(value)
    }));
  };

  const formatPercentual = (min: number, max: number) => {
    if (max === 999) return `≥ ${min}%`;
    return `${min}% - ${max}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando regras de comissionamento...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Regras de Comissionamento - Vendedores</h2>
          <p className="text-muted-foreground">
            Configure os multiplicadores baseados no percentual de atingimento da meta
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faixas de Comissionamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {regras.map((regra) => (
              <div key={regra.id} className="grid grid-cols-4 gap-4 items-center p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Faixa de Percentual</Label>
                  {editingId === regra.id ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={editingData.percentual_minimo || ''}
                        onChange={(e) => handleChange('percentual_minimo', e.target.value)}
                        className="w-20"
                        placeholder="Min"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        value={editingData.percentual_maximo === 999 ? '' : editingData.percentual_maximo || ''}
                        onChange={(e) => handleChange('percentual_maximo', e.target.value || '999')}
                        className="w-20"
                        placeholder="Max"
                      />
                      <span>%</span>
                    </div>
                  ) : (
                    <div className="text-sm">{formatPercentual(regra.percentual_minimo, regra.percentual_maximo)}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Multiplicador</Label>
                  {editingId === regra.id ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editingData.multiplicador || ''}
                      onChange={(e) => handleChange('multiplicador', e.target.value)}
                      className="w-20"
                    />
                  ) : (
                    <div className="text-sm font-mono">x{regra.multiplicador}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Exemplo</Label>
                  <div className="text-sm text-muted-foreground">
                    R$ 450 × {regra.multiplicador} = R$ {(450 * regra.multiplicador).toFixed(2)}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  {editingId === regra.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(regra)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• O sistema calcula o percentual de atingimento da meta com base nos pontos obtidos</p>
            <p>• Cada faixa de percentual tem um multiplicador específico</p>
            <p>• A comissão é calculada como: <strong>Variável Semanal × Multiplicador</strong></p>
            <p>• Exemplo: Meta 6 pontos, obteve 3 pontos (50%) = R$ 450 × 0 = R$ 0</p>
            <p>• Exemplo: Meta 6 pontos, obteve 6 pontos (100%) = R$ 450 × 1 = R$ 450</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};