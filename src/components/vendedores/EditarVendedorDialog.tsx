import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, TrendingUp, Save, X } from 'lucide-react';
import { useNiveis } from '@/hooks/useNiveis';
import { NiveisService } from '@/services/niveisService';
import type { Vendedor } from '@/services/vendedoresService';

interface EditarVendedorDialogProps {
  vendedor: Vendedor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditarVendedorDialog: React.FC<EditarVendedorDialogProps> = ({
  vendedor,
  open,
  onOpenChange,
  onSuccess
}) => {
  const { updateVendedorNivel } = useNiveis();
  const [selectedNivel, setSelectedNivel] = useState<'junior' | 'pleno' | 'senior'>('junior');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (vendedor?.nivel) {
      setSelectedNivel(vendedor.nivel as 'junior' | 'pleno' | 'senior');
    }
  }, [vendedor]);

  const handleSave = async () => {
    if (!vendedor) return;

    try {
      setSaving(true);
      await updateVendedorNivel(vendedor.id, selectedNivel);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!vendedor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-5 w-5" />
            Editar Vendedor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do vendedor */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Vendedor</Label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{vendedor.name}</p>
                <p className="text-sm text-gray-600">{vendedor.email}</p>
              </div>
              <Badge variant="outline" className={NiveisService.getNivelColor(vendedor.nivel || 'junior')}>
                {NiveisService.getNivelLabel(vendedor.nivel || 'junior')}
              </Badge>
            </div>
          </div>

          {/* Seleção de nível */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Novo Nível
            </Label>
            <Select value={selectedNivel} onValueChange={(value) => setSelectedNivel(value as 'junior' | 'pleno' | 'senior')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="junior">
                  <div className="flex items-center gap-2">
                    <span>Vendedor Júnior</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">Meta: 6 pts/sem</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="pleno">
                  <div className="flex items-center gap-2">
                    <span>Vendedor Pleno</span>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">Meta: 7 pts/sem</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="senior">
                  <div className="flex items-center gap-2">
                    <span>Vendedor Sênior</span>
                    <Badge className="bg-purple-100 text-purple-800 text-xs">Meta: 8 pts/sem</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview das informações do nível selecionado */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Informações do Nível</Label>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Fixo Mensal:</span>
                  <p className="font-medium">R$ {
                    selectedNivel === 'junior' ? '2.200' :
                    selectedNivel === 'pleno' ? '2.600' : '3.000'
                  }</p>
                </div>
                <div>
                  <span className="text-gray-600">Vale:</span>
                  <p className="font-medium">R$ 400</p>
                </div>
                <div>
                  <span className="text-gray-600">Variável Semanal:</span>
                  <p className="font-medium">R$ {
                    selectedNivel === 'junior' ? '450' :
                    selectedNivel === 'pleno' ? '500' : '550'
                  }</p>
                </div>
                <div>
                  <span className="text-gray-600">Meta Semanal:</span>
                  <p className="font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {
                      selectedNivel === 'junior' ? '6' :
                      selectedNivel === 'pleno' ? '7' : '8'
                    } pts
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || selectedNivel === vendedor.nivel}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditarVendedorDialog;