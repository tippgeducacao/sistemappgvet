
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

    </div>;
};
export default DashboardMetricsCards;
