import React, { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, X, Maximize2, Minimize2 } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useVendedores } from '@/hooks/useVendedores';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useNiveis } from '@/hooks/useNiveis';
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
  const { niveis, loading: niveisLoading } = useNiveis();
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

  const isLoading = vendasLoading || vendedoresLoading || metasLoading || niveisLoading;

  // Filtrar vendedores (incluir todos vendedores e SDRs ativos)
  const vendedoresFiltrados = useMemo(() => {
    const userEmail = profile?.email || currentUser?.email;
    const isSpecificAdmin = userEmail === 'wallasmonteiro019@gmail.com';
    
    return vendedores.filter(vendedor => {
      // Apenas vendedores ativos
      if (!vendedor.ativo) return false;
      
      // Incluir vendedores e SDRs
      const isVendedorOrSDR = vendedor.user_type === 'vendedor' || 
                             vendedor.user_type?.includes('sdr');
      
      if (!isVendedorOrSDR) return false;
      
      // Filtrar "Vendedor teste" exceto para admin específico
      if (!isSpecificAdmin && vendedor.name === 'Vendedor teste') {
        return false;
      }
      
      return true;
    });
  }, [vendedores, profile?.email, currentUser?.email]);

  // Calcular estatísticas da semana atual (quarta a terça)
  const vendedoresStats = useMemo(() => {
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

  // Função para calcular meta diária restante
  const calculateDynamicDailyGoal = (metaSemanal: number, pontosAtual: number) => {
    if (pontosAtual >= metaSemanal) return 0;
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Mapear para dias de trabalho (quarta=1, terça=7)
    let diaAtual = 1;
    if (dayOfWeek === 3) diaAtual = 1; // Quarta
    else if (dayOfWeek === 4) diaAtual = 2; // Quinta  
    else if (dayOfWeek === 5) diaAtual = 3; // Sexta
    else if (dayOfWeek === 6) diaAtual = 4; // Sábado
    else if (dayOfWeek === 0) diaAtual = 5; // Domingo
    else if (dayOfWeek === 1) diaAtual = 6; // Segunda
    else if (dayOfWeek === 2) diaAtual = 7; // Terça
    
    const pontosRestantes = Math.max(0, metaSemanal - pontosAtual);
    const diasRestantes = Math.max(1, 8 - diaAtual);
    
    return pontosRestantes / diasRestantes;
  };

  // Criar ranking completo
  const ranking = useMemo(() => {
    return vendedoresFiltrados.map(vendedor => {
      const stats = vendedoresStats[vendedor.id] || { vendas: 0, pontuacao: 0 };
      
      // Buscar configuração do nível
      const vendedorNivel = vendedor.nivel || 'junior';
      const nivelConfig = niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === vendedor.user_type) ||
                         niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === 'vendedor');
      
      const metaSemanal = nivelConfig?.meta_semanal_vendedor || 6;
      const metaDiaria = calculateDynamicDailyGoal(metaSemanal, stats.pontuacao);
      
      return {
        id: vendedor.id,
        nome: vendedor.name,
        photo_url: vendedor.photo_url,
        vendas: stats.vendas,
        pontuacao: stats.pontuacao,
        metaSemanal,
        metaDiaria: Math.round(metaDiaria * 10) / 10,
        isSDR: vendedor.user_type?.includes('sdr') || false
      };
    }).sort((a, b) => {
      // Ordenar por pontuação primeiro, depois por vendas
      if (a.pontuacao !== b.pontuacao) return b.pontuacao - a.pontuacao;
      if (a.vendas !== b.vendas) return b.vendas - a.vendas;
      return a.nome.localeCompare(b.nome);
    });
  }, [vendedoresFiltrados, vendedoresStats, niveis]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white z-50">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-teal-500/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-3 rounded-xl">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Top 3 Vendedores
              </h1>
              <p className="text-lg text-white/80">
                Ranking Semanal • {ranking.reduce((sum, v) => sum + v.vendas, 0)} vendas
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
            </button>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-4xl text-white/60">Carregando dados...</div>
          </div>
        ) : (
          <div className="flex-1 p-8">
            {/* Grid de cards dos vendedores */}
            <div className="grid grid-cols-4 gap-6 max-h-full overflow-y-auto">
              {ranking.map((vendedor, index) => {
                const posicao = index + 1;
                const badgeColor = posicao === 1 ? 'bg-teal-500' : 
                                 posicao === 2 ? 'bg-blue-500' : 
                                 posicao === 3 ? 'bg-purple-500' : 
                                 vendedor.isSDR ? 'bg-orange-500' : 'bg-gray-500';
                
                const borderColor = posicao <= 3 ? 'border-teal-500/50' : 
                                   vendedor.isSDR ? 'border-orange-500/50' : 'border-gray-500/50';

                return (
                  <div
                    key={vendedor.id}
                    className={`bg-slate-800/50 rounded-2xl p-6 border-2 ${borderColor} backdrop-blur-sm`}
                  >
                    {/* Badge da posição */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-teal-400" />
                        {vendedor.isSDR && (
                          <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                            SDR
                          </Badge>
                        )}
                      </div>
                      <Badge className={`${badgeColor} text-white px-3 py-1 text-sm font-bold`}>
                        #{posicao}
                      </Badge>
                    </div>

                    {/* Avatar e nome */}
                    <div className="text-center mb-6">
                      <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-white/20">
                        <AvatarImage src={vendedor.photo_url} alt={vendedor.nome} />
                        <AvatarFallback className="bg-slate-700 text-white text-lg">
                          {vendedor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {vendedor.nome.split(' ')[0]}
                      </h3>
                    </div>

                    {/* Pontuação */}
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-teal-400 mb-1">
                        {vendedor.pontuacao.toFixed(1)} pts
                      </div>
                      <div className="text-sm text-white/60">
                        Posição #{posicao}
                      </div>
                    </div>

                    {/* Metas */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/80">Meta Semanal</span>
                        <span className="text-sm font-semibold text-white">
                          {vendedor.pontuacao.toFixed(1)} pts
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/80">Meta Dia</span>
                        <span className="text-sm font-semibold text-white">
                          {vendedor.metaDiaria} pts/dia
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TVRankingDisplay;