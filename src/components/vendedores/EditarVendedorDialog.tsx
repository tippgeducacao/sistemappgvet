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
import { useGruposPosGraduacoes } from '@/hooks/useGruposPosGraduacoes';
import { NiveisService } from '@/services/niveisService';
import { UserService } from '@/services/user/UserService';
import type { Vendedor } from '@/services/vendedoresService';
import { useToast } from '@/hooks/use-toast';
import type { HorarioTrabalho } from '@/utils/horarioUtils';

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
  const { grupos } = useGruposPosGraduacoes();
  const { cursos } = useCursos();
  const { toast } = useToast();
  const [selectedNivel, setSelectedNivel] = useState<string>('');
  const [selectedGruposPosGraduacoes, setSelectedGruposPosGraduacoes] = useState<string[]>([]);
  const [horarioTrabalho, setHorarioTrabalho] = useState<HorarioTrabalho>({
    dias_trabalho: 'segunda_sabado',
    segunda_sexta: {
      periodo1_inicio: '09:00',
      periodo1_fim: '12:00',
      periodo2_inicio: '13:00',
      periodo2_fim: '18:00'
    },
    sabado: {
      periodo1_inicio: '09:00',
      periodo1_fim: '12:00',
      periodo2_inicio: '',
      periodo2_fim: ''
    }
  });
  const [saving, setSaving] = useState(false);

  // Filtrar apenas pós-graduações
  const posGraduacoes = cursos.filter(curso => 
    curso.modalidade?.toLowerCase().includes('pós') || 
    curso.modalidade?.toLowerCase().includes('pos')
  );

  React.useEffect(() => {
    if (vendedor) {
      // Não definir nível para admin
      if (vendedor.user_type !== 'admin') {
        const nivelMap: Record<string, string> = {
          'sdr_junior': 'sdr_inbound_junior',
          'sdr_pleno': 'sdr_inbound_pleno', 
          'sdr_senior': 'sdr_inbound_senior'
        };
        const novoNivel = nivelMap[vendedor.nivel] || vendedor.nivel || 'junior';
        setSelectedNivel(novoNivel);
      } else {
        setSelectedNivel('');
      }

      // Carregar grupos de pós-graduações do vendedor - garantir que seja sempre um array válido
      if (vendedor.pos_graduacoes && Array.isArray(vendedor.pos_graduacoes)) {
        setSelectedGruposPosGraduacoes(vendedor.pos_graduacoes);
      } else {
        // Limpar seleções se não há dados válidos
        setSelectedGruposPosGraduacoes([]);
      }

      // Carregar horário de trabalho do vendedor
      if (vendedor.horario_trabalho) {
        const horario = vendedor.horario_trabalho as any;
        // Verificar se é formato antigo
        if (horario.manha_inicio) {
          // Converter formato antigo para novo
          setHorarioTrabalho({
            dias_trabalho: 'segunda_sabado',
            segunda_sexta: {
              periodo1_inicio: horario.manha_inicio || '09:00',
              periodo1_fim: horario.manha_fim || '12:00',
              periodo2_inicio: horario.tarde_inicio || '13:00',
              periodo2_fim: horario.tarde_fim || '18:00'
            },
            sabado: {
              periodo1_inicio: '09:00',
              periodo1_fim: '12:00',
              periodo2_inicio: '',
              periodo2_fim: ''
            }
          });
        } else {
          setHorarioTrabalho(horario);
        }
      }
    } else {
      // Limpar todos os estados quando não há vendedor
      setSelectedNivel('');
      setSelectedGruposPosGraduacoes([]);
      setHorarioTrabalho({
        dias_trabalho: 'segunda_sabado',
        segunda_sexta: {
          periodo1_inicio: '09:00',
          periodo1_fim: '12:00',
          periodo2_inicio: '13:00',
          periodo2_fim: '18:00'
        },
        sabado: {
          periodo1_inicio: '09:00',
          periodo1_fim: '12:00',
          periodo2_inicio: '',
          periodo2_fim: ''
        }
      });
    }
  }, [vendedor, open]); // Adicionar 'open' como dependência para limpar quando fecha

  const handleSave = async () => {
    if (!vendedor) return;

    try {
      setSaving(true);
      
      // Atualizar nível (apenas se não for admin)
      if (vendedor.user_type !== 'admin' && selectedNivel) {
        await updateVendedorNivel(vendedor.id, selectedNivel as any);
      }
      
      // Atualizar grupos de pós-graduações e horário de trabalho
      await UserService.updateProfile(vendedor.id, {
        pos_graduacoes: selectedGruposPosGraduacoes,
        horario_trabalho: horarioTrabalho
      });

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleGrupoPosGraduacao = (grupoId: string) => {
    setSelectedGruposPosGraduacoes(prev => {
      if (prev.includes(grupoId)) {
        return prev.filter(id => id !== grupoId);
      } else if (prev.length < 10) {
        return [...prev, grupoId];
      } else {
        toast({
          title: "Limite atingido",
          description: "Máximo de 10 grupos de pós-graduações por vendedor",
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
          {/* Informações do usuário */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Usuário</Label>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex-1">
                <p className="font-medium text-foreground">{vendedor.name}</p>
                <p className="text-sm text-muted-foreground">{vendedor.email}</p>
                <p className="text-sm text-muted-foreground">{vendedor.user_type}</p>
              </div>
              {vendedor.user_type !== 'admin' && vendedor.nivel && (
                <Badge variant="outline" className={NiveisService.getNivelColor(vendedor.nivel || 'junior')}>
                  {NiveisService.getNivelLabel(vendedor.nivel || 'junior')}
                </Badge>
              )}
            </div>
          </div>

          {/* Seleção de nível - apenas para não-admins */}
          {vendedor.user_type !== 'admin' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Novo Nível
                </Label>
                <Select value={selectedNivel || undefined} onValueChange={setSelectedNivel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
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
              {selectedNivel && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Informações do Nível</Label>
                  <div className="p-3 bg-accent/20 rounded-lg border border-accent/30">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Fixo Mensal:</span>
                        <p className="font-medium text-foreground">R$ {
                          selectedNivel === 'junior' ? '2.200' :
                          selectedNivel === 'pleno' ? '2.600' :
                          selectedNivel === 'senior' ? '3.000' :
                          selectedNivel.includes('sdr') ? '1.800' : '0'
                        }</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vale:</span>
                        <p className="font-medium text-foreground">R$ 400</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Variável Semanal:</span>
                        <p className="font-medium text-foreground">R$ {
                          selectedNivel === 'junior' ? '450' :
                          selectedNivel === 'pleno' ? '500' :
                          selectedNivel === 'senior' ? '550' :
                          selectedNivel.includes('junior') ? '450' :
                          selectedNivel.includes('pleno') ? '500' :
                          selectedNivel.includes('senior') ? '550' : '0'
                        }</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {selectedNivel.includes('sdr') ? 'Metas Semanais:' : 'Meta Semanal:'}
                        </span>
                        {selectedNivel.includes('sdr') ? (
                          <div className="font-medium text-foreground">
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
                          <p className="font-medium text-foreground flex items-center gap-1">
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
              )}
            </>
          )}

          {/* Grupos de Pós-graduações (apenas para vendedores e SDRs) */}
          {(vendedor.user_type === 'vendedor' || 
            vendedor.user_type === 'sdr_inbound' || 
            vendedor.user_type === 'sdr_outbound') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-foreground" />
                <Label className="text-sm font-medium text-foreground">
                  Grupos que pode vender ({selectedGruposPosGraduacoes.length}/10)
                </Label>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {grupos.length > 0 ? (
                  grupos.map((grupo) => (
                    <div key={grupo.id} className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={grupo.id}
                          checked={selectedGruposPosGraduacoes.includes(grupo.id)}
                          onCheckedChange={() => toggleGrupoPosGraduacao(grupo.id)}
                          disabled={!selectedGruposPosGraduacoes.includes(grupo.id) && selectedGruposPosGraduacoes.length >= 10}
                        />
                        <Label
                          htmlFor={grupo.id}
                          className={`text-sm cursor-pointer font-medium ${
                            !selectedGruposPosGraduacoes.includes(grupo.id) && selectedGruposPosGraduacoes.length >= 10
                              ? 'text-muted-foreground/50' 
                              : 'text-foreground'
                          }`}
                        >
                          {grupo.nome}
                        </Label>
                      </div>
                      {grupo.cursos && grupo.cursos.length > 0 && (
                        <div className="ml-6 text-xs text-muted-foreground">
                          {grupo.cursos.map(curso => curso.nome).join(', ')}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhum grupo de pós-graduação disponível
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Horário de trabalho (para todos os tipos de usuário) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-foreground" />
              <Label className="text-sm font-medium text-foreground">
                Horário de Trabalho
              </Label>
            </div>
            
            {/* Seleção de dias */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Dias de Trabalho</Label>
              <Select 
                value={horarioTrabalho.dias_trabalho} 
                onValueChange={(value: 'segunda_sabado' | 'personalizado') => 
                  setHorarioTrabalho(prev => ({ ...prev, dias_trabalho: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="segunda_sabado">Segunda a Sábado</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dias personalizados */}
            {horarioTrabalho.dias_trabalho === 'personalizado' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Selecione os dias</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].map((dia) => (
                    <div key={dia} className="flex items-center space-x-2">
                      <Checkbox
                        id={dia}
                        checked={horarioTrabalho.dias_personalizados?.includes(dia) || false}
                        onCheckedChange={(checked) => {
                          const dias = horarioTrabalho.dias_personalizados || [];
                          setHorarioTrabalho(prev => ({
                            ...prev,
                            dias_personalizados: checked 
                              ? [...dias, dia]
                              : dias.filter(d => d !== dia)
                          }));
                        }}
                      />
                      <label htmlFor={dia} className="text-xs capitalize text-foreground">
                        {dia === 'terca' ? 'Ter' : dia === 'quarta' ? 'Qua' : 
                         dia === 'quinta' ? 'Qui' : dia === 'sabado' ? 'Sáb' : dia.slice(0,3)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Horários Segunda a Sexta */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Segunda a Sexta</Label>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">1º - Início</Label>
                  <Input
                    type="time"
                    value={horarioTrabalho.segunda_sexta.periodo1_inicio}
                    onChange={(e) => setHorarioTrabalho(prev => ({
                      ...prev,
                      segunda_sexta: { ...prev.segunda_sexta, periodo1_inicio: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">1º - Fim</Label>
                  <Input
                    type="time"
                    value={horarioTrabalho.segunda_sexta.periodo1_fim}
                    onChange={(e) => setHorarioTrabalho(prev => ({
                      ...prev,
                      segunda_sexta: { ...prev.segunda_sexta, periodo1_fim: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">2º - Início</Label>
                  <Input
                    type="time"
                    value={horarioTrabalho.segunda_sexta.periodo2_inicio}
                    onChange={(e) => setHorarioTrabalho(prev => ({
                      ...prev,
                      segunda_sexta: { ...prev.segunda_sexta, periodo2_inicio: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">2º - Fim</Label>
                  <Input
                    type="time"
                    value={horarioTrabalho.segunda_sexta.periodo2_fim}
                    onChange={(e) => setHorarioTrabalho(prev => ({
                      ...prev,
                      segunda_sexta: { ...prev.segunda_sexta, periodo2_fim: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Horários Sábado */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Sábado</Label>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">1º - Início</Label>
                  <Input
                    type="time"
                    value={horarioTrabalho.sabado.periodo1_inicio}
                    onChange={(e) => setHorarioTrabalho(prev => ({
                      ...prev,
                      sabado: { ...prev.sabado, periodo1_inicio: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">1º - Fim</Label>
                  <Input
                    type="time"
                    value={horarioTrabalho.sabado.periodo1_fim}
                    onChange={(e) => setHorarioTrabalho(prev => ({
                      ...prev,
                      sabado: { ...prev.sabado, periodo1_fim: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">2º - Início</Label>
                  <Input
                    type="time"
                    value={horarioTrabalho.sabado.periodo2_inicio}
                    onChange={(e) => setHorarioTrabalho(prev => ({
                      ...prev,
                      sabado: { ...prev.sabado, periodo2_inicio: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">2º - Fim</Label>
                  <Input
                    type="time"
                    value={horarioTrabalho.sabado.periodo2_fim}
                    onChange={(e) => setHorarioTrabalho(prev => ({
                      ...prev,
                      sabado: { ...prev.sabado, periodo2_fim: e.target.value }
                    }))}
                  />
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
              disabled={saving}
              className="flex-1"
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