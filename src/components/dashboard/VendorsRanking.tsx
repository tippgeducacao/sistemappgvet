
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Filter, Trophy, Medal, Award, Tv } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useAuthStore } from '@/stores/AuthStore';
import { useMetas } from '@/hooks/useMetas';
import { useNiveis } from '@/hooks/useNiveis';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import VendorWeeklyGoalsModal from './VendorWeeklyGoalsModal';
import TVRankingDisplay from './TVRankingDisplay';

interface VendorsRankingProps {
  selectedVendedor?: string;
  selectedMonth?: number;
  selectedYear?: number;
}

const VendorsRanking: React.FC<VendorsRankingProps> = ({ selectedVendedor, selectedMonth: propSelectedMonth, selectedYear: propSelectedYear }) => {
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { vendedores, loading: vendedoresLoading } = useVendedores();
  const { metas, loading: metasLoading } = useMetas();
  const { niveis, loading: niveisLoading } = useNiveis();
  const { currentUser, profile } = useAuthStore();
  
  // Estado interno para o filtro de mês (apenas quando não há filtro externo)
  const [internalSelectedMonth, setInternalSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Estado para modal de metas semanais
  const [selectedVendedorForGoals, setSelectedVendedorForGoals] = useState<{
    id: string;
    name: string;
    photo_url?: string;
  } | null>(null);

  // Estado para modo TV
  const [isTVMode, setIsTVMode] = useState(false);
  
  // Usar filtro externo se disponível, senão usar interno
  const selectedMonth = propSelectedMonth && propSelectedYear 
    ? `${propSelectedYear}-${String(propSelectedMonth).padStart(2, '0')}`
    : internalSelectedMonth;

  const isLoading = vendasLoading || vendedoresLoading || metasLoading || niveisLoading;

  // Filtrar vendedores - apenas vendedores ativos e remover "Vendedor teste" exceto para admin específico
  const vendedoresFiltrados = useMemo(() => {
    const userEmail = profile?.email || currentUser?.email;
    const isSpecificAdmin = userEmail === 'wallasmonteiro019@gmail.com';
    
    return vendedores.filter(vendedor => {
      // Filtrar apenas vendedores (não mostrar admin, SDR etc)
      if (vendedor.user_type !== 'vendedor') {
        return false;
      }
      
      // Filtrar apenas vendedores ativos
      if (!vendedor.ativo) {
        return false;
      }
      
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

  // Função para calcular vendas semanais (quarta a terça)
  const getWeeklyProgress = (vendedorId: string, year: number, month: number) => {
    const now = new Date();
    
    // Calcular início da semana (quarta-feira anterior ou atual)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay(); // 0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
    const daysToWednesday = dayOfWeek < 3 ? dayOfWeek + 4 : dayOfWeek - 3; // Quantos dias até a quarta
    startOfWeek.setDate(now.getDate() - daysToWednesday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Final da semana (terça)
    endOfWeek.setHours(23, 59, 59, 999);

    return vendasFiltradas.filter(venda => {
      if (venda.vendedor_id !== vendedorId || venda.status !== 'matriculado') return false;
      
      const vendaDate = new Date(venda.enviado_em);
      return vendaDate >= startOfWeek && vendaDate <= endOfWeek;
    }).length;
  };

  // Função para calcular qual dia da semana estamos (1=quarta, 7=terça)
  const getCurrentWeekDay = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
    
    // Mapear para nosso sistema (quarta=1, terça=7)
    const weekDayMap = {
      3: 1, // quarta
      4: 2, // quinta  
      5: 3, // sexta
      6: 4, // sábado
      0: 5, // domingo
      1: 6, // segunda
      2: 7  // terça
    };
    
    return weekDayMap[dayOfWeek as keyof typeof weekDayMap] || 1;
  };

  // Incluir TODOS os vendedores filtrados, mesmo os que não fizeram vendas
  const todosVendedoresStats = vendedoresFiltrados.map(vendedor => {
    const statsExistentes = vendedoresStats[vendedor.id];
    const [year, monthStr] = selectedMonth.split('-');
    const currentYear = parseInt(year);
    const currentMonth = parseInt(monthStr);
    
    // Buscar meta semanal baseada no nível do vendedor
    const vendedorNivel = vendedores.find(v => v.id === vendedor.id)?.nivel || 'junior';
    const nivelConfig = niveis.find(n => n.nivel === vendedorNivel);
    
    const vendasAprovadas = statsExistentes?.vendas || 0;
    const pontuacaoAtual = statsExistentes?.pontuacao || 0;
    const metaSemanal = nivelConfig?.meta_semanal_vendedor || 6; // Usar meta do banco ou 6 como fallback
    
    // Calcular meta diária progressiva
    const diaAtualNaSemana = getCurrentWeekDay(); // 1=quarta, 7=terça
    const metaEsperadaAteHoje = (metaSemanal / 7) * diaAtualNaSemana;
    
    const vendasSemanais = getWeeklyProgress(vendedor.id, currentYear, currentMonth);
    
    return {
      id: vendedor.id,
      nome: vendedor.name,
      photo_url: vendedor.photo_url,
      vendas: vendasAprovadas,
      pontuacao: pontuacaoAtual,
      metaSemanal,
      metaEsperadaAteHoje,
      diaAtualNaSemana,
      vendasSemanais,
      progressoSemanal: metaSemanal > 0 ? (pontuacaoAtual / metaSemanal) * 100 : 0,
      progressoDiario: metaEsperadaAteHoje > 0 ? (pontuacaoAtual / metaEsperadaAteHoje) * 100 : 0
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

  // Top 3 vendedores
  const top3Vendedores = ranking.slice(0, 3);
  
  // Lista do ranking sem o top 3 (para não duplicar)
  const rankingSemTop3 = ranking.slice(3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              Ranking de Vendedores
              <button
                onClick={() => setIsTVMode(true)}
                className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105 group"
                title="Exibir em tela cheia (Modo TV)"
              >
                <Tv className="h-5 w-5 group-hover:animate-pulse" />
              </button>
            </CardTitle>
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
            {/* Top 3 Vendedores */}
            {top3Vendedores.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                  <h3 className="font-bold text-xl text-yellow-800">Top 3 Vendedores</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {top3Vendedores.map((vendedor, index) => {
                    const icons = [Trophy, Medal, Award];
                    const IconComponent = icons[index];
                    const colors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
                    const bgColors = ['bg-yellow-100', 'bg-gray-100', 'bg-amber-100'];
                    const positions = ['#1', '#2', '#3'];
                    
                    return (
                      <div 
                        key={vendedor.id} 
                        className="bg-white rounded-lg p-4 border cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedVendedorForGoals({
                          id: vendedor.id,
                          name: vendedor.nome,
                          photo_url: vendedor.photo_url
                        })}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`flex items-center justify-center w-10 h-10 ${bgColors[index]} rounded-full`}>
                            <IconComponent className={`h-5 w-5 ${colors[index]}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-800">{vendedor.nome}</h4>
                              <Badge className={`${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'} text-white text-xs`}>
                                {positions[index]}
                              </Badge>
                            </div>
                            <Avatar className="h-12 w-12 mt-2 border-2 border-yellow-300">
                              <AvatarImage src={vendedor.photo_url} alt={vendedor.nome} />
                              <AvatarFallback className="text-sm">
                                {vendedor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold text-gray-700">
                            {vendedor.vendas} {vendedor.vendas === 1 ? 'venda' : 'vendas'}
                          </p>
                          <p className="font-bold text-ppgvet-magenta">
                            {DataFormattingService.formatPoints(vendedor.pontuacao)} pts
                          </p>
                        </div>
                        
                        {/* Mini barras para o top 3 */}
                        <div className="flex gap-2 mt-3">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-600">Meta Semana</span>
                              <span className="text-xs text-gray-500">{DataFormattingService.formatPoints(vendedor.pontuacao)}/{vendedor.metaSemanal} pts</span>
                            </div>
                            <Progress value={Math.min(vendedor.progressoSemanal, 100)} className="h-1.5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-600">Meta até Hoje</span>
                              <span className="text-xs text-gray-500">{DataFormattingService.formatPoints(vendedor.pontuacao)}/{DataFormattingService.formatPoints(vendedor.metaEsperadaAteHoje)} pts</span>
                            </div>
                            <Progress value={Math.min(vendedor.progressoDiario, 100)} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista do Ranking a partir do 4º lugar */}
            {rankingSemTop3.map((vendedor, index) => (
              <div 
                key={vendedor.id} 
                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedVendedorForGoals({
                  id: vendedor.id,
                  name: vendedor.nome,
                  photo_url: vendedor.photo_url
                })}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-ppgvet-teal text-white rounded-full font-bold">
                    {index + 4}
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
                            <span className="text-xs font-medium text-muted-foreground">Meta Semana</span>
                            <span className="text-xs text-muted-foreground">{DataFormattingService.formatPoints(vendedor.pontuacao)}/{vendedor.metaSemanal} pts</span>
                          </div>
                         <Progress 
                           value={Math.min(vendedor.progressoSemanal, 100)} 
                           className="h-1.5"
                         />
                       </div>
                       <div className="w-24">
                           <div className="flex justify-between items-center mb-1">
                             <span className="text-xs font-medium text-muted-foreground">Meta até Hoje</span>
                             <span className="text-xs text-muted-foreground">{DataFormattingService.formatPoints(vendedor.pontuacao)}/{DataFormattingService.formatPoints(vendedor.metaEsperadaAteHoje)} pts</span>
                           </div>
                         <Progress 
                           value={Math.min(vendedor.progressoDiario, 100)} 
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
        
        {/* Modal de Metas Semanais */}
        <VendorWeeklyGoalsModal
          vendedorId={selectedVendedorForGoals?.id}
          vendedorNome={selectedVendedorForGoals?.name}
          vendedorPhoto={selectedVendedorForGoals?.photo_url}
          selectedMonth={propSelectedMonth || parseInt(selectedMonth.split('-')[1])}
          selectedYear={propSelectedYear || parseInt(selectedMonth.split('-')[0])}
          isOpen={!!selectedVendedorForGoals}
          onClose={() => setSelectedVendedorForGoals(null)}
        />

        {/* Componente de exibição TV */}
        <TVRankingDisplay 
          isOpen={isTVMode}
          onClose={() => setIsTVMode(false)}
        />
      </CardContent>
    </Card>
  );
};

export default VendorsRanking;
