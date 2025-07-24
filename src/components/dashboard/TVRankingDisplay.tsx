import React, { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Award, X, Target, TrendingUp, Maximize2, Minimize2 } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useAuthStore } from '@/stores/AuthStore';

interface TVRankingDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

const TVRankingDisplay: React.FC<TVRankingDisplayProps> = ({ isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { vendedores, loading: vendedoresLoading } = useVendedores();
  const { metasSemanais, loading: metasLoading } = useMetasSemanais();
  const { currentUser, profile } = useAuthStore();

  // Auto refresh a cada 30 segundos
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      window.location.reload();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Gerenciar tela cheia
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const isLoading = vendasLoading || vendedoresLoading || metasLoading;

  // Filtrar vendedores (excluir teste para usuários específicos)
  const vendedoresFiltrados = useMemo(() => {
    const userEmail = profile?.email || currentUser?.email;
    const isSpecificAdmin = userEmail === 'wallasmonteiro019@gmail.com';
    
    return vendedores.filter(vendedor => {
      if (isSpecificAdmin) return true;
      return vendedor.name !== 'Vendedor teste';
    });
  }, [vendedores, profile?.email, currentUser?.email]);

  // Calcular estatísticas da semana atual
  const vendedoresStats = useMemo(() => {
    // Pegar início e fim da semana atual (quarta a terça)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToWednesday = dayOfWeek === 0 ? 3 : (3 - dayOfWeek + 7) % 7;
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysToWednesday);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Filtrar vendas da semana
    const vendasDaSemana = vendas.filter(venda => {
      const dataVenda = new Date(venda.enviado_em);
      return dataVenda >= startOfWeek && 
             dataVenda <= endOfWeek && 
             venda.status === 'matriculado';
    });

    // Agrupar por vendedor
    const statsVendedor = vendasDaSemana.reduce((acc, venda) => {
      const vendedorId = venda.vendedor_id;
      if (!acc[vendedorId]) {
        acc[vendedorId] = {
          vendas: 0,
          pontuacao: 0
        };
      }
      acc[vendedorId].vendas++;
      acc[vendedorId].pontuacao += venda.pontuacao_esperada || 0;
      return acc;
    }, {} as Record<string, { vendas: number; pontuacao: number }>);

    return statsVendedor;
  }, [vendas]);

  // Criar ranking completo
  const ranking = useMemo(() => {
    return vendedoresFiltrados.map(vendedor => {
      const stats = vendedoresStats[vendedor.id] || { vendas: 0, pontuacao: 0 };
      
      // Buscar meta semanal do vendedor
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentWeek = 1; // Simplificado para demonstração
      
      const metaSemanal = metasSemanais.find(meta => 
        meta.vendedor_id === vendedor.id && 
        meta.ano === currentYear &&
        meta.semana === currentWeek
      );
      
      const metaVendas = metaSemanal?.meta_vendas || 0;
      const percentualAtingido = metaVendas > 0 ? (stats.vendas / metaVendas) * 100 : 0;
      
      return {
        id: vendedor.id,
        nome: vendedor.name,
        photo_url: vendedor.photo_url,
        vendas: stats.vendas,
        pontuacao: stats.pontuacao,
        metaSemanal: metaVendas,
        percentualAtingido: Math.min(percentualAtingido, 100),
        percentualReal: percentualAtingido,
        isSDR: vendedor.user_type?.includes('sdr')
      };
    }).sort((a, b) => {
      // Ordenar por vendas primeiro, depois por pontuação
      if (a.vendas !== b.vendas) return b.vendas - a.vendas;
      if (a.pontuacao !== b.pontuacao) return b.pontuacao - a.pontuacao;
      return a.nome.localeCompare(b.nome);
    });
  }, [vendedoresFiltrados, vendedoresStats, metasSemanais]);

  // Top 3 para o pódio
  const top3 = ranking.slice(0, 3);
  const totalVendas = ranking.reduce((sum, v) => sum + v.vendas, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white z-50">
      <div className="h-screen flex flex-col">
        {/* Header Compacto */}
        <div className="flex justify-between items-center p-4 border-b border-white/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-ppgvet-teal to-blue-600 p-2 rounded-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-ppgvet-teal to-blue-400 bg-clip-text text-transparent">
                RANKING VENDEDORES
              </h1>
              <p className="text-sm text-white/80">
                Semana Atual • {totalVendas} vendas • {ranking.length} vendedores
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-3xl text-white/60">Carregando dados...</div>
          </div>
        ) : (
          <div className="flex-1 p-4 flex flex-col overflow-hidden">
            {/* Pódium Compacto no Topo */}
            {top3.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-center items-end gap-4 mb-4">
                  {/* 2º Lugar */}
                  {top3[1] && (
                    <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl p-3 w-40 h-32 flex flex-col items-center justify-between border-2 border-gray-300">
                      <div className="text-center">
                        <div className="bg-gray-300 w-8 h-8 rounded-full flex items-center justify-center mb-1">
                          <Medal className="h-4 w-4 text-gray-800" />
                        </div>
                        <Avatar className="h-10 w-10 mx-auto mb-1 border-2 border-white">
                          <AvatarImage src={top3[1].photo_url} alt={top3[1].nome} />
                          <AvatarFallback className="text-xs bg-gray-200 text-gray-800">
                            {top3[1].nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-sm font-bold text-white" title={top3[1].nome}>
                          {top3[1].nome.split(' ')[0]}
                        </h3>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{top3[1].vendas}</div>
                        <div className="text-xs text-gray-200">{top3[1].percentualAtingido.toFixed(0)}%</div>
                      </div>
                    </div>
                  )}

                  {/* 1º Lugar */}
                  {top3[0] && (
                    <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-4 w-48 h-40 flex flex-col items-center justify-between border-2 border-yellow-300">
                      <div className="text-center">
                        <div className="bg-yellow-300 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                          <Trophy className="h-5 w-5 text-yellow-800" />
                        </div>
                        <Avatar className="h-12 w-12 mx-auto mb-2 border-2 border-white">
                          <AvatarImage src={top3[0].photo_url} alt={top3[0].nome} />
                          <AvatarFallback className="text-sm bg-yellow-200 text-yellow-800">
                            {top3[0].nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-sm font-bold text-white" title={top3[0].nome}>
                          {top3[0].nome.split(' ')[0]}
                        </h3>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{top3[0].vendas}</div>
                        <div className="text-xs text-yellow-200">{top3[0].percentualAtingido.toFixed(0)}%</div>
                      </div>
                    </div>
                  )}

                  {/* 3º Lugar */}
                  {top3[2] && (
                    <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-3 w-40 h-32 flex flex-col items-center justify-between border-2 border-amber-400">
                      <div className="text-center">
                        <div className="bg-amber-400 w-8 h-8 rounded-full flex items-center justify-center mb-1">
                          <Award className="h-4 w-4 text-amber-800" />
                        </div>
                        <Avatar className="h-10 w-10 mx-auto mb-1 border-2 border-white">
                          <AvatarImage src={top3[2].photo_url} alt={top3[2].nome} />
                          <AvatarFallback className="text-xs bg-amber-200 text-amber-800">
                            {top3[2].nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-sm font-bold text-white" title={top3[2].nome}>
                          {top3[2].nome.split(' ')[0]}
                        </h3>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{top3[2].vendas}</div>
                        <div className="text-xs text-amber-200">{top3[2].percentualAtingido.toFixed(0)}%</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lista completa de vendedores */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">RANKING COMPLETO</h2>
              
              <div className="grid grid-cols-2 gap-4 max-h-full overflow-y-auto">
                {ranking.map((vendedor, index) => (
                  <div
                    key={vendedor.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      vendedor.isSDR ? 
                        'bg-purple-600/20 border border-purple-400/30 hover:bg-purple-600/30' :
                        index < 3 ? 
                          'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50' : 
                          'bg-white/10 hover:bg-white/15 border border-white/20'
                    }`}
                  >
                    {/* Posição */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      vendedor.isSDR ? 'bg-purple-500 text-white' :
                      'bg-white/20 text-white'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12 border-2 border-white/30 flex-shrink-0">
                      <AvatarImage src={vendedor.photo_url} alt={vendedor.nome} />
                      <AvatarFallback className="bg-white/20 text-white text-sm">
                        {vendedor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info do vendedor */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-base truncate" title={vendedor.nome}>
                        {vendedor.nome}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <Target className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Meta: {vendedor.metaSemanal} | Pts: {vendedor.pontuacao}</span>
                      </div>
                      <div className="mt-1">
                        <Progress 
                          value={vendedor.percentualAtingido} 
                          className="h-2"
                        />
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-white">
                        {vendedor.vendas}
                      </div>
                      <div className={`text-sm font-semibold ${
                        vendedor.percentualAtingido >= 100 ? 'text-green-400' :
                        vendedor.percentualAtingido >= 80 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {vendedor.percentualAtingido.toFixed(1)}%
                      </div>
                      {vendedor.isSDR && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          SDR
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TVRankingDisplay;