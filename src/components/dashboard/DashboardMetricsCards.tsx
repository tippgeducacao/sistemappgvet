
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useVendas } from '@/hooks/useVendas';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useAuthStore } from '@/stores/AuthStore';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import { getVendaPeriod } from '@/utils/semanaUtils';
import { getVendaEffectivePeriod } from '@/utils/vendaDateUtils';
import type { UserType } from '@/types/user';

interface DashboardMetricsCardsProps {
  userType: UserType;
  selectedMonth?: number;
  selectedYear?: number;
  selectedVendedor?: string;
}

const DashboardMetricsCards: React.FC<DashboardMetricsCardsProps> = ({
  userType,
  selectedMonth,
  selectedYear,
  selectedVendedor
}) => {
  console.log('🚨 DASHBOARD METRICS - Props recebidas:', { selectedMonth, selectedYear, selectedVendedor });
  const {
    isAdmin,
    isSecretaria
  } = useUserRoles();
  const {
    vendas: minhasVendas
  } = useVendas();
  const {
    vendas: todasVendas
  } = useAllVendas();
  const {
    vendedores
  } = useVendedores();
  const {
    currentUser,
    profile
  } = useAuthStore();

  // Escolher quais vendas usar baseado no tipo de usuário
  let vendas = isAdmin || isSecretaria || userType === 'admin' || userType === 'secretaria' ? todasVendas : minhasVendas;
  
  // Filtrar por vendedor se selecionado
  if (selectedVendedor && selectedVendedor !== 'todos') {
    vendas = vendas.filter(venda => venda.vendedor_id === selectedVendedor);
  }

  // Filtrar vendas por período se os filtros estiverem definidos
  const filteredVendas = useMemo(() => {
    if (!selectedMonth || !selectedYear) {
      return vendas;
    }
    return vendas.filter(venda => {
      if (!venda.enviado_em) return false;
      const vendaPeriod = getVendaEffectivePeriod(venda);
      const { mes: vendaMes, ano: vendaAno } = vendaPeriod;
      return vendaMes === selectedMonth && vendaAno === selectedYear;
    });
  }, [vendas, selectedMonth, selectedYear]);

  // Calcular métricas baseadas nas vendas filtradas
  const stats = useMemo(() => {
    const totalVendas = filteredVendas.length;
    const aprovadas = filteredVendas.filter(v => v.status === 'matriculado').length;
    const pendentes = filteredVendas.filter(v => v.status === 'pendente').length;
    const rejeitadas = filteredVendas.filter(v => v.status === 'desistiu').length;
    const totalPontuacao = filteredVendas.filter(v => v.status === 'matriculado').reduce((sum, v) => sum + (v.pontuacao_validada || v.pontuacao_esperada || 0), 0);
    const totalPontuacaoValidada = filteredVendas.reduce((sum, v) => sum + (v.pontuacao_validada || 0), 0);

    // Para vendedores, calcular pontos aguardando validação
    const pontosAguardandoValidacao = filteredVendas.filter(v => v.status === 'pendente').reduce((sum, v) => sum + (v.pontuacao_esperada || 0), 0);
    const pontosValidados = filteredVendas.filter(v => v.status === 'matriculado').reduce((sum, v) => sum + (v.pontuacao_validada || v.pontuacao_esperada || 0), 0);
    return {
      totalVendas,
      aprovadas,
      pendentes,
      rejeitadas,
      totalPontuacao,
      totalPontuacaoValidada,
      pontosAguardandoValidacao,
      pontosValidados,
      taxaConversao: totalVendas > 0 ? aprovadas / totalVendas * 100 : 0
    };
  }, [filteredVendas]);

  // Calcular melhor vendedor para admin/secretaria
  const melhorVendedor = useMemo(() => {
    if (!isAdmin && !isSecretaria && userType !== 'admin' && userType !== 'secretaria') {
      return null;
    }

    // Filtrar vendedores - remover "Vendedor teste" exceto para admin específico
    const userEmail = profile?.email || currentUser?.email;
    const isSpecificAdmin = userEmail === 'wallasmonteiro019@gmail.com';
    const vendedoresFiltrados = vendedores.filter(vendedor => {
      if (isSpecificAdmin) {
        return true;
      }
      return vendedor.name !== 'Vendedor teste';
    });

    // Agrupar vendas por vendedor
    const vendedoresStats = filteredVendas.reduce((acc, venda) => {
      const vendedorId = venda.vendedor_id;
      const vendedorInfo = vendedoresFiltrados.find(v => v.id === vendedorId);
      if (!vendedorInfo) return acc;
      if (!acc[vendedorId]) {
        acc[vendedorId] = {
          id: vendedorId,
          nome: vendedorInfo.name,
          photo_url: vendedorInfo.photo_url,
          vendas: 0,
          pontuacao: 0
        };
      }
      
      // APENAS contabilizar vendas aprovadas - 0,3 pontos por curso
      if (venda.status === 'matriculado') {
        acc[vendedorId].vendas++;
        acc[vendedorId].pontuacao += 0.3; // 0,3 pontos por curso vendido
      }
      return acc;
    }, {} as Record<string, {
      id: string;
      nome: string;
      photo_url?: string;
      vendas: number;
      pontuacao: number;
    }>);

    // Encontrar o melhor vendedor (mais vendas aprovadas)
    const vendedoresArray = Object.values(vendedoresStats);
    if (vendedoresArray.length === 0) return null;
    return vendedoresArray.sort((a, b) => {
      if (a.vendas !== b.vendas) {
        return b.vendas - a.vendas;
      }
      return b.pontuacao - a.pontuacao;
    })[0];
  }, [filteredVendas, vendedores, isAdmin, isSecretaria, userType, profile?.email, currentUser?.email]);

  const isVendedor = userType === 'vendedor' || !isAdmin && !isSecretaria;

  // Layout para vendedores com cards de pontuação separados
  if (isVendedor) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md bg-gradient-to-br from-card via-card to-primary/5 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Minhas Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalVendas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedMonth && selectedYear ? `No período ${selectedMonth}/${selectedYear}` : 'Total geral'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-card via-card to-yellow-500/5 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pontos Aguardando</CardTitle>
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">{stats.pontosAguardandoValidacao.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando validação da secretaria
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-card via-card to-green-500/5 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pontos Validados</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-500">{stats.pontosValidados.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pontos já confirmados
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-card via-card to-blue-500/5 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">{stats.taxaConversao.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.aprovadas} de {stats.totalVendas} convertidas
            </p>
          </CardContent>
        </Card>
      </div>;
  }

  // Layout para admin/secretaria - cards retangulares em 4 colunas
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-0 shadow-md bg-gradient-to-br from-card via-card to-primary/5 hover:shadow-lg transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Total de Vendas Recebidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.totalVendas}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedMonth && selectedYear ? `No período ${selectedMonth}/${selectedYear}` : 'Total geral'}
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md bg-gradient-to-br from-card via-card to-secondary/5 hover:shadow-lg transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Pontuação Acumulada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-secondary-foreground">{stats.totalPontuacao.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Pontos acumulados
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md bg-gradient-to-br from-card via-card to-green-500/5 hover:shadow-lg transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Vendas Aprovadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 dark:text-green-500">{stats.aprovadas}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Matrículas confirmadas
          </p>
        </CardContent>
      </Card>

      {melhorVendedor && <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/50 dark:via-yellow-950/50 dark:to-orange-950/50 hover:shadow-xl transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1 text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              Melhor Vendedor
            </CardTitle>
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs px-2 py-1 shadow-sm">🏆 #1</Badge>
          </CardHeader>
          <CardContent className="pt-2 flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-amber-400 shadow-md flex-shrink-0">
              <AvatarImage src={melhorVendedor.photo_url} alt={melhorVendedor.nome} className="object-cover" />
              <AvatarFallback className="text-sm bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 text-amber-800 dark:text-amber-200 font-bold">
                {melhorVendedor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground leading-tight truncate">
                {melhorVendedor.nome}
              </p>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                {melhorVendedor.vendas} {melhorVendedor.vendas === 1 ? 'venda aprovada' : 'vendas aprovadas'}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                {DataFormattingService.formatPoints(melhorVendedor.pontuacao)} pts
              </p>
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default DashboardMetricsCards;
