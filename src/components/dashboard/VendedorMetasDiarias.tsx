
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
  const { metasSemanais, getSemanaAtual, getDataInicioSemana, getDataFimSemana, loading: metasLoading } = useMetasSemanais();
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

  console.log('🔍 DEBUG Metas Diárias:');
  console.log('  👤 Vendedor ID:', profile.id);
  console.log('  📅 Semana atual:', semanaAtual);
  console.log('  📊 Meta semanal encontrada:', metaSemanaAtual);
  console.log('  📊 Total vendas carregadas:', vendas.length);
  console.log('  📊 Vendas do vendedor:', vendas.filter(v => v.vendedor_id === profile.id).length);

  // Calcular pontos de hoje
  const hoje = new Date();
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  const vendasHoje = vendas.filter(venda => {
    if (venda.vendedor_id !== profile.id) return false;
    if (venda.status !== 'matriculado') return false;
    if (!venda.enviado_em) return false;
    
    const vendaDate = new Date(venda.enviado_em);
    const vendaSemHora = new Date(vendaDate.getFullYear(), vendaDate.getMonth(), vendaDate.getDate());
    
    return vendaSemHora.getTime() === hojeSemHora.getTime();
  });

  const pontosHoje = vendasHoje.reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);

  // Usar as funções do hook para calcular o período da semana
  const inicioSemana = getDataInicioSemana(selectedYear, selectedMonth, semanaAtual);
  const fimSemana = getDataFimSemana(selectedYear, selectedMonth, semanaAtual);

  console.log('  📅 Início da semana (quarta):', inicioSemana.toLocaleDateString('pt-BR'));
  console.log('  📅 Fim da semana (terça):', fimSemana.toLocaleDateString('pt-BR'));

  // Calcular pontos da semana atual usando as datas corretas do hook
  const pontosSemanaAtual = vendas.filter(venda => {
    if (venda.vendedor_id !== profile.id) return false;
    if (venda.status !== 'matriculado') return false;
    if (!venda.enviado_em) return false;
    
    const vendaDate = new Date(venda.enviado_em);
    const vendaSemHora = new Date(vendaDate.getFullYear(), vendaDate.getMonth(), vendaDate.getDate());
    
    const isInRange = vendaSemHora >= inicioSemana && vendaSemHora <= fimSemana;
    
    if (isInRange) {
      console.log(`    ✅ Venda incluída: ${venda.aluno?.nome}, Data: ${vendaDate.toLocaleDateString('pt-BR')}, Pontos: ${venda.pontuacao_validada || venda.pontuacao_esperada || 0}`);
    }
    
    return isInRange;
  }).reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);

  console.log('  📊 Pontos da semana atual:', pontosSemanaAtual);

  // Calcular dias restantes da semana
  const diasRestantesNaSemana = Math.max(1, Math.floor((fimSemana.getTime() - hojeSemHora.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  // Calcular pontos restantes para a meta semanal
  const pontosRestantes = Math.max(0, (metaSemanaAtual?.meta_vendas || 0) - pontosSemanaAtual);
  
  // Meta diária = pontos restantes / dias restantes
  const metaDiaria = diasRestantesNaSemana > 0 ? Number((pontosRestantes / diasRestantesNaSemana).toFixed(1)) : 0;

  console.log('  📊 Pontos restantes:', pontosRestantes);
  console.log('  📊 Dias restantes na semana:', diasRestantesNaSemana);
  console.log('  📊 Meta diária calculada:', metaDiaria);

  // Calcular progresso do dia
  const progressoDiario = metaDiaria > 0 ? (pontosHoje / metaDiaria) * 100 : 0;

  // Calcular dias restantes na semana (para mostrar na interface)
  const diasRestantes = Math.max(0, Math.ceil((fimSemana.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));

  // Calcular progresso semanal
  const progressoSemanal = (metaSemanaAtual?.meta_vendas || 0) > 0 
    ? (pontosSemanaAtual / (metaSemanaAtual?.meta_vendas || 1)) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Meta de Hoje */}
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

      {/* Meta da Semana Atual */}
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
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={metaSemanaAtual?.meta_vendas ? "default" : "secondary"}>
              {metaSemanaAtual?.meta_vendas ? "Meta Definida" : "Sem Meta"}
            </Badge>
            <p className="text-xs text-muted-foreground">{Math.round(progressoSemanal)}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendedorMetasDiarias;
