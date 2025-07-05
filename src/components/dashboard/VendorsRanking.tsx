
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Trophy } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useAuthStore } from '@/stores/AuthStore';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';

const VendorsRanking: React.FC = () => {
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { vendedores, loading: vendedoresLoading } = useVendedores();
  const { currentUser, profile } = useAuthStore();
  
  // Estado para o filtro de mês
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const isLoading = vendasLoading || vendedoresLoading;

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

  // Filtrar vendas por mês selecionado
  const vendasFiltradas = useMemo(() => {
    if (!selectedMonth) return vendas;
    
    return vendas.filter(venda => {
      const vendaDate = new Date(venda.enviado_em);
      const vendaMonth = `${vendaDate.getFullYear()}-${String(vendaDate.getMonth() + 1).padStart(2, '0')}`;
      return vendaMonth === selectedMonth;
    });
  }, [vendas, selectedMonth]);

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
    
    if (!acc[vendedorId]) {
      acc[vendedorId] = {
        id: vendedorId,
        nome: vendedorNome,
        photo_url: vendedorPhoto,
        vendas: 0,
        pontuacao: 0,
        aprovadas: 0
      };
    }
    
    acc[vendedorId].vendas++;
    
    // APENAS vendas aprovadas (matriculado) contam para pontuação no ranking
    if (venda.status === 'matriculado') {
      acc[vendedorId].pontuacao += venda.pontuacao_esperada || 0;
      acc[vendedorId].aprovadas++;
    }
    
    return acc;
  }, {} as Record<string, { id: string; nome: string; photo_url?: string; vendas: number; pontuacao: number; aprovadas: number }>);

  // Incluir TODOS os vendedores filtrados, mesmo os que não fizeram vendas
  const todosVendedoresStats = vendedoresFiltrados.map(vendedor => {
    const statsExistentes = vendedoresStats[vendedor.id];
    return {
      id: vendedor.id,
      nome: vendedor.name,
      photo_url: vendedor.photo_url,
      vendas: statsExistentes?.vendas || 0,
      pontuacao: statsExistentes?.pontuacao || 0,
      aprovadas: statsExistentes?.aprovadas || 0
    };
  });

  // Ranking com nova lógica de ordenação - TODOS os vendedores
  const ranking = todosVendedoresStats
    .sort((a, b) => {
      // Primeira regra: Mais vendas aprovadas + mais pontos (os dois juntos)
      if (a.aprovadas !== b.aprovadas) {
        return b.aprovadas - a.aprovadas; // Mais vendas aprovadas primeiro
      }
      
      // Se têm o mesmo número de vendas aprovadas, ordenar por pontuação
      if (a.pontuacao !== b.pontuacao) {
        return b.pontuacao - a.pontuacao; // Mais pontos primeiro
      }
      
      // Segunda regra: Se não houver diferença nas aprovadas e pontos, ordenar por total de vendas
      return b.vendas - a.vendas;
    });

  // Obter nome do mês selecionado
  const mesAtualSelecionado = mesesDisponiveis.find(m => m.value === selectedMonth)?.label || 'Mês atual';

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
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
                        {melhorVendedor.vendas} {melhorVendedor.vendas === 1 ? 'venda total' : 'vendas totais'} • {melhorVendedor.aprovadas} aprovadas
                      </p>
                      <p className="text-lg font-bold text-ppgvet-magenta">
                        {DataFormattingService.formatPoints(melhorVendedor.pontuacao)} pts
                      </p>
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
                  <div>
                    <p className="font-medium">{vendedor.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {vendedor.vendas} {vendedor.vendas === 1 ? 'venda' : 'vendas'} • {vendedor.aprovadas} aprovadas
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="font-bold text-ppgvet-magenta">{DataFormattingService.formatPoints(vendedor.pontuacao)} pts</p>
                  </div>
                  <Badge variant={vendedor.aprovadas > 0 ? "default" : "secondary"}>
                    {vendedor.aprovadas > 0 ? "Com Vendas" : "Sem Vendas"}
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
