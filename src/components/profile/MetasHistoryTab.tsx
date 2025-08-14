import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import SDRMetasHistory from './sdr/SDRMetasHistory';
import { MetasSemanaisService } from '@/services/metas/MetasSemanaisService';
import { useAuthStore } from '@/stores/AuthStore';
import { useAllVendas } from '@/hooks/useVendas';

interface MetasHistoryTabProps {
  userId: string;
  userType: string;
}

export const MetasHistoryTab = ({ userId, userType }: MetasHistoryTabProps) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(8); // Agosto por padrão
  const [metasVendedor, setMetasVendedor] = useState<any[]>([]);
  const [isLoadingMetas, setIsLoadingMetas] = useState(false);
  
  const { profile } = useAuthStore();
  const { vendas: allVendas = [] } = useAllVendas();

  // Determinar se é SDR
  const isSDR = userType?.includes('sdr') || false;

  // Buscar metas do vendedor
  const buscarMetasVendedor = async () => {
    if (!userId) return;
    
    try {
      setIsLoadingMetas(true);
      console.log(`🔍 Buscando metas para vendedor ${userId}, período: ${selectedMonth}/${selectedYear}`);
      
      const metas = await MetasSemanaisService.buscarOuCriarMetas(userId, selectedYear, selectedMonth || undefined);
      console.log(`📊 Metas encontradas/criadas:`, metas.length);
      
      setMetasVendedor(metas);
    } catch (error) {
      console.error('❌ Erro ao buscar metas do vendedor:', error);
      setMetasVendedor([]);
    } finally {
      setIsLoadingMetas(false);
    }
  };

  // Buscar metas quando mudar vendedor, ano ou mês
  useEffect(() => {
    buscarMetasVendedor();
  }, [userId, selectedYear, selectedMonth]);

  // Filtrar vendas do usuário
  const userVendas = allVendas.filter(venda => venda.vendedor_id === userId);

  // Função para obter vendas de uma semana específica
  const getVendasSemana = (ano: number, semana: number) => {
    return userVendas.filter(venda => {
      if (!venda.enviado_em) return false;
      
      const dataVenda = new Date(venda.enviado_em);
      const anoVenda = dataVenda.getFullYear();
      
      if (anoVenda !== ano) return false;
      
      // Calcular número da semana
      const inicioAno = new Date(ano, 0, 1);
      const diferencaDias = Math.floor((dataVenda.getTime() - inicioAno.getTime()) / (24 * 60 * 60 * 1000));
      const semanaVenda = Math.ceil((diferencaDias + inicioAno.getDay() + 1) / 7);
      
      return semanaVenda === semana;
    });
  };

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

  // Se for SDR, renderizar componente específico
  if (isSDR) {
    return <SDRMetasHistory userId={userId} />;
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Ano:</label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Mês (opcional):</label>
          <Select 
            value={selectedMonth?.toString() || "all"} 
            onValueChange={(value) => setSelectedMonth(value === "all" ? null : parseInt(value))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                const monthName = new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' });
                return (
                  <SelectItem key={month} value={month.toString()}>
                    {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Metas Semanais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Performance Semanal Detalhada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            if (isLoadingMetas) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando histórico de metas...
                </div>
              );
            }

            if (metasVendedor.length === 0) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma meta semanal encontrada para o período selecionado
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {metasVendedor
                  .sort((a, b) => {
                    if (a.ano !== b.ano) return b.ano - a.ano;
                    return b.semana - a.semana;
                  })
                  .slice(0, 50) // Limitar para performance
                  .map((meta) => {
                    const vendasSemana = getVendasSemana(meta.ano, meta.semana);
                    
                    // Para SDR, usar meta de agendamentos, para vendedores usar meta de vendas
                    const metaValue = meta.meta_vendas || 0;
                    const achievement = userType === 'sdr' ? vendasSemana.length : vendasSemana.reduce((total, venda) => 
                      total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0
                    );
                    
                    const percentual = metaValue > 0 ? Math.round((achievement / metaValue) * 100) : 0;
                    const status = getStatusMeta(percentual);

                    // Top 3 vendas da semana
                    const topVendas = vendasSemana
                      .sort((a, b) => (b.pontuacao_validada || b.pontuacao_esperada || 0) - (a.pontuacao_validada || a.pontuacao_esperada || 0))
                      .slice(0, 3);

                    return (
                      <div key={`${meta.ano}-${meta.semana}`} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">
                              Semana {meta.semana} - {meta.ano}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Meta: {metaValue} {userType === 'sdr' ? 'agendamentos' : 'pontos'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {achievement} {userType === 'sdr' ? 'agend.' : 'pts'}
                              </span>
                              <Badge variant={status.variant as any}>
                                {status.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{percentual}%</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso</span>
                            <span>{percentual}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(percentual, 100)}%` }}
                            />
                          </div>
                        </div>

                        {topVendas.length > 0 && userType !== 'sdr' && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Top vendas da semana:</p>
                            <div className="space-y-1">
                              {topVendas.map((venda, index) => (
                                <div key={venda.id} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    #{index + 1} {(venda as any).nome_aluno || 'Nome não informado'}
                                  </span>
                                  <span className="font-medium">
                                    {venda.pontuacao_validada || venda.pontuacao_esperada || 0} pts
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Total de {userType === 'sdr' ? 'agendamentos' : 'vendas'}: {vendasSemana.length}
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Informações sobre o histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como funciona o histórico:</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div>• <strong>Período:</strong> Sistema respeita a regra das terças-feiras - a semana vai de quarta a terça</div>
          <div>• <strong>Histórico:</strong> Mostra semanas passadas, atual e futuras automaticamente</div>
          <div>• <strong>Agendamentos:</strong> Contabiliza apenas reuniões com presença confirmada</div>
          <div>• <strong>Comissão:</strong> Variável semanal recebida quando a meta é atingida (100% ou mais)</div>
          <div>• <strong>Semanas consecutivas:</strong> Contador de streak quando atinge metas consecutivas</div>
        </CardContent>
      </Card>
    </div>
  );
};