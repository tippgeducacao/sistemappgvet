import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetas } from '@/hooks/useMetas';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VendedorMeta {
  vendedorId: string;
  vendedorNome: string;
  vendedorFoto: string | null;
  metaAtual: number;
  novoValor: number;
}

const GerenciarMetas = () => {
  const { vendedores, loading: loadingVendedores } = useVendedores();
  const { metas, loading: loadingMetas, createMeta, updateMeta } = useMetas();
  const { toast } = useToast();
  
  const currentDate = new Date();
  const [selectedMes, setSelectedMes] = useState<number>(currentDate.getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState<number>(currentDate.getFullYear());
  const [vendedoresMetas, setVendedoresMetas] = useState<VendedorMeta[]>([]);
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

  // Função para gerar iniciais do nome
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Atualizar vendedoresMetas quando vendedores, metas, mes ou ano mudarem
  useEffect(() => {
    if (vendedores.length > 0) {
      const novosVendedoresMetas = vendedores.map(vendedor => {
        const metaExistente = metas.find(m => 
          m.vendedor_id === vendedor.id && 
          m.mes === selectedMes && 
          m.ano === selectedAno
        );
        
        return {
          vendedorId: vendedor.id,
          vendedorNome: vendedor.name,
          vendedorFoto: vendedor.photo_url,
          metaAtual: metaExistente?.meta_vendas || 0,
          novoValor: metaExistente?.meta_vendas || 0
        };
      });
      
      setVendedoresMetas(novosVendedoresMetas);
    }
  }, [vendedores, metas, selectedMes, selectedAno]);

  const handleMetaChange = (vendedorId: string, novoValor: number) => {
    setVendedoresMetas(prev => 
      prev.map(vendedor => 
        vendedor.vendedorId === vendedorId 
          ? { ...vendedor, novoValor }
          : vendedor
      )
    );
  };

  const handleSalvarTodas = async () => {
    setSubmitting(true);
    
    try {
      let sucessos = 0;
      
      for (const vendedorMeta of vendedoresMetas) {
        if (vendedorMeta.novoValor !== vendedorMeta.metaAtual) {
          const metaExistente = metas.find(m => 
            m.vendedor_id === vendedorMeta.vendedorId && 
            m.mes === selectedMes && 
            m.ano === selectedAno
          );

          if (metaExistente) {
            await updateMeta(metaExistente.id, vendedorMeta.novoValor);
          } else {
            await createMeta(vendedorMeta.vendedorId, selectedAno, selectedMes, vendedorMeta.novoValor);
          }
          sucessos++;
        }
      }
      
      if (sucessos > 0) {
        toast({
          title: "Metas salvas",
          description: `${sucessos} meta(s) foram atualizadas com sucesso`
        });
      } else {
        toast({
          title: "Nenhuma alteração",
          description: "Não foram detectadas alterações nas metas"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar metas",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
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

      <Card>
        <CardHeader>
          <CardTitle>Metas dos Vendedores</CardTitle>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="mes">Mês</Label>
              <Select value={selectedMes.toString()} onValueChange={(value) => setSelectedMes(parseInt(value))}>
                <SelectTrigger className="w-[150px]">
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
                <SelectTrigger className="w-[120px]">
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

            <Button 
              onClick={handleSalvarTodas} 
              disabled={submitting}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Todas
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg font-medium">
              <div>Vendedor</div>
              <div>Meta Atual</div>
              <div>Nova Meta</div>
            </div>
            
            {vendedoresMetas.map((vendedorMeta) => (
              <div key={vendedorMeta.vendedorId} className="grid grid-cols-3 gap-4 p-3 border rounded-lg items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={vendedorMeta.vendedorFoto || undefined} alt={vendedorMeta.vendedorNome} />
                    <AvatarFallback className="text-sm font-medium">
                      {getInitials(vendedorMeta.vendedorNome)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{vendedorMeta.vendedorNome}</span>
                </div>
                <div className="text-muted-foreground">
                  {vendedorMeta.metaAtual > 0 ? `${vendedorMeta.metaAtual} vendas` : 'Não definida'}
                </div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    value={vendedorMeta.novoValor}
                    onChange={(e) => handleMetaChange(vendedorMeta.vendedorId, parseInt(e.target.value) || 0)}
                    placeholder="Meta"
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarMetas;