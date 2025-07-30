import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, Calendar, RotateCcw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useNiveis } from '@/hooks/useNiveis';

interface VendedorInfo {
  vendedorId: string;
  vendedorNome: string;
  vendedorFoto: string | null;
  nivel: string;
  metaSemanalAtual: number;
}

const GerenciarMetas = () => {
  const { vendedores, loading: loadingVendedores } = useVendedores();
  const { niveis, loading: loadingNiveis } = useNiveis();
  const { toast } = useToast();
  
  // Estados para filtro - usar lógica de semanas consistente
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  const { mes: mesCorreto, ano: anoCorreto } = getMesAnoSemanaAtual();
  const [selectedMes, setSelectedMes] = useState<number>(mesCorreto);
  const [selectedAno, setSelectedAno] = useState<number>(anoCorreto);
  const [vendedoresInfo, setVendedoresInfo] = useState<VendedorInfo[]>([]);
  const [generating, setGenerating] = useState(false);

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

  const anos = Array.from({ length: 5 }, (_, i) => anoCorreto - 2 + i);

  // Função para gerar iniciais do nome
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Atualizar vendedoresInfo quando vendedores ou níveis mudarem
  useEffect(() => {
    if (vendedores.length > 0 && niveis.length > 0) {
      const novosVendedoresInfo = vendedores
        .filter(vendedor => ['vendedor', 'sdr_inbound', 'sdr_outbound'].includes(vendedor.user_type))
        .map(vendedor => {
          const nivelVendedor = niveis.find(n => n.nivel === vendedor.nivel);
          
          return {
            vendedorId: vendedor.id,
            vendedorNome: vendedor.name,
            vendedorFoto: vendedor.photo_url,
            nivel: vendedor.nivel || 'junior',
            metaSemanalAtual: nivelVendedor?.meta_semanal_vendedor || 0
          };
        });
      
      setVendedoresInfo(novosVendedoresInfo);
    }
  }, [vendedores, niveis]);

  const handleGerarMetasSemanais = async () => {
    setGenerating(true);
    
    try {
      const { error } = await supabase.rpc('generate_monthly_weekly_goals', {
        p_ano: selectedAno,
        p_mes: selectedMes
      });

      if (error) throw error;
      
      toast({
        title: "Metas geradas com sucesso",
        description: `Metas semanais geradas para ${meses.find(m => m.value === selectedMes)?.label} de ${selectedAno}`
      });
    } catch (error) {
      console.error('Erro ao gerar metas semanais:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar metas semanais",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loadingVendedores || loadingNiveis) {
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
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gerador de Metas Semanais
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            As metas semanais são geradas automaticamente baseadas no nível de cada vendedor. 
            Cada semana vai de quarta 00:00 até terça 23:59.
          </p>
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
              onClick={handleGerarMetasSemanais} 
              disabled={generating}
              className="flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Gerar Metas Semanais
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg font-medium">
              <div>Vendedor</div>
              <div>Nível</div>
              <div>Meta Semanal</div>
            </div>
            
            {vendedoresInfo.map((vendedorInfo) => (
              <div key={vendedorInfo.vendedorId} className="grid grid-cols-3 gap-4 p-3 border rounded-lg items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={vendedorInfo.vendedorFoto || undefined} alt={vendedorInfo.vendedorNome} />
                    <AvatarFallback className="text-sm font-medium">
                      {getInitials(vendedorInfo.vendedorNome)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{vendedorInfo.vendedorNome}</span>
                </div>
                <div className="text-muted-foreground capitalize">
                  {vendedorInfo.nivel.replace('_', ' ')}
                </div>
                <div className="font-medium">
                  {vendedorInfo.metaSemanalAtual} pontos/semana
                </div>
              </div>
            ))}
          </div>
          
          {vendedoresInfo.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum vendedor encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarMetas;