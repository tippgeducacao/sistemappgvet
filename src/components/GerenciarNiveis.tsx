import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNiveis } from '@/hooks/useNiveis';
import { NiveisService, type NivelVendedor } from '@/services/niveisService';
import { Pencil, Trophy, Users, Target, Calculator, Shield } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { GerenciarComissionamento } from './comissionamento/GerenciarComissionamento';

const GerenciarNiveis: React.FC = () => {
  const { niveis, loading, updateNivel } = useNiveis();
  const [editingNivel, setEditingNivel] = useState<NivelVendedor | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const niveisVendedores = niveis.filter(n => n.tipo_usuario === 'vendedor');
  const niveisSDR = niveis.filter(n => n.tipo_usuario === 'sdr');
  const niveisSupervisor = niveis.filter(n => n.tipo_usuario === 'supervisor');


  const handleEditNivel = (nivel: NivelVendedor) => {
    setEditingNivel(nivel);
    setIsEditDialogOpen(true);
  };

  const handleSaveNivel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNivel) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const dados: any = {
      fixo_mensal: parseFloat(formData.get('fixo_mensal') as string),
      vale: parseFloat(formData.get('vale') as string),
      variavel_semanal: parseFloat(formData.get('variavel_semanal') as string),
    };

    if (editingNivel.tipo_usuario === 'sdr') {
      dados.meta_semanal_inbound = parseInt(formData.get('meta_semanal_sdr') as string);
      dados.meta_vendas_cursos = parseInt(formData.get('meta_vendas_cursos') as string);
    } else if (editingNivel.tipo_usuario === 'supervisor') {
      // Para supervisor, incluir o bônus por reunião B2B
      dados.bonus_reuniao_b2b = parseFloat(formData.get('bonus_reuniao_b2b') as string);
      dados.meta_semanal_vendedor = 0;
      dados.meta_semanal_inbound = 0;
      dados.meta_vendas_cursos = 0;
    } else {
      dados.meta_semanal_vendedor = parseInt(formData.get('meta_semanal_vendedor') as string);
    }

    try {
      await updateNivel(editingNivel.id, dados);
      setIsEditDialogOpen(false);
      setEditingNivel(null);
    } catch (error) {
      console.error('Erro ao salvar nível:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const NivelCard = ({ nivel }: { nivel: NivelVendedor }) => (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">
            {NiveisService.getNivelLabel(nivel.nivel, nivel.tipo_usuario)}
          </CardTitle>
           <Badge variant="outline" className={NiveisService.getNivelColor(nivel.nivel)}>
              {nivel.tipo_usuario === 'vendedor' ? 'Vendedor' : 
               nivel.tipo_usuario === 'sdr' ? 'SDR' :
               nivel.tipo_usuario === 'supervisor' ? 'Supervisor' :
               'Supervisor'}
           </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditNivel(nivel)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              {nivel.tipo_usuario === 'supervisor' ? 'Salário Fixo (CLT)' : 'Fixo Mensal'}
            </Label>
            <p className="text-lg font-semibold">{formatCurrency(nivel.fixo_mensal)}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              {nivel.tipo_usuario === 'supervisor' ? 'Vale (Alimentação)' : 'Vale'}
            </Label>
            <p className="text-lg font-semibold">{formatCurrency(nivel.vale)}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              {nivel.tipo_usuario === 'supervisor' ? 'Variável Semanal' : 'Variável Semanal'}
            </Label>
            <p className="text-lg font-semibold">{formatCurrency(nivel.variavel_semanal)}</p>
          </div>
          {nivel.tipo_usuario === 'supervisor' ? (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Bônus por Reunião B2B</Label>
              <p className="text-lg font-semibold">{formatCurrency(nivel.bonus_reuniao_b2b || 0)}</p>
            </div>
          ) : (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                {nivel.tipo_usuario === 'sdr' ? 'Metas Semanais' : 'Meta Semanal'}
              </Label>
              {nivel.tipo_usuario === 'sdr' ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Reuniões: {nivel.meta_semanal_inbound} por semana</p>
                  <p className="text-sm font-medium text-orange-600">Cursos: {nivel.meta_vendas_cursos} por semana</p>
                </div>
              ) : (
                <p className="text-lg font-semibold">{nivel.meta_semanal_vendedor} pontos</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Gerenciar Níveis</h1>
      </div>

      <Tabs defaultValue="vendedores" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vendedores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vendedores
          </TabsTrigger>
          <TabsTrigger value="sdr" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            SDR
          </TabsTrigger>
          <TabsTrigger value="supervisor" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Supervisor
          </TabsTrigger>
          <TabsTrigger value="comissionamento" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Comissionamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendedores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Níveis de Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {niveisVendedores.map((nivel) => (
                  <NivelCard key={nivel.id} nivel={nivel} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Níveis de SDR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {niveisSDR.map((nivel) => (
                  <NivelCard key={nivel.id} nivel={nivel} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supervisor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Níveis de Supervisor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {niveisSupervisor.map((nivel) => (
                  <NivelCard key={nivel.id} nivel={nivel} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comissionamento" className="space-y-4">
          <GerenciarComissionamento />
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Editar {editingNivel ? NiveisService.getNivelLabel(editingNivel.nivel, editingNivel.tipo_usuario) : ''}
            </DialogTitle>
          </DialogHeader>
          {editingNivel && (
            <form onSubmit={handleSaveNivel} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="fixo_mensal">
                     {editingNivel.tipo_usuario === 'supervisor' ? 'Salário Fixo (CLT) (R$)' : 'Fixo Mensal (R$)'}
                   </Label>
                   <Input
                     id="fixo_mensal"
                     name="fixo_mensal"
                     type="number"
                     step="0.01"
                     defaultValue={editingNivel.fixo_mensal}
                     required
                   />
                 </div>
                 <div>
                   <Label htmlFor="vale">
                     {editingNivel.tipo_usuario === 'supervisor' ? 'Vale (Alimentação) (R$)' : 'Vale (R$)'}
                   </Label>
                   <Input
                     id="vale"
                     name="vale"
                     type="number"
                     step="0.01"
                     defaultValue={editingNivel.vale}
                     required
                   />
                 </div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="variavel_semanal">
                      {editingNivel.tipo_usuario === 'supervisor' ? 'Variável Semanal (R$)' : 'Variável Semanal (R$)'}
                    </Label>
                   <Input
                     id="variavel_semanal"
                     name="variavel_semanal"
                     type="number"
                     step="0.01"
                     defaultValue={editingNivel.variavel_semanal}
                     required
                   />
                 </div>
                 {editingNivel.tipo_usuario !== 'supervisor' && (
                   <div>
                     <Label htmlFor="meta_semanal_vendedor">Meta Semanal (pontos)</Label>
                     <Input
                       id="meta_semanal_vendedor"
                       name="meta_semanal_vendedor"
                       type="number"
                       defaultValue={editingNivel.meta_semanal_vendedor}
                       required
                     />
                   </div>
                 )}
                 {editingNivel.tipo_usuario === 'supervisor' && (
                   <div>
                     <Label htmlFor="bonus_reuniao_b2b">Bônus por Reunião B2B (R$)</Label>
                     <Input
                       id="bonus_reuniao_b2b"
                       name="bonus_reuniao_b2b"
                       type="number"
                       step="0.01"
                       defaultValue={editingNivel.bonus_reuniao_b2b || 0}
                       required
                     />
                   </div>
                 )}
                 </div>
               {editingNivel.tipo_usuario === 'sdr' && (
                <>
                  <div>
                    <Label htmlFor="meta_semanal_sdr">Meta de Reuniões (por semana)</Label>
                    <Input
                      id="meta_semanal_sdr"
                      name="meta_semanal_sdr"
                      type="number"
                      defaultValue={editingNivel.meta_semanal_inbound}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="meta_vendas_cursos">Meta Vendas de Cursos (semanal)</Label>
                    <Input
                      id="meta_vendas_cursos"
                      name="meta_vendas_cursos"
                      type="number"
                      defaultValue={editingNivel.meta_vendas_cursos}
                      required
                    />
                  </div>
                </>
               )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarNiveis;