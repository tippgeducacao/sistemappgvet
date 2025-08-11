import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tv, Trophy, Crown, Medal } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import TVRankingDisplay from './TVRankingDisplay';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetas } from '@/hooks/useMetas';
import { useNiveis } from '@/hooks/useNiveis';
import { isVendaInPeriod } from '@/utils/semanaUtils';

interface VendorStat {
  id: string;
  nome: string;
  pontuacao: number;
  vendas: number;
  photo_url?: string;
  nivel?: string;
  user_type: string;
}

interface MiniRankingDisplayProps {
  selectedMonth?: number;
  selectedYear?: number;
}

const MiniRankingDisplay: React.FC<MiniRankingDisplayProps> = ({ 
  selectedMonth, 
  selectedYear
}) => {
  const [isTVMode, setIsTVMode] = useState(false);
  
  // Hooks para dados
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { vendedores, loading: vendedoresLoading } = useVendedores();
  const { metas } = useMetas();
  const { niveis } = useNiveis();
  
  const loading = vendasLoading || vendedoresLoading;
  
  // Calcular ranking
  const ranking = useMemo(() => {
    if (loading || !vendas || !vendedores) return [];
    
    const vendedoresAtivos = vendedores.filter(v => 
      v.user_type === 'vendedor' && 
      v.ativo && 
      v.name !== 'Vendedor teste'
    );
    
    return vendedoresAtivos.map(vendedor => {
      const vendasVendedor = vendas.filter(v => {
        if (v.vendedor_id !== vendedor.id || v.status !== 'matriculado') return false;
        if (!selectedMonth || !selectedYear) return true;
        
        const vendaDate = new Date(v.enviado_em);
        return vendaDate.getMonth() + 1 === selectedMonth && vendaDate.getFullYear() === selectedYear;
      });
      
      // Usar pontos simples por enquanto - 1 ponto por venda matriculada
      const pontosPorVenda = 1;
      
      return {
        id: vendedor.id,
        nome: vendedor.name,
        pontuacao: vendasVendedor.length * pontosPorVenda,
        vendas: vendasVendedor.length,
        photo_url: vendedor.photo_url,
        nivel: vendedor.nivel,
        user_type: vendedor.user_type
      };
    }).sort((a, b) => {
      if (b.pontuacao !== a.pontuacao) return b.pontuacao - a.pontuacao;
      if (b.vendas !== a.vendas) return b.vendas - a.vendas;
      return a.nome.localeCompare(b.nome);
    });
  }, [vendas, vendedores, niveis, selectedMonth, selectedYear, loading]);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Trophy className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getPositionBadgeColor = (position: number) => {
    switch (position) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const topVendedores = ranking.slice(0, 5); // Mostrar apenas top 5

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Ranking de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="w-24 h-4 bg-muted rounded" />
                  <div className="w-16 h-3 bg-muted rounded" />
                </div>
                <div className="w-12 h-6 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Ranking de Vendas - Top 5
            </CardTitle>
            <Button
              onClick={() => setIsTVMode(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Tv className="h-4 w-4" />
              Expandir
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {topVendedores.map((vendedor, index) => {
            const position = index + 1;
            
            return (
              <div 
                key={vendedor.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                {/* Posição */}
                <div className="flex items-center justify-center w-8">
                  {getPositionIcon(position)}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={vendedor.photo_url} 
                    alt={vendedor.nome}
                  />
                  <AvatarFallback>
                    {vendedor.nome.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Nome e Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{vendedor.nome}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {vendedor.nivel && (
                      <Badge variant="outline" className="text-xs">
                        {vendedor.nivel}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {vendedor.vendas} vendas
                    </span>
                  </div>
                </div>

                {/* Pontuação */}
                <div className="text-right">
                  <Badge 
                    className={`${getPositionBadgeColor(position)} font-bold`}
                  >
                    {vendedor.pontuacao.toFixed(1)} pts
                  </Badge>
                </div>
              </div>
            );
          })}

          {ranking.length > 5 && (
            <div className="text-center pt-2">
              <Button
                onClick={() => setIsTVMode(true)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                Ver todos os {ranking.length} vendedores
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal TV */}
      {isTVMode && (
        <TVRankingDisplay
          isOpen={isTVMode}
          onClose={() => setIsTVMode(false)}
        />
      )}
    </>
  );
};

export default MiniRankingDisplay;