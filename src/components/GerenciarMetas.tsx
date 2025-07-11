import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetas } from '@/hooks/useMetas';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, Calendar, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const GerenciarMetas = () => {
  const { vendedores, loading: loadingVendedores } = useVendedores();
  const { metas, loading: loadingMetas, createMeta, updateMeta } = useMetas();
  const { toast } = useToast();
  
  const currentDate = new Date();
  const [selectedVendedor, setSelectedVendedor] = useState<string>('');
  const [selectedMes, setSelectedMes] = useState<number>(currentDate.getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState<number>(currentDate.getFullYear());
  const [metaVendas, setMetaVendas] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const anos = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVendedor || metaVendas < 0) {
      toast({
        title: "Erro",
        description: "Selecione um vendedor e defina uma meta válida",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const metaExistente = metas.find(m => 
        m.vendedor_id === selectedVendedor && 
        m.mes === selectedMes && 
        m.ano === selectedAno
      );

      if (metaExistente) {
        await updateMeta(metaExistente.id, metaVendas);
        toast({
          title: "Meta atualizada",
          description: "Meta do vendedor foi atualizada com sucesso"
        });
      } else {
        await createMeta(selectedVendedor, selectedAno, selectedMes, metaVendas);
        toast({
          title: "Meta criada",
          description: "Nova meta foi criada com sucesso"
        });
      }
      
      setSelectedVendedor('');
      setMetaVendas(0);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar meta",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getMetaAtual = (vendedorId: string) => {
    return metas.find(m => 
      m.vendedor_id === vendedorId && 
      m.mes === selectedMes && 
      m.ano === selectedAno
    );
  };

  if (loadingVendedores || loadingMetas) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Gerenciar Metas</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário para criar/editar metas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Definir Meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mes">Mês</Label>
                  <Select value={selectedMes.toString()} onValueChange={(value) => setSelectedMes(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meses.map((mes) => (
                        <SelectItem key={mes.value} value={mes.value.toString()}>
                          {mes.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="ano">Ano</Label>
                  <Select value={selectedAno.toString()} onValueChange={(value) => setSelectedAno(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {anos.map((ano) => (
                        <SelectItem key={ano} value={ano.toString()}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="vendedor">Vendedor</Label>
                <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map((vendedor) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>
                        {vendedor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="meta">Meta de Vendas (mensal)</Label>
                <Input
                  id="meta"
                  type="number"
                  min="0"
                  value={metaVendas}
                  onChange={(e) => setMetaVendas(parseInt(e.target.value) || 0)}
                  placeholder="Ex: 50"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Meta'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de metas atuais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Metas Atuais - {meses.find(m => m.value === selectedMes)?.label} {selectedAno}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendedores.map((vendedor) => {
                const meta = getMetaAtual(vendedor.id);
                return (
                  <div key={vendedor.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{vendedor.name}</span>
                      <span className="text-sm text-muted-foreground">
                        Meta: {meta?.meta_vendas || 0} vendas
                      </span>
                    </div>
                    {meta && (
                      <div className="space-y-2">
                        <Progress value={0} className="h-2" />
                        <div className="text-xs text-muted-foreground text-center">
                          0 / {meta.meta_vendas} vendas aprovadas
                        </div>
                      </div>
                    )}
                    {!meta && (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        Nenhuma meta definida
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GerenciarMetas;