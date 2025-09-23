import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Download, 
  ZoomIn, 
  Maximize, 
  Wifi, 
  WifiOff,
  RefreshCw 
} from 'lucide-react';

interface TVHeaderProps {
  currentWeekText: string;
  semanaOffset: number;
  onWeekChange: (offset: number) => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onToggleFullscreen: () => void;
  onZoomChange: (zoom: number) => void;
  onForceRefresh: () => void;
  currentZoom: number;
  isConnected: boolean;
  lastUpdated: string;
  isFullscreen: boolean;
}

export const TVHeader: React.FC<TVHeaderProps> = ({
  currentWeekText,
  semanaOffset,
  onWeekChange,
  onExportPDF,
  onExportExcel,
  onToggleFullscreen,
  onZoomChange,
  onForceRefresh,
  currentZoom,
  isConnected,
  lastUpdated,
  isFullscreen
}) => {
  const zoomOptions = [80, 90, 100, 110, 120];

  return (
    <div className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Título e navegação de semana */}
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-foreground">
            Ranking de Vendas - TV
          </h1>
          
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1">
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onWeekChange(semanaOffset - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
              {currentWeekText}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onWeekChange(semanaOffset + 1)}
              className="h-8 w-8 p-0"
              disabled={semanaOffset >= 0} // Não permitir ir para semanas futuras
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Controles da direita */}
        <div className="flex items-center gap-3">
          {/* Botões de export */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            className="flex items-center gap-2 text-xs"
          >
            <FileText className="h-3 w-3" />
            PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            className="flex items-center gap-2 text-xs"
          >
            <Download className="h-3 w-3" />
            Excel
          </Button>

          {/* Controle de zoom */}
          <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
            <ZoomIn className="h-3 w-3 text-muted-foreground" />
            <select
              value={currentZoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="bg-transparent text-xs border-none outline-none text-foreground"
            >
              {zoomOptions.map(zoom => (
                <option key={zoom} value={zoom}>{zoom}%</option>
              ))}
            </select>
          </div>

          {/* Indicador AO VIVO */}
          <Button
            variant={isConnected ? "default" : "destructive"}
            size="sm"
            onClick={onForceRefresh}
            className="flex items-center gap-2 text-xs min-w-[90px]"
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                AO VIVO
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                <RefreshCw className="h-3 w-3" />
              </>
            )}
          </Button>

          {/* Tela cheia */}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFullscreen}
            className="flex items-center gap-2 text-xs"
          >
            <Maximize className="h-3 w-3" />
            {isFullscreen ? 'Sair' : 'Tela Cheia'}
          </Button>
        </div>
      </div>

      {/* Status bar com última atualização */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Otimizado para TV 40 polegadas</span>
          <span>•</span>
          <span>Atualização automática ativa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>Última atualização: {lastUpdated}</span>
        </div>
      </div>
    </div>
  );
};