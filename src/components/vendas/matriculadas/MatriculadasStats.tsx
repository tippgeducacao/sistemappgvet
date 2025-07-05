
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import { DataFormattingService } from '@/services/formatting/DataFormattingService';
import type { VendaCompleta } from '@/hooks/useVendas';

interface MatriculadasStatsProps {
  vendas: VendaCompleta[];
}

const MatriculadasStats: React.FC<MatriculadasStatsProps> = ({ vendas }) => {
  const totalReceita = vendas.reduce((sum, v) => sum + (v.pontuacao_esperada || 0), 0) * 100;
  const totalPontuacao = Math.round(vendas.reduce((sum, v) => sum + (v.pontuacao_validada || v.pontuacao_esperada || 0), 0));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Matrículas Ativas</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-ppgvet-magenta">{vendas.length}</div>
          <p className="text-xs text-muted-foreground">
            Alunos matriculados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R$ {DataFormattingService.formatCurrency(totalReceita)}
          </div>
          <p className="text-xs text-muted-foreground">
            Valor estimado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pontuação Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-ppgvet-teal">{totalPontuacao} pts</div>
          <p className="text-xs text-muted-foreground">
            Pontos validados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatriculadasStats;
