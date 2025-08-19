import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ZoomIn, Trophy, Monitor, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import TVRankingDisplay from './TVRankingDisplay';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useNiveis } from '@/hooks/useNiveis';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { isVendaInPeriod } from '@/utils/semanaUtils';
import { getVendaEffectivePeriod } from '@/utils/vendaDateUtils';

interface VendedorData {
  id: string;
  name: string;
  weeklySales: number;
  weeklyTarget: number;
  avatar: string;
  points: number;
  monthlyTotal: number;
  nivel?: string;
}

interface MiniTVDisplayProps {
  selectedMonth?: number;
  selectedYear?: number;
}

const MiniTVDisplay: React.FC<MiniTVDisplayProps> = ({ 
  selectedMonth, 
  selectedYear 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const handleCopyTVLink = () => {
    const tvUrl = `${window.location.origin}/tv-ranking`;
    navigator.clipboard.writeText(tvUrl).then(() => {
      toast({
        title: "Link copiado!",
        description: "Link da TV do ranking copiado para a área de transferência.",
      });
    });
  };
  
  // Hooks para dados
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { vendedores, loading: vendedoresLoading } = useVendedores();
  const { niveis } = useNiveis();
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  
  const loading = vendasLoading || vendedoresLoading;

  // Processar dados dos vendedores
  const vendedoresData = useMemo(() => {
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

      // Vendas da semana atual - usar data efetiva para evitar bugs de timezone
      const { mes: mesAtual, ano: anoAtual } = getMesAnoSemanaAtual();
      const vendasSemana = vendas.filter(v => {
        if (v.vendedor_id !== vendedor.id || v.status !== 'matriculado') return false;
        
        const vendaPeriod = getVendaEffectivePeriod(v);
        return vendaPeriod.mes === mesAtual && vendaPeriod.ano === anoAtual;
      });

      const nivel = niveis.find(n => n.nivel === vendedor.nivel && n.tipo_usuario === 'vendedor');
      const metaSemanal = nivel?.meta_semanal_vendedor || 7;
      const pontosPorVenda = 1;

      return {
        id: vendedor.id,
        name: vendedor.name,
        weeklySales: vendasSemana.length,
        weeklyTarget: metaSemanal,
        avatar: vendedor.photo_url || '',
        points: vendasVendedor.length * pontosPorVenda,
        monthlyTotal: vendasVendedor.length,
        nivel: vendedor.nivel
      };
    }).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.weeklySales !== a.weeklySales) return b.weeklySales - a.weeklySales;
      return a.name.localeCompare(b.name);
    });
  }, [vendas, vendedores, niveis, selectedMonth, selectedYear, loading]);

  const topThree = vendedoresData.slice(0, 3);
  const restOfList = vendedoresData.slice(3, 8); // Mostrar apenas top 8 na versão mini

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white min-h-[400px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            Ranking de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-white/10 rounded-lg" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-white/5 rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white min-h-[400px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              Ranking de Vendas - TV
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => window.open('/tv-ranking', '_blank')}
                variant="outline"
                size="sm"
                className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Monitor className="h-4 w-4" />
                TV Público
              </Button>
              <Button
                onClick={handleCopyTVLink}
                variant="outline"
                size="sm"
                className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setIsExpanded(true)}
                variant="outline"
                size="sm"
                className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ZoomIn className="h-4 w-4" />
                Expandir
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Pódio Top 3 */}
          {topThree.length >= 3 && (
            <div className="flex items-end justify-center gap-2 mb-4">
              {[topThree[1], topThree[0], topThree[2]].map((person, index) => {
                const positions = ['2º', '1º', '3º'];
                const heights = ['h-12', 'h-16', 'h-10'];
                const colors = ['bg-gray-300', 'bg-yellow-400', 'bg-orange-400'];
                
                return person ? (
                  <motion.div
                    key={person.id}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-center mb-2">
                      <img
                        src={person.avatar || '/placeholder.svg'}
                        alt={person.name}
                        className="w-8 h-8 rounded-full border-2 border-white/50 mb-1"
                      />
                      <div className="text-xs font-bold">{person.name}</div>
                      <div className="text-xs text-blue-200">{person.points} pts</div>
                    </div>
                    <div className={`${heights[index]} ${colors[index]} w-12 rounded-t-lg flex items-end justify-center pb-1`}>
                      <span className="text-xs font-bold text-gray-800">{positions[index]}</span>
                    </div>
                  </motion.div>
                ) : null;
              })}
            </div>
          )}

          {/* Lista do resto */}
          <div className="space-y-1">
            {restOfList.map((vendedor, index) => {
              const position = index + 4;
              const progressPercentage = (vendedor.weeklySales / vendedor.weeklyTarget) * 100;
              
              return (
                <motion.div
                  key={vendedor.id}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: (index + 3) * 0.1 }}
                  className="flex items-center gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="w-6 text-center">
                    <span className="text-sm font-bold text-blue-200">#{position}</span>
                  </div>
                  
                  <img
                    src={vendedor.avatar || '/placeholder.svg'}
                    alt={vendedor.name}
                    className="w-6 h-6 rounded-full border border-white/30"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{vendedor.name}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <Progress 
                        value={Math.min(progressPercentage, 100)} 
                        className="h-1 flex-1 bg-white/20"
                      />
                      <span className="text-blue-200 whitespace-nowrap">
                        {vendedor.weeklySales}/{vendedor.weeklyTarget}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-bold text-yellow-400">{vendedor.points}</div>
                    <div className="text-xs text-blue-200">pts</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Estatísticas gerais */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">{vendedoresData.length}</div>
              <div className="text-xs text-blue-200">Vendedores</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {vendedoresData.reduce((sum, v) => sum + v.weeklySales, 0)}
              </div>
              <div className="text-xs text-blue-200">Vendas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">
                {vendedoresData.reduce((sum, v) => sum + v.points, 0)}
              </div>
              <div className="text-xs text-blue-200">Pontos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal expandido */}
      {isExpanded && (
        <TVRankingDisplay
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default MiniTVDisplay;