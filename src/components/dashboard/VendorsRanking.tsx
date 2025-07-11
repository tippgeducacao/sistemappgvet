
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Filter, Trophy } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useAuthStore } from '@/stores/AuthStore';
import { useMetas } from '@/hooks/useMetas';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';

interface VendorsRankingProps {
  selectedVendedor?: string;
  selectedMonth?: number;
  selectedYear?: number;
}

const VendorsRanking: React.FC<VendorsRankingProps> = ({ selectedVendedor, selectedMonth: propSelectedMonth, selectedYear: propSelectedYear }) => {
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { vendedores, loading: vendedoresLoading } = useVendedores();
  const { metas, loading: metasLoading } = useMetas();
  const { currentUser, profile } = useAuthStore();
  
  // Estado interno para o filtro de mês (apenas quando não há filtro externo)
  const [internalSelectedMonth, setInternalSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Usar filtro externo se disponível, senão usar interno
  const selectedMonth = propSelectedMonth && propSelectedYear 
    ? `${propSelectedYear}-${String(propSelectedMonth).padStart(2, '0')}`
    : internalSelectedMonth;

  const isLoading = vendasLoading || vendedoresLoading || metasLoading;

  // Filtrar vendedores - remover "Vendedor teste" exceto para admin específico
  const vendedoresFiltrados = useMemo(() => {
    const userEmail = profile?.email || currentUser?.email;
    const isSpecificAdmin = userEmail === 'wallasmonteiro019@gmail.com';
    
    return vendedores.filter(vendedor => {
      // Se for o admin específico, mostrar todos os vendedores
      if (isSpecificAdmin) {
        return true;
      }
      
      // Para outros usuários, filtrar "Vendedor teste"
      return vendedor.name !== 'Vendedor teste';
    });
  }, [vendedores, profile?.email, currentUser?.email]);

  // Filtrar vendas por período e vendedor se especificados
  const vendasFiltradas = useMemo(() => {
    return vendas.filter(venda => {
      // Filtro por vendedor
      if (selectedVendedor && selectedVendedor !== 'todos' && venda.vendedor_id !== selectedVendedor) {
        return false;
      }
      
      // Filtro por período
      if ((propSelectedMonth && propSelectedYear) || internalSelectedMonth) {
        const dataVenda = new Date(venda.enviado_em);
        
        if (propSelectedMonth && propSelectedYear) {
          // Usar filtros externos do dashboard
          if (dataVenda.getMonth() + 1 !== propSelectedMonth || dataVenda.getFullYear() !== propSelectedYear) {
            return false;
          }
        } else {
          // Usar filtro interno mensal
          const vendaMonth = `${dataVenda.getFullYear()}-${String(dataVenda.getMonth() + 1).padStart(2, '0')}`;
          if (vendaMonth !== internalSelectedMonth) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [vendas, selectedVendedor, propSelectedMonth, propSelectedYear, internalSelectedMonth]);

  // Gerar lista de meses disponíveis
  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<string>();
    
    vendas.forEach(venda => {
      const vendaDate = new Date(venda.enviado_em);
      const mesAno = `${vendaDate.getFullYear()}-${String(vendaDate.getMonth() + 1).padStart(2, '0')}`;
      meses.add(mesAno);
    });

    // Adicionar mês atual se não existir
    const mesAtual = new Date();
    const mesAtualString = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}`;
    meses.add(mesAtualString);

    return Array.from(meses)
      .sort((a, b) => b.localeCompare(a)) // Ordenar do mais recente para o mais antigo
      .map(mesAno => {
        const [ano, mes] = mesAno.split('-');
        const mesNome = new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        });
        return { value: mesAno, label: mesNome.charAt(0).toUpperCase() + mesNome.slice(1) };
      });
  }, [vendas]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Vendedores</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar vendas filtradas por vendedor - CONSIDERANDO APENAS VENDAS APROVADAS
  const vendedoresStats = vendasFiltradas.reduce((acc, venda) => {
    const vendedorId = venda.vendedor_id;
    const vendedorNome = venda.vendedor?.name || 'Vendedor não identificado';
    const vendedorPhoto = venda.vendedor?.photo_url || undefined;
    
    // APENAS contabilizar vendas aprovadas (matriculadas)
    if (venda.status === 'matriculado') {
      if (!acc[vendedorId]) {
        acc[vendedorId] = {
          id: vendedorId,
          nome: vendedorNome,
          photo_url: vendedorPhoto,
          vendas: 0,
          pontuacao: 0
        };
      }
      
      acc[vendedorId].vendas++;
      acc[vendedorId].pontuacao += venda.pontuacao_esperada || 0;
    }
    
    return acc;
  }, {} as Record<string, { id: string; nome: string; photo_url?: string; vendas: number; pontuacao: number }>);

  // Função para calcular vendas semanais
  const getWeeklyProgress = (vendedorId: string, year: number, month: number) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Início da semana (domingo)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Final da semana (sábado)
    endOfWeek.setHours(23, 59, 59, 999);

    return vendasFiltradas.filter(venda => {
      if (venda.vendedor_id !== vendedorId || venda.status !== 'matriculado') return false;
      
      const vendaDate = new Date(venda.enviado_em);
      return vendaDate >= startOfWeek && vendaDate <= endOfWeek;
    }).length;
  };

  // Incluir TODOS os vendedores filtrados, mesmo os que não fizeram vendas
  const todosVendedoresStats = vendedoresFiltrados.map(vendedor => {
    const statsExistentes = vendedoresStats[vendedor.id];
    const [year, monthStr] = selectedMonth.split('-');
    const currentYear = parseInt(year);
    const currentMonth = parseInt(monthStr);
    
    // Buscar meta do vendedor para o período
    const metaVendedor = metas.find(meta => 
      meta.vendedor_id === vendedor.id && 
      meta.ano === currentYear && 
      meta.mes === currentMonth
    );
    
    const vendasAprovadas = statsExistentes?.vendas || 0;
    const metaMensal = metaVendedor?.meta_vendas || 0;
    const metaSemanal = Math.ceil(metaMensal / 4); // Meta semanal aproximada
    const vendasSemanais = getWeeklyProgress(vendedor.id, currentYear, currentMonth);
    
    return {
      id: vendedor.id,
      nome: vendedor.name,
      photo_url: vendedor.photo_url,
      vendas: vendasAprovadas,
      pontuacao: statsExistentes?.pontuacao || 0,
      metaMensal,
      metaSemanal,
      vendasSemanais,
      progressoMensal: metaMensal > 0 ? (vendasAprovadas / metaMensal) * 100 : 0,
      progressoSemanal: metaSemanal > 0 ? (vendasSemanais / metaSemanal) * 100 : 0
    };
  });

  // Ranking com nova lógica de ordenação - TODOS os vendedores
  const ranking = todosVendedoresStats
    .sort((a, b) => {
      // Primeira regra: Mais vendas aprovadas
      if (a.vendas !== b.vendas) {
        return b.vendas - a.vendas; // Mais vendas aprovadas primeiro
      }
      
      // Se têm o mesmo número de vendas aprovadas, ordenar por pontuação
      if (a.pontuacao !== b.pontuacao) {
        return b.pontuacao - a.pontuacao; // Mais pontos primeiro
      }
      
      // Se tudo igual, ordenar por nome
      return a.nome.localeCompare(b.nome);
    });

  // Obter nome do mês selecionado
  const mesAtualSelecionado = propSelectedMonth && propSelectedYear 
    ? `${new Date(propSelectedYear, propSelectedMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`.charAt(0).toUpperCase() + `${new Date(propSelectedYear, propSelectedMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`.slice(1)
    : mesesDisponiveis.find(m => m.value === selectedMonth)?.label || 'Mês atual';

  // Melhor vendedor (primeiro do ranking)
  const melhorVendedor = ranking[0];
  
  // Lista do ranking sem o primeiro colocado (para não duplicar)
  const rankingSemPrimeiro = ranking.slice(1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ranking de Vendedores</CardTitle>
            <CardDescription>
              Todos os {ranking.length} vendedores por vendas aprovadas - {mesAtualSelecionado}
            </CardDescription>
          </div>
          {/* Mostrar filtro de mês apenas se não houver filtros externos */}
          {!propSelectedMonth && !propSelectedYear && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={internalSelectedMonth} onValueChange={setInternalSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mesesDisponiveis.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum vendedor encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Destaque do Melhor Vendedor */}
            {melhorVendedor && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-yellow-500 text-white rounded-full">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <Avatar className="h-20 w-20 border-4 border-yellow-300">
                      <AvatarImage 
                        src={melhorVendedor.photo_url} 
                        alt={melhorVendedor.nome}
                      />
                      <AvatarFallback className="text-xl bg-yellow-100">
                        {melhorVendedor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-2xl text-yellow-800">Melhor Vendedor</h3>
                        <Badge className="bg-yellow-500 text-white text-sm px-3 py-1">🏆 #1</Badge>
                      </div>
                      <p className="font-bold text-xl text-ppgvet-teal mb-1">{melhorVendedor.nome}</p>
                      <p className="text-lg font-semibold text-yellow-700">
                        {melhorVendedor.vendas} {melhorVendedor.vendas === 1 ? 'venda aprovada' : 'vendas aprovadas'}
                      </p>
                      <p className="text-lg font-bold text-ppgvet-magenta">
                        {DataFormattingService.formatPoints(melhorVendedor.pontuacao)} pts
                      </p>
                      
                      {/* Mini barras de progresso para o melhor vendedor */}
                      <div className="flex gap-4 mt-3">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-yellow-700">Meta Mês</span>
                            <span className="text-xs text-yellow-600">{melhorVendedor.vendas}/{melhorVendedor.metaMensal}</span>
                          </div>
                          <Progress 
                            value={Math.min(melhorVendedor.progressoMensal, 100)} 
                            className="h-2 bg-yellow-100"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-yellow-700">Meta Semana</span>
                            <span className="text-xs text-yellow-600">{melhorVendedor.vendasSemanais}/{melhorVendedor.metaSemanal}</span>
                          </div>
                          <Progress 
                            value={Math.min(melhorVendedor.progressoSemanal, 100)} 
                            className="h-2 bg-yellow-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista do Ranking a partir do 2º lugar */}
            {rankingSemPrimeiro.map((vendedor, index) => (
              <div key={vendedor.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-ppgvet-teal text-white rounded-full font-bold">
                    {index + 2}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={vendedor.photo_url} 
                      alt={vendedor.nome}
                    />
                    <AvatarFallback>
                      {vendedor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center justify-between flex-1">
                    <div>
                      <p className="font-medium">{vendedor.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendedor.vendas} {vendedor.vendas === 1 ? 'venda aprovada' : 'vendas aprovadas'}
                      </p>
                    </div>
                    
                    {/* Mini barras de progresso ao lado */}
                    <div className="flex gap-4 ml-4">
                      <div className="w-24">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Meta Mês</span>
                          <span className="text-xs text-muted-foreground">{vendedor.vendas}/{vendedor.metaMensal}</span>
                        </div>
                        <Progress 
                          value={Math.min(vendedor.progressoMensal, 100)} 
                          className="h-1.5"
                        />
                      </div>
                      <div className="w-24">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Meta Semana</span>
                          <span className="text-xs text-muted-foreground">{vendedor.vendasSemanais}/{vendedor.metaSemanal}</span>
                        </div>
                        <Progress 
                          value={Math.min(vendedor.progressoSemanal, 100)} 
                          className="h-1.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="font-bold text-ppgvet-magenta">{DataFormattingService.formatPoints(vendedor.pontuacao)} pts</p>
                  </div>
                  <Badge variant={vendedor.vendas > 0 ? "default" : "secondary"}>
                    {vendedor.vendas > 0 ? "Com Vendas" : "Sem Vendas"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorsRanking;
