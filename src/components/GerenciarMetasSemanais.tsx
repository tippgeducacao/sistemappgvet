import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VendedorMetaSemanal {
  vendedorId: string;
  vendedorNome: string;
  vendedorFoto: string | null;
  metasSemanais: { [semana: number]: number };
}

const GerenciarMetasSemanais = () => {
  const { vendedores, loading: loadingVendedores } = useVendedores();
  const { metasSemanais, loading: loadingMetas, createMetaSemanal, updateMetaSemanal, getSemanasDoMes } = useMetasSemanais();
  const { toast } = useToast();
  
  const currentDate = new Date();
  const [selectedMes, setSelectedMes] = useState<number>(currentDate.getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState<number>(currentDate.getFullYear());
  const [vendedoresMetasSemanais, setVendedoresMetasSemanais] = useState<VendedorMetaSemanal[]>([]);
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
      const semanasDoMes = getSemanasDoMes(selectedAno, selectedMes);
      
      const novosVendedoresMetasSemanais = vendedores.map(vendedor => {
        const metasVendedor: { [semana: number]: number } = {};
        
        semanasDoMes.forEach(semana => {
          const metaExistente = metasSemanais.find(m => 
            m.vendedor_id === vendedor.id && 
            m.semana === semana && 
            m.ano === selectedAno
          );
          metasVendedor[semana] = metaExistente?.meta_vendas || 0;
        });
        
        return {
          vendedorId: vendedor.id,
          vendedorNome: vendedor.name,
          vendedorFoto: vendedor.photo_url,
          metasSemanais: metasVendedor
        };
      });
      
      setVendedoresMetasSemanais(novosVendedoresMetasSemanais);
    }
  }, [vendedores, metasSemanais, selectedMes, selectedAno, getSemanasDoMes]);

  const handleMetaChange = (vendedorId: string, semana: number, novoValor: number) => {
    setVendedoresMetasSemanais(prev => 
      prev.map(vendedor => 
        vendedor.vendedorId === vendedorId 
          ? { 
              ...vendedor, 
              metasSemanais: { 
                ...vendedor.metasSemanais, 
                [semana]: novoValor 
              } 
            }
          : vendedor
      )
    );
  };

  const handleSalvarTodas = async () => {
    setSubmitting(true);
    
    try {
      let sucessos = 0;
      
      for (const vendedorMeta of vendedoresMetasSemanais) {
        for (const [semana, meta] of Object.entries(vendedorMeta.metasSemanais)) {
          const metaAtualBanco = metasSemanais.find(m => 
            m.vendedor_id === vendedorMeta.vendedorId && 
            m.semana === parseInt(semana) && 
            m.ano === selectedAno
          );

          const metaAtual = metaAtualBanco?.meta_vendas || 0;

          console.log('🎯 Salvando meta:', {
            vendedorId: vendedorMeta.vendedorId,
            semana: parseInt(semana),
            meta,
            metaAtual,
            metaAtualBanco,
            ano: selectedAno
          });

          if (meta !== metaAtual) {
            try {
              if (metaAtualBanco) {
                const result = await updateMetaSemanal(metaAtualBanco.id, meta);
                console.log('✅ Meta atualizada:', result);
              } else {
                const result = await createMetaSemanal(vendedorMeta.vendedorId, selectedAno, parseInt(semana), meta);
                console.log('✅ Meta criada:', result);
              }
              sucessos++;
            } catch (error) {
              console.error('❌ Erro ao salvar meta:', error);
              throw error;
            }
          }
        }
      }
      
      if (sucessos > 0) {
        toast({
          title: "Metas semanais salvas",
          description: `${sucessos} meta(s) semanal(is) foram atualizadas com sucesso`
        });
      } else {
        toast({
          title: "Nenhuma alteração",
          description: "Não foram detectadas alterações nas metas semanais"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar metas semanais",
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

  const semanasDoMes = getSemanasDoMes(selectedAno, selectedMes);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Gerenciar Metas Semanais</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metas Semanais dos Vendedores</CardTitle>
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
          {semanasDoMes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma semana encontrada para este período</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header das semanas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="font-medium">Vendedor</div>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${semanasDoMes.length}, 1fr)` }}>
                  {semanasDoMes.map((semana) => (
                    <div key={semana} className="text-center font-medium text-sm">
                      Sem {semana}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Dados dos vendedores */}
              {vendedoresMetasSemanais.map((vendedorMeta) => (
                <div key={vendedorMeta.vendedorId} className="grid grid-cols-2 gap-4 p-3 border rounded-lg items-center">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={vendedorMeta.vendedorFoto || undefined} alt={vendedorMeta.vendedorNome} />
                      <AvatarFallback className="text-sm font-medium">
                        {getInitials(vendedorMeta.vendedorNome)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{vendedorMeta.vendedorNome}</span>
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${semanasDoMes.length}, 1fr)` }}>
                    {semanasDoMes.map((semana) => (
                      <Input
                        key={semana}
                        type="number"
                        min="0"
                        value={vendedorMeta.metasSemanais[semana] || 0}
                        onChange={(e) => handleMetaChange(vendedorMeta.vendedorId, semana, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full text-center"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarMetasSemanais;