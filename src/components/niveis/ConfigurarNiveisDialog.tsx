import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, X, DollarSign, Target } from 'lucide-react';
import { useNiveis } from '@/hooks/useNiveis';
import { NiveisService, type NivelVendedor } from '@/services/niveisService';

interface ConfigurarNiveisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConfigurarNiveisDialog: React.FC<ConfigurarNiveisDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { niveis, loading, updateNivel } = useNiveis();
  const [editingNiveis, setEditingNiveis] = useState<Record<string, Partial<NivelVendedor>>>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (nivelId: string, field: string, value: string) => {
    setEditingNiveis(prev => ({
      ...prev,
      [nivelId]: {
        ...prev[nivelId],
        [field]: field.includes('pontos') ? parseInt(value) || 0 : parseFloat(value) || 0
      }
    }));
  };

  const getDisplayValue = (nivel: NivelVendedor, field: string) => {
    const editingValue = editingNiveis[nivel.id]?.[field as keyof NivelVendedor];
    if (editingValue !== undefined) {
      return editingValue.toString();
    }
    return (nivel[field as keyof NivelVendedor] as number).toString();
  };

  const hasChanges = Object.keys(editingNiveis).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);
      
      // Salvar mudanças para cada nível alterado
      const promises = Object.entries(editingNiveis).map(([nivelId, changes]) => 
        updateNivel(nivelId, changes)
      );
      
      await Promise.all(promises);
      setEditingNiveis({});
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingNiveis({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            Configurar Níveis de Vendedores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações gerais */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Sistema de Níveis</span>
            </div>
            <p className="text-sm text-blue-700">
              Configure os valores de fixo mensal, vale, variável semanal e meta semanal para cada nível de vendedor.
              As metas são baseadas em pontos/vendas por semana.
            </p>
          </div>

          {/* Configuração dos níveis */}
          <div className="grid gap-6">
            {niveis.map((nivel) => (
              <Card key={nivel.id} className="border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={NiveisService.getNivelColor(nivel.nivel)}>
                        {NiveisService.getNivelLabel(nivel.nivel)}
                      </Badge>
                      <span className="text-lg">Configurações</span>
                    </div>
                    {editingNiveis[nivel.id] && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        Editando
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Fixo Mensal */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Fixo Mensal (R$)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={getDisplayValue(nivel, 'fixo_mensal')}
                        onChange={(e) => handleChange(nivel.id, 'fixo_mensal', e.target.value)}
                        className="text-center font-medium"
                      />
                    </div>

                    {/* Vale */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Vale (R$)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={getDisplayValue(nivel, 'vale')}
                        onChange={(e) => handleChange(nivel.id, 'vale', e.target.value)}
                        className="text-center font-medium"
                      />
                    </div>

                    {/* Variável Semanal */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Variável Semanal (R$)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={getDisplayValue(nivel, 'variavel_semanal')}
                        onChange={(e) => handleChange(nivel.id, 'variavel_semanal', e.target.value)}
                        className="text-center font-medium"
                      />
                    </div>

                    {/* Meta Semanal */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Meta Semanal (Pontos)
                      </Label>
                      <Input
                        type="number"
                        value={getDisplayValue(nivel, 'meta_semanal_pontos')}
                        onChange={(e) => handleChange(nivel.id, 'meta_semanal_pontos', e.target.value)}
                        className="text-center font-medium"
                      />
                    </div>
                  </div>

                  {/* Preview dos valores calculados */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Preview mensal:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Fixo:</span>
                        <span className="ml-1 font-medium">
                          R$ {parseFloat(getDisplayValue(nivel, 'fixo_mensal')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Vale:</span>
                        <span className="ml-1 font-medium">
                          R$ {parseFloat(getDisplayValue(nivel, 'vale')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Variável (4 sem):</span>
                        <span className="ml-1 font-medium">
                          R$ {(parseFloat(getDisplayValue(nivel, 'variavel_semanal')) * 4).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Meta total:</span>
                        <span className="ml-1 font-medium">
                          {parseInt(getDisplayValue(nivel, 'meta_semanal_pontos')) * 4} pts/mês
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
            
            {hasChanges && (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancelar Alterações
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurarNiveisDialog;