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
  const [selectedNivel, setSelectedNivel] = useState<'junior' | 'pleno' | 'senior' | 'sdr_inbound_junior' | 'sdr_inbound_pleno' | 'sdr_inbound_senior' | 'sdr_outbound_junior' | 'sdr_outbound_pleno' | 'sdr_outbound_senior'>('junior');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (vendedor?.nivel) {
      // Mapear níveis antigos para novos
      const nivelMap: Record<string, typeof selectedNivel> = {
        'sdr_junior': 'sdr_inbound_junior',
        'sdr_pleno': 'sdr_inbound_pleno', 
        'sdr_senior': 'sdr_inbound_senior'
      };
      const novoNivel = nivelMap[vendedor.nivel] || vendedor.nivel as typeof selectedNivel;
      setSelectedNivel(novoNivel);
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
            <Select value={selectedNivel} onValueChange={(value) => setSelectedNivel(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="junior">Vendedor Júnior</SelectItem>
                <SelectItem value="pleno">Vendedor Pleno</SelectItem>
                <SelectItem value="senior">Vendedor Sênior</SelectItem>
              <SelectItem value="sdr_inbound_junior">SDR Inbound Júnior</SelectItem>
              <SelectItem value="sdr_inbound_pleno">SDR Inbound Pleno</SelectItem>
              <SelectItem value="sdr_inbound_senior">SDR Inbound Sênior</SelectItem>
              <SelectItem value="sdr_outbound_junior">SDR Outbound Júnior</SelectItem>
              <SelectItem value="sdr_outbound_pleno">SDR Outbound Pleno</SelectItem>
              <SelectItem value="sdr_outbound_senior">SDR Outbound Sênior</SelectItem>
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
                    selectedNivel === 'pleno' ? '2.600' :
                    selectedNivel === 'senior' ? '3.000' :
                    selectedNivel.includes('sdr') ? '1.800' : '0'
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
                    selectedNivel === 'pleno' ? '500' :
                    selectedNivel === 'senior' ? '550' :
                    selectedNivel.includes('junior') ? '450' :
                    selectedNivel.includes('pleno') ? '500' :
                    selectedNivel.includes('senior') ? '550' : '0'
                  }</p>
                </div>
                <div>
                  <span className="text-gray-600">
                    {selectedNivel.includes('sdr') ? 'Metas Semanais:' : 'Meta Semanal:'}
                  </span>
                  {selectedNivel.includes('sdr') ? (
                    <div className="font-medium">
                      {selectedNivel.includes('inbound') && (
                        <p>Inbound: {
                          selectedNivel.includes('junior') ? '55' :
                          selectedNivel.includes('pleno') ? '60' :
                          selectedNivel.includes('senior') ? '65' : '0'
                        } reuniões</p>
                      )}
                      {selectedNivel.includes('outbound') && (
                        <p>Outbound: {
                          selectedNivel.includes('junior') ? '27' :
                          selectedNivel.includes('pleno') ? '30' :
                          selectedNivel.includes('senior') ? '35' : '0'
                        } reuniões</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {
                        selectedNivel === 'junior' ? '6' :
                        selectedNivel === 'pleno' ? '7' :
                        selectedNivel === 'senior' ? '8' : '0'
                      } pts
                    </p>
                  )}
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