import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MetasSemanaisService, type MetaSemanalVendedor } from '@/services/metas/MetasSemanaisService';
import SDRMetasHistory from './sdr/SDRMetasHistory';

interface MetasHistoryTabProps {
  userId: string;
  userType: string;
}

export default function MetasHistoryTab({ userId, userType }: MetasHistoryTabProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(8); // Agosto
  const [metas, setMetas] = useState<MetaSemanalVendedor[]>([]);
  const [loading, setLoading] = useState(false);

  // Debug: Log do userType recebido
  console.log('🔍 MetasHistoryTab - userType recebido:', userType);

  // Buscar metas do vendedor
  const buscarMetasVendedor = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const metasEncontradas = await MetasSemanaisService.buscarOuCriarMetas(
        userId, 
        selectedYear, 
        selectedMonth || undefined
      );
      
      console.log('📈 Metas encontradas:', metasEncontradas);
      setMetas(metasEncontradas);
    } catch (error) {
      console.error('❌ Erro ao buscar metas:', error);
      setMetas([]);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedYear, selectedMonth]);

  useEffect(() => {
    console.log(`🔍 MetasHistoryTab: Buscando metas para vendedor ${userId}, ano ${selectedYear}, mês ${selectedMonth}`);
    buscarMetasVendedor();
  }, [userId, selectedYear, selectedMonth, buscarMetasVendedor]);

  // Função para determinar o status da meta
  const getStatusMeta = (percentual: number) => {
    if (percentual >= 100) {
      return { label: 'Bateu', variant: 'default' };
    } else if (percentual >= 80) {
      return { label: 'Quase lá', variant: 'secondary' };
    } else if (percentual > 0) {
      return { label: 'Não Bateu', variant: 'destructive' };
    } else {
      return { label: 'Sem Atividade', variant: 'outline' };
    }
  };

  // Se for SDR, usar o componente específico (verificação mais rigorosa)
  if (userType === 'sdr' || userType === 'sdr_inbound' || userType === 'sdr_outbound') {
    return <SDRMetasHistory userId={userId} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Performance Semanal Detalhada
          </CardTitle>
          <CardDescription>
            Histórico detalhado de metas semanais e performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês (opcional)</label>
              <Select 
                value={selectedMonth?.toString() || "all"} 
                onValueChange={(value) => setSelectedMonth(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {new Date(2025, month - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Semanas */}
          {metas.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Semanas {selectedMonth ? `de ${new Date(2025, (selectedMonth || 1) - 1).toLocaleDateString('pt-BR', { month: 'long' })}` : `do ano ${selectedYear}`}
              </h3>
              
              <div className="grid gap-4">
                {metas.map((meta) => {
                  // Para vendedores, não há dados de vendas ainda
                  const realizados = 0;
                  const percentual = meta.meta_vendas > 0 ? (realizados / meta.meta_vendas) * 100 : 0;
                  const status = getStatusMeta(percentual);
                  
                  return (
                    <div key={`${meta.ano}-${meta.semana}`} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Semana {meta.semana}</h4>
                          <p className="text-sm text-muted-foreground">
                            Ano {meta.ano}
                          </p>
                        </div>
                        <Badge variant={status.variant as any}>
                          {status.label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Meta:</span>
                          <span className="ml-2 font-medium">{meta.meta_vendas}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Realizados:</span>
                          <span className="ml-2 font-medium">{realizados}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{percentual.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(percentual, 100)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma semana histórica encontrada para o período selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card Explicativo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona o histórico:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>• Período:</strong> Sistema respeita a regra das terças-feiras - a semana vai de quarta a terça</p>
          <p><strong>• Histórico:</strong> Mostra semanas passadas, atual e futuras automaticamente</p>
          <p><strong>• Vendas:</strong> Contabiliza apenas vendas com status aprovado</p>
          <p><strong>• Pontuação:</strong> Considera pontuação validada pela secretaria</p>
          <p><strong>• Semanas consecutivas:</strong> Contador de streak quando atinge metas consecutivas</p>
        </CardContent>
      </Card>
    </div>
  );
}