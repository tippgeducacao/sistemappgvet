import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { User, TrendingUp, Save, X, Clock, GraduationCap } from 'lucide-react';
import { useNiveis } from '@/hooks/useNiveis';
import { useCursos } from '@/hooks/useCursos';
import { NiveisService } from '@/services/niveisService';
import { UserService } from '@/services/user/UserService';
import type { Vendedor } from '@/services/vendedoresService';
import { useToast } from '@/hooks/use-toast';

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
  const { cursos } = useCursos();
  const { toast } = useToast();
  const [selectedNivel, setSelectedNivel] = useState<'junior' | 'pleno' | 'senior' | 'sdr_inbound_junior' | 'sdr_inbound_pleno' | 'sdr_inbound_senior' | 'sdr_outbound_junior' | 'sdr_outbound_pleno' | 'sdr_outbound_senior'>('junior');
  const [selectedPosGraduacoes, setSelectedPosGraduacoes] = useState<string[]>([]);
  const [horarioTrabalho, setHorarioTrabalho] = useState({
    manha_inicio: '09:00',
    manha_fim: '12:00',
    tarde_inicio: '13:00',
    tarde_fim: '18:00'
  });
  const [saving, setSaving] = useState(false);

  // Filtrar apenas pós-graduações
  const posGraduacoes = cursos.filter(curso => 
    curso.modalidade?.toLowerCase().includes('pós') || 
    curso.modalidade?.toLowerCase().includes('pos')
  );

  React.useEffect(() => {
    if (vendedor) {
      // Mapear níveis antigos para novos
      const nivelMap: Record<string, typeof selectedNivel> = {
        'sdr_junior': 'sdr_inbound_junior',
        'sdr_pleno': 'sdr_inbound_pleno', 
        'sdr_senior': 'sdr_inbound_senior'
      };
      const novoNivel = nivelMap[vendedor.nivel] || vendedor.nivel as typeof selectedNivel;
      setSelectedNivel(novoNivel);

      // Carregar pós-graduações do vendedor
      if (vendedor.pos_graduacoes) {
        setSelectedPosGraduacoes(vendedor.pos_graduacoes);
      }

      // Carregar horário de trabalho do vendedor
      if (vendedor.horario_trabalho) {
        setHorarioTrabalho(vendedor.horario_trabalho);
      }
    }
  }, [vendedor]);

  const handleSave = async () => {
    if (!vendedor) return;

    try {
      setSaving(true);
      
      // Atualizar nível
      await updateVendedorNivel(vendedor.id, selectedNivel);
      
      // Atualizar pós-graduações e horário de trabalho
      await UserService.updateProfile(vendedor.id, {
        pos_graduacoes: selectedPosGraduacoes,
        horario_trabalho: horarioTrabalho
      });

      toast({
        title: "Sucesso",
        description: "Vendedor atualizado com sucesso!",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar vendedor",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePosGraduacao = (cursoId: string) => {
    setSelectedPosGraduacoes(prev => {
      if (prev.includes(cursoId)) {
        return prev.filter(id => id !== cursoId);
      } else if (prev.length < 5) {
        return [...prev, cursoId];
      } else {
        toast({
          title: "Limite atingido",
          description: "Máximo de 5 pós-graduações por vendedor",
          variant: "destructive",
        });
        return prev;
      }
    });
  };

  if (!vendedor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Pós-graduações (apenas para vendedores) */}
          {(vendedor.user_type === 'vendedor' || 
            vendedor.user_type === 'sdr_inbound' || 
            vendedor.user_type === 'sdr_outbound') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <Label className="text-sm font-medium text-gray-700">
                  Pós-graduações ({selectedPosGraduacoes.length}/5)
                </Label>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {posGraduacoes.length > 0 ? (
                  posGraduacoes.map((curso) => (
                    <div key={curso.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={curso.id}
                        checked={selectedPosGraduacoes.includes(curso.id)}
                        onCheckedChange={() => togglePosGraduacao(curso.id)}
                        disabled={!selectedPosGraduacoes.includes(curso.id) && selectedPosGraduacoes.length >= 5}
                      />
                      <Label
                        htmlFor={curso.id}
                        className={`text-sm cursor-pointer ${
                          !selectedPosGraduacoes.includes(curso.id) && selectedPosGraduacoes.length >= 5
                            ? 'text-gray-400' 
                            : 'text-gray-700'
                        }`}
                      >
                        {curso.nome}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Nenhuma pós-graduação disponível
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Horário de trabalho */}
          {(vendedor.user_type === 'vendedor' || 
            vendedor.user_type === 'sdr_inbound' || 
            vendedor.user_type === 'sdr_outbound') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Label className="text-sm font-medium text-gray-700">
                  Horário de Trabalho
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Manhã - Início</Label>
                  <Input
                    type="time"
                    value={horarioTrabalho.manha_inicio}
                    onChange={(e) => setHorarioTrabalho(prev => ({
                      ...prev,
                      manha_inicio: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Manhã - Fim</Label>
                  <Input
                    type="time"
                    value={horarioTrabalho.manha_fim}
                    onChange={(e) => setHorarioTrabalho(prev => ({
                      ...prev,
                      manha_fim: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Tarde - Início</Label>
                  <Input
                    type="time"
                    value={horarioTrabalho.tarde_inicio}
                    onChange={(e) => setHorarioTrabalho(prev => ({
                      ...prev,
                      tarde_inicio: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Tarde - Fim</Label>
                  <Input
                    type="time"
                    value={horarioTrabalho.tarde_fim}
                    onChange={(e) => setHorarioTrabalho(prev => ({
                      ...prev,
                      tarde_fim: e.target.value
                    }))}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <span className="font-medium">Horário atual:</span> {horarioTrabalho.manha_inicio} às {horarioTrabalho.manha_fim} | {horarioTrabalho.tarde_inicio} às {horarioTrabalho.tarde_fim}
              </div>
            </div>
          )}

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