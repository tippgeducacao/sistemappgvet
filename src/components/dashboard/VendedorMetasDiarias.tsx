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

  // Calcular pontos de hoje
  const hoje = new Date();
  
  // Criar data apenas com ano, mês e dia (sem horário)
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  const vendasHoje = vendas.filter(venda => {
    // Filtrar apenas vendas do vendedor logado
    if (venda.vendedor_id !== profile.id) return false;
    
    // Filtrar apenas vendas matriculadas
    if (venda.status !== 'matriculado') return false;
    
    // Verificar se tem data de envio
    if (!venda.enviado_em) return false;
    
    // Verificar se a venda foi feita hoje
    const vendaDate = new Date(venda.enviado_em);
    const vendaSemHora = new Date(vendaDate.getFullYear(), vendaDate.getMonth(), vendaDate.getDate());
    
    return vendaSemHora.getTime() === hojeSemHora.getTime();
  });

  const pontosHoje = vendasHoje.reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);

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
    if (venda.vendedor_id !== profile.id) return false;
    if (venda.status !== 'matriculado') return false;
    if (!venda.enviado_em) return false;
    
    const vendaDate = new Date(venda.enviado_em);
    const vendaSemHora = new Date(vendaDate.getFullYear(), vendaDate.getMonth(), vendaDate.getDate());
    
    // Verificar se a venda está dentro do período da semana atual (quarta a terça)
    return vendaSemHora >= targetWednesday && vendaSemHora <= endDate;
  }).reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);

  console.log('🔍 DEBUG Meta Diária:');
  console.log('  📅 Target Wednesday:', targetWednesday.toISOString().split('T')[0]);
  console.log('  📅 End Date:', endDate.toISOString().split('T')[0]);
  console.log('  📅 Hoje:', hojeSemHora.toISOString().split('T')[0]);
  console.log('  📊 Meta semanal:', metaSemanaAtual?.meta_vendas || 0);
  console.log('  📊 Pontos semana atual:', pontosSemanaAtual);
  console.log('  📊 Total de vendas:', vendas.length);
  console.log('  📊 Vendas filtradas semana:', vendas.filter(venda => {
    if (venda.vendedor_id !== profile.id) return false;
    if (venda.status !== 'matriculado') return false;
    if (!venda.enviado_em) return false;
    const vendaDate = new Date(venda.enviado_em);
    const vendaSemHora = new Date(vendaDate.getFullYear(), vendaDate.getMonth(), vendaDate.getDate());
    return vendaSemHora >= targetWednesday && vendaSemHora <= endDate;
  }).length);

  // Calcular dias restantes na semana atual (de hoje até terça da semana)
  const diasRestantesNaSemana = Math.max(1, Math.floor((endDate.getTime() - hojeSemHora.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Calcular pontos restantes para a meta semanal
  const pontosRestantes = Math.max(0, (metaSemanaAtual?.meta_vendas || 0) - pontosSemanaAtual);
  
  // Meta diária = pontos restantes / dias restantes (incluindo hoje)
  const metaDiaria = diasRestantesNaSemana > 0 ? Number((pontosRestantes / diasRestantesNaSemana).toFixed(1)) : 0;

  console.log('  📊 Pontos restantes:', pontosRestantes);
  console.log('  📊 Dias restantes na semana:', diasRestantesNaSemana);
  console.log('  📊 Meta diária calculada:', metaDiaria);

  // Calcular progresso do dia
  const progressoDiario = metaDiaria > 0 ? (pontosHoje / metaDiaria) * 100 : 0;

  // Calcular dias restantes na semana (para mostrar na interface)
  const diasRestantes = Math.max(0, Math.ceil((endDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));

  // Calcular progresso semanal
  const progressoSemanal = (metaSemanaAtual?.meta_vendas || 0) > 0 
    ? (pontosSemanaAtual / (metaSemanaAtual?.meta_vendas || 1)) * 100 
    : 0;

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

      {/* Meta Semanal */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meta da Semana Atual</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metaSemanaAtual?.meta_vendas || 0}</div>
          <p className="text-xs text-muted-foreground">
            Semana {semanaAtual} de {selectedYear}
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span>Progresso</span>
              <span>{pontosSemanaAtual.toFixed(1)}/{metaSemanaAtual?.meta_vendas || 0}</span>
            </div>
            {(metaSemanaAtual?.meta_vendas || 0) > 0 && (
              <Progress 
                value={Math.min(progressoSemanal, 100)} 
                className="h-2" 
              />
            )}
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-xs text-muted-foreground">
              • {pontosSemanaAtual.toFixed(1)} pontos conquistados
            </div>
            <div className="text-xs text-muted-foreground">
              • {Math.max(0, (metaSemanaAtual?.meta_vendas || 0) - pontosSemanaAtual).toFixed(1)} pontos restantes
            </div>
            <div className="text-xs text-muted-foreground">
              • {diasRestantes} dias restantes
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={pontosSemanaAtual >= (metaSemanaAtual?.meta_vendas || 0) ? "default" : "secondary"}>
              {pontosSemanaAtual >= (metaSemanaAtual?.meta_vendas || 0) ? "Meta Atingida" : `${Math.round(progressoSemanal)}%`}
            </Badge>
            {pontosSemanaAtual >= (metaSemanaAtual?.meta_vendas || 0) && (
              <TrendingUp className="h-4 w-4 text-green-500" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendedorMetasDiarias;