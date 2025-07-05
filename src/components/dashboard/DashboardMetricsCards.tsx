
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
import type { UserType } from '@/types/user';

interface DashboardMetricsCardsProps {
  userType: UserType;
  selectedMonth?: number;
  selectedYear?: number;
}

const DashboardMetricsCards: React.FC<DashboardMetricsCardsProps> = ({
  userType,
  selectedMonth,
  selectedYear
}) => {
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
  const vendas = isAdmin || isSecretaria || userType === 'admin' || userType === 'secretaria' ? todasVendas : minhasVendas;

  // Filtrar vendas por período se os filtros estiverem definidos
  const filteredVendas = useMemo(() => {
    if (!selectedMonth || !selectedYear) {
      return vendas;
    }
    return vendas.filter(venda => {
      if (!venda.enviado_em) return false;
      const vendaDate = new Date(venda.enviado_em);
      const vendaMonth = vendaDate.getMonth() + 1;
      const vendaYear = vendaDate.getFullYear();
      return vendaMonth === selectedMonth && vendaYear === selectedYear;
    });
  }, [vendas, selectedMonth, selectedYear]);

  // Calcular métricas baseadas nas vendas filtradas
  const stats = useMemo(() => {
    const totalVendas = filteredVendas.length;
    const aprovadas = filteredVendas.filter(v => v.status === 'matriculado').length;
    const pendentes = filteredVendas.filter(v => v.status === 'pendente').length;
    const rejeitadas = filteredVendas.filter(v => v.status === 'desistiu').length;
    const totalPontuacao = filteredVendas.reduce((sum, v) => sum + (v.pontuacao_esperada || 0), 0);
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
          aprovadas: 0,
          pontuacao: 0
        };
      }
      acc[vendedorId].vendas++;
      if (venda.status === 'matriculado') {
        acc[vendedorId].aprovadas++;
        acc[vendedorId].pontuacao += venda.pontuacao_esperada || 0;
      }
      return acc;
    }, {} as Record<string, {
      id: string;
      nome: string;
      photo_url?: string;
      vendas: number;
      aprovadas: number;
      pontuacao: number;
    }>);

    // Encontrar o melhor vendedor (mais vendas aprovadas)
    const vendedoresArray = Object.values(vendedoresStats);
    if (vendedoresArray.length === 0) return null;
    return vendedoresArray.sort((a, b) => {
      if (a.aprovadas !== b.aprovadas) {
        return b.aprovadas - a.aprovadas;
      }
      return b.vendas - a.vendas;
    })[0];
  }, [filteredVendas, vendedores, isAdmin, isSecretaria, userType, profile?.email, currentUser?.email]);

  const isVendedor = userType === 'vendedor' || !isAdmin && !isSecretaria;

  // Layout para vendedores com cards de pontuação separados
  if (isVendedor) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="aspect-[2/1] flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minhas Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ppgvet-teal">{stats.totalVendas}</div>
            <p className="text-xs text-muted-foreground">
              {selectedMonth && selectedYear ? `No período ${selectedMonth}/${selectedYear}` : 'Total geral'}
            </p>
          </CardContent>
        </Card>

        <Card className="aspect-[2/1] flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pontosAguardandoValidacao.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando validação da secretaria
            </p>
          </CardContent>
        </Card>

        <Card className="aspect-[2/1] flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Validados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.pontosValidados.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Pontos já confirmados
            </p>
          </CardContent>
        </Card>

        <Card className="aspect-[2/1] flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.taxaConversao.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.aprovadas} de {stats.totalVendas} convertidas
            </p>
          </CardContent>
        </Card>
      </div>;
  }

  // Layout para admin/secretaria - cards retangulares em 4 colunas
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="aspect-[2/1] flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Vendas Recebidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-ppgvet-teal">{stats.totalVendas}</div>
          <p className="text-xs text-muted-foreground">
            {selectedMonth && selectedYear ? `No período ${selectedMonth}/${selectedYear}` : 'Total geral'}
          </p>
        </CardContent>
      </Card>

      <Card className="aspect-[2/1] flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pontuação Acumulada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-ppgvet-magenta">{stats.totalPontuacao.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            Pontos acumulados
          </p>
        </CardContent>
      </Card>

      <Card className="aspect-[2/1] flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas Aprovadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.aprovadas}</div>
          <p className="text-xs text-muted-foreground">
            Matrículas confirmadas
          </p>
        </CardContent>
      </Card>

      {melhorVendedor && <Card className="aspect-[2/1] bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-lg flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium flex items-center gap-1 text-yellow-800">
              <Trophy className="h-3 w-3 text-yellow-600" />
              Melhor Vendedor
            </CardTitle>
            <Badge className="bg-yellow-500 text-white text-xs px-1 py-0.5">🏆 #1</Badge>
          </CardHeader>
          <CardContent className="pt-0 flex items-center gap-2">
            <Avatar className="h-8 w-8 border-2 border-yellow-400 shadow-md flex-shrink-0">
              <AvatarImage src={melhorVendedor.photo_url} alt={melhorVendedor.nome} className="object-cover" />
              <AvatarFallback className="text-xs bg-yellow-100 text-yellow-800 font-bold">
                {melhorVendedor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-ppgvet-teal leading-tight truncate">
                {melhorVendedor.nome}
              </p>
              <p className="text-xs font-semibold text-yellow-700">
                {melhorVendedor.vendas} vendas • {melhorVendedor.aprovadas} aprovadas
              </p>
              <p className="text-xs text-yellow-600 font-medium">
                {DataFormattingService.formatPoints(melhorVendedor.pontuacao)} pts
              </p>
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default DashboardMetricsCards;
