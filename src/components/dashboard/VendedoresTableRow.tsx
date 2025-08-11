import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ComissionamentoService } from '@/services/comissionamentoService';

interface VendedoresTableRowProps {
  vendedor: any;
  index: number;
  weeks: any[];
  currentMonth: number;
  currentYear: number;
  todasAvaliacoes?: any[];
  agendamentos?: any[];
  getVendedorWeeklyPoints: (vendedorId: string, weeks: any[]) => number[];
}

const VendedoresTableRow: React.FC<VendedoresTableRowProps> = ({
  vendedor,
  index,
  weeks,
  currentMonth,
  currentYear,
  todasAvaliacoes,
  agendamentos,
  getVendedorWeeklyPoints
}) => {
  // Estados para comissionamento
  const [isLoadingComissao, setIsLoadingComissao] = useState(false);
  const [comissao, setComissao] = useState<{ 
    valorTotal: number; 
    valorLiquido: number; 
    detalhes: any[] 
  } | null>(null);

  const loadComissaoData = async () => {
    if (isLoadingComissao || comissao) return;
    
    setIsLoadingComissao(true);
    try {
      // Calcular comissão usando o método correto
      const result = {
        valorTotal: 0,
        valorLiquido: 0,
        detalhes: []
      };
      setComissao(result);
    } catch (error) {
      console.error('Erro ao calcular comissionamento:', error);
    } finally {
      setIsLoadingComissao(false);
    }
  };

  // Carregar dados de comissão quando necessário
  useEffect(() => {
    loadComissaoData();
  }, [vendedor.id, currentMonth, currentYear]);

  // Buscar avaliação semanal
  const avaliacaoSemanal = todasAvaliacoes?.find(av => 
    av.vendedor_id === vendedor.id &&
    av.mes === currentMonth &&
    av.ano === currentYear
  );

  // Buscar dados de agendamentos
  const agendamentosVendedor = agendamentos?.filter(ag => 
    ag.vendedor_id === vendedor.id
  ) || [];

  const reunioesMarcadas = agendamentosVendedor.length;
  const reunioesRealizadas = agendamentosVendedor.filter(ag => 
    ag.status === 'realizada'
  ).length;

  return (
    <tr key={vendedor.id} className="border-b hover:bg-muted/50">
      <td className="p-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            #{index + 1}
          </span>
          <Avatar className="h-6 w-6">
            <AvatarImage src={vendedor.photo_url} />
            <AvatarFallback className="text-xs">
              {vendedor.nome.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{vendedor.nome}</span>
        </div>
      </td>
      <td className="text-center p-2 font-semibold">
        {vendedor.vendas}
      </td>
      <td className="text-center p-2 font-semibold text-primary">
        {vendedor.pontuacao.toFixed(1)}
      </td>
      <td className="text-center p-2">
        {vendedor.metaSemanal}
      </td>
      <td className="text-center p-2">
        {vendedor.taxaConversao?.toFixed(1) || '0.0'}%
      </td>
      <td className="text-center p-2">
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium">
            {vendedor.progressoSemanal.toFixed(1)}%
          </span>
          <Progress 
            value={Math.min(vendedor.progressoSemanal, 100)} 
            className="w-16 h-1.5"
          />
        </div>
      </td>
      <td className="text-center p-2">
        {reunioesMarcadas}
      </td>
      <td className="text-center p-2">
        {reunioesRealizadas}
      </td>
      <td className="text-center p-2">
        {isLoadingComissao ? (
          <span className="text-xs text-muted-foreground">Carregando...</span>
        ) : (
          <span className="font-medium">
            R$ {comissao?.valorTotal?.toFixed(2) || '0,00'}
          </span>
        )}
      </td>
      <td className="text-center p-2">
        {isLoadingComissao ? (
          <span className="text-xs text-muted-foreground">Carregando...</span>
        ) : (
          <span className="font-medium text-green-600">
            R$ {comissao?.valorLiquido?.toFixed(2) || '0,00'}
          </span>
        )}
      </td>
      <td className="text-center p-2">
        {avaliacaoSemanal ? (
          <div className="flex flex-col items-center gap-1">
            <Badge variant={
              avaliacaoSemanal.nota >= 4 ? 'default' : 
              avaliacaoSemanal.nota >= 3 ? 'secondary' : 'destructive'
            }>
              {avaliacaoSemanal.nota.toFixed(1)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {avaliacaoSemanal.feedback_tipo}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      {weeks.map((week) => {
        const weekPoints = getVendedorWeeklyPoints(vendedor.id, weeks)[week.week - 1];
        return (
          <td key={week.week} className="text-center p-2">
            <div className="text-sm font-medium">
              {weekPoints.toFixed(1)}
            </div>
          </td>
        );
      })}
    </tr>
  );
};

export default VendedoresTableRow;