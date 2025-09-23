import React, { useState, useMemo, useEffect } from 'react';
import { useSmartTVRankingData } from '@/hooks/useSmartTVRankingData';
import { useSelectiveRealtimeTVUpdates } from '@/hooks/useSelectiveRealtimeTVUpdates';
import { TVHeader } from './tv/TVHeader';
import { TVPodium } from './tv/TVPodium';
import { TVVendorCard } from './tv/TVVendorCard';
import { TVSDRSection } from './tv/TVSDRSection';
import { TVSummaryPanel } from './tv/TVSummaryPanel';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface VendedorData {
  id: string;
  name: string;
  weeklySales: number;
  weeklyTarget: number;
  avatar: string;
  points: number;
  isSDR: boolean;
  nivel?: string;
  reunioesSemana?: number;
  metaReunioesSemanais?: number;
  taxaConversaoSemanal?: number;
  yesterdayProgress?: number;
  todayProgress?: number;
}

const PublicTVRanking: React.FC = () => {
  // Estados para controles da TV
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Hooks otimizados para TV
  const { vendedoresData, isLoading, error, lastUpdated, weekSummary } = useSmartTVRankingData(semanaOffset);
  const { forceRefresh, connectionStatus } = useSelectiveRealtimeTVUpdates();

  // Separar vendedores e SDRs
  const { vendedores, sdrs } = useMemo(() => {
    const vendedores = vendedoresData.filter(v => !v.isSDR);
    const sdrs = vendedoresData.filter(v => v.isSDR);
    return {
      vendedores: vendedores.sort((a, b) => b.weeklySales - a.weeklySales),
      sdrs: sdrs.sort((a, b) => b.weeklySales - a.weeklySales)
    };
  }, [vendedoresData]);

  const topThree = vendedores.slice(0, 3);
  const restOfVendedores = vendedores.slice(3, 12); // Top 12 para TV

  // Controles da TV
  const getCurrentWeekText = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 3 + (semanaOffset * 7)); // Quarta
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Terça
    
    return `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Ranking de Vendas - TV', 20, 20);
    doc.text(`Período: ${getCurrentWeekText()}`, 20, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 40);
    
    const tableData = vendedores.map((v, i) => [
      i + 1,
      v.name,
      v.weeklySales.toFixed(1),
      v.weeklyTarget.toString(),
      `${((v.weeklySales / v.weeklyTarget) * 100).toFixed(0)}%`
    ]);
    
    (doc as any).autoTable({
      head: [['Posição', 'Nome', 'Vendas', 'Meta', 'Progresso']],
      body: tableData,
      startY: 50
    });
    
    doc.save(`ranking-vendas-${getCurrentWeekText()}.pdf`);
  };

  const handleExportExcel = () => {
    const data = vendedores.map((v, i) => ({
      Posição: i + 1,
      Nome: v.name,
      Vendas: v.weeklySales,
      Meta: v.weeklyTarget,
      Progresso: `${((v.weeklySales / v.weeklyTarget) * 100).toFixed(0)}%`,
      'Ontem': v.yesterdayProgress || 0,
      'Hoje': v.todayProgress || 0
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ranking');
    XLSX.writeFile(wb, `ranking-vendas-${getCurrentWeekText()}.xlsx`);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Efeito para detectar mudança de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-2xl text-white font-semibold">Carregando ranking para TV...</p>
          <p className="text-lg text-white/70 mt-2">Otimizado para tela de 40 polegadas</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-red-400 mb-4 font-semibold">Erro ao carregar dados</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-slate-900"
      style={{ 
        transform: `scale(${currentZoom / 100})`,
        transformOrigin: 'top left',
        width: `${10000 / currentZoom}%`,
        height: `${10000 / currentZoom}%`
      }}
    >
      {/* Header da TV */}
      <TVHeader
        currentWeekText={getCurrentWeekText()}
        semanaOffset={semanaOffset}
        onWeekChange={setSemanaOffset}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onToggleFullscreen={handleToggleFullscreen}
        onZoomChange={setCurrentZoom}
        onForceRefresh={forceRefresh}
        currentZoom={currentZoom}
        isConnected={connectionStatus === 'SUBSCRIBED'}
        lastUpdated={lastUpdated}
        isFullscreen={isFullscreen}
      />

      <div className="p-6">
        <div className="grid grid-cols-4 gap-6 max-w-[1800px] mx-auto">
          {/* Coluna principal - 3/4 da tela */}
          <div className="col-span-3 space-y-8">
            {/* Podium */}
            {topThree.length >= 3 && (
              <TVPodium topThree={topThree} />
            )}

            {/* Cards dos vendedores (posições 4+) */}
            {restOfVendedores.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                {restOfVendedores.map((person, index) => (
                  <TVVendorCard
                    key={person.id}
                    person={person}
                    rank={index + 4}
                  />
                ))}
              </div>
            )}

            {/* Seção SDR */}
            <TVSDRSection sdrData={sdrs} />
          </div>

          {/* Painel lateral - 1/4 da tela */}
          <div className="col-span-1">
            <TVSummaryPanel 
              weekSummary={weekSummary}
              currentWeekText={getCurrentWeekText()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicTVRanking;