import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, TrendingUp } from 'lucide-react';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useVendas } from '@/hooks/useVendas';
import { useAuthStore } from '@/stores/AuthStore';

interface VendedorMetasDiariasProps {
  selectedMonth: number;
  selectedYear: number;
}

const VendedorMetasDiarias: React.FC<VendedorMetasDiariasProps> = ({
  selectedMonth,
  selectedYear
}) => {
  const { metasSemanais, getSemanaAtual, loading: metasLoading } = useMetasSemanais();
  const { vendas, isLoading: vendasLoading } = useVendas();
  const { profile } = useAuthStore();

  if (vendasLoading || metasLoading || !profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Carregando metas diárias...</p>
        </CardContent>
      </Card>
    );
  }

  // Verificar se estamos no mês atual
  const dataAtual = new Date();
  const mesAtual = dataAtual.getMonth() + 1;
  const anoAtual = dataAtual.getFullYear();
  const isCurrentMonth = selectedMonth === mesAtual && selectedYear === anoAtual;

  if (!isCurrentMonth) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Meta Diária
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Metas diárias disponíveis apenas para o mês atual</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const semanaAtual = getSemanaAtual();
  
  // Buscar meta da semana atual
  const metaSemanaAtual = metasSemanais.find(meta => 
    meta.vendedor_id === profile.id && 
    meta.ano === selectedYear && 
    meta.semana === semanaAtual
  );

  // Calcular meta diária (meta semanal / 7 dias)
  const metaDiaria = metaSemanaAtual ? Math.ceil(metaSemanaAtual.meta_vendas / 7) : 0;

  // Calcular pontos de hoje
  const hoje = new Date();
  const inicioDoHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimDoHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

  console.log('🗓️ DEBUG META DIÁRIA:');
  console.log('  📅 Hoje:', hoje.toLocaleDateString('pt-BR'));
  console.log('  ⏰ Início do dia:', inicioDoHoje.toLocaleString('pt-BR'));
  console.log('  ⏰ Fim do dia:', fimDoHoje.toLocaleString('pt-BR'));

  const vendasHoje = vendas.filter(venda => {
    if (venda.status !== 'matriculado') return false;
    if (!venda.enviado_em) return false;
    
    const vendaDate = new Date(venda.enviado_em);
    const isToday = vendaDate >= inicioDoHoje && vendaDate <= fimDoHoje;
    
    console.log(`  📝 Venda ${venda.id?.slice(0, 8)}: ${vendaDate.toLocaleString('pt-BR')} - Hoje? ${isToday} - Pontos: ${venda.pontuacao_validada || venda.pontuacao_esperada || 0}`);
    
    return isToday;
  });

  const pontosHoje = vendasHoje.reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
  
  console.log(`  📊 TOTAL DE VENDAS HOJE: ${vendasHoje.length}`);
  console.log(`  🎯 TOTAL DE PONTOS HOJE: ${pontosHoje}`);

  // Calcular progresso do dia
  const progressoDiario = metaDiaria > 0 ? (pontosHoje / metaDiaria) * 100 : 0;

  // Calcular período da semana atual
  const inicioSemana = new Date(selectedYear, selectedMonth - 1, 1);
  let firstWednesday = new Date(inicioSemana);
  while (firstWednesday.getDay() !== 3) {
    firstWednesday.setDate(firstWednesday.getDate() + 1);
  }

  const targetWednesday = new Date(firstWednesday);
  targetWednesday.setDate(targetWednesday.getDate() + (semanaAtual - 1) * 7);

  const fimSemana = new Date(targetWednesday);
  fimSemana.setDate(fimSemana.getDate() + 6);

  const lastDay = new Date(selectedYear, selectedMonth, 0);
  const endDate = fimSemana > lastDay ? lastDay : fimSemana;

  // Calcular pontos da semana atual
  const pontosSemanaAtual = vendas.filter(venda => {
    if (venda.status !== 'matriculado') return false;
    const vendaDate = new Date(venda.enviado_em);
    return vendaDate >= targetWednesday && vendaDate <= endDate;
  }).reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);

  // Calcular dias restantes na semana
  const diasRestantes = Math.max(0, Math.ceil((endDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));

  // Meta diária ajustada baseada no progresso da semana
  const metaRestante = Math.max(0, (metaSemanaAtual?.meta_vendas || 0) - pontosSemanaAtual);
  const metaDiariaAjustada = diasRestantes > 0 ? Math.ceil(metaRestante / diasRestantes) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Meta Diária */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meta de Hoje</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metaDiaria}</div>
          <p className="text-xs text-muted-foreground">
            pontos para hoje
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span>Progresso</span>
              <span>{pontosHoje.toFixed(1)}/{metaDiaria}</span>
            </div>
            {metaDiaria > 0 && (
              <Progress 
                value={Math.min(progressoDiario, 100)} 
                className="h-2" 
              />
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={pontosHoje >= metaDiaria ? "default" : "secondary"}>
              {pontosHoje >= metaDiaria ? "Meta Atingida" : `${Math.round(progressoDiario)}%`}
            </Badge>
            {pontosHoje >= metaDiaria && (
              <TrendingUp className="h-4 w-4 text-green-500" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meta Diária Ajustada */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meta Diária Ajustada</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metaDiariaAjustada}</div>
          <p className="text-xs text-muted-foreground">
            pontos para cumprir a meta semanal
          </p>
          <div className="mt-3 space-y-1">
            <div className="text-xs text-muted-foreground">
              • {pontosSemanaAtual.toFixed(1)} pontos na semana
            </div>
            <div className="text-xs text-muted-foreground">
              • {metaRestante.toFixed(1)} pontos restantes
            </div>
            <div className="text-xs text-muted-foreground">
              • {diasRestantes} dias restantes
            </div>
          </div>
          {metaDiariaAjustada > metaDiaria && (
            <Badge variant="destructive" className="mt-2 text-xs">
              Acima da meta base
            </Badge>
          )}
          {metaDiariaAjustada < metaDiaria && metaRestante > 0 && (
            <Badge variant="default" className="mt-2 text-xs">
              Abaixo da meta base
            </Badge>
          )}
          {metaRestante === 0 && (
            <Badge variant="default" className="mt-2 text-xs">
              Meta semanal atingida!
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendedorMetasDiarias;