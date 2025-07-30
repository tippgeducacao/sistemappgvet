
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
  const { metasSemanais, getSemanaAtual, getMesAnoSemanaAtual, getDataInicioSemana, getDataFimSemana, loading: metasLoading } = useMetasSemanais();
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

  // Obter o mês e ano corretos baseados na semana atual (terça-feira que encerra)
  const { mes: mesCorreto, ano: anoCorreto } = getMesAnoSemanaAtual();
  const semanaAtual = getSemanaAtual();
  
  console.log('🔍 DEBUG Metas Diárias:');
  console.log('  📅 Mês/Ano selecionado no dashboard:', selectedMonth, '/', selectedYear);
  console.log('  📅 Mês/Ano correto da semana atual:', mesCorreto, '/', anoCorreto);
  console.log('  📅 Semana atual:', semanaAtual);

  // Verificar se estamos consultando o mês/ano correto da semana atual
  const isCurrentWeekMonth = selectedMonth === mesCorreto && selectedYear === anoCorreto;

  if (!isCurrentWeekMonth) {
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
            <p>Metas diárias disponíveis apenas para a semana atual</p>
            <p className="text-xs mt-1">Semana atual: {mesCorreto}/{anoCorreto}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Buscar meta da semana atual usando o mês/ano corretos
  const metaSemanaAtual = metasSemanais.find(meta => 
    meta.vendedor_id === profile.id && 
    meta.ano === anoCorreto && 
    meta.semana === semanaAtual
  );
  console.log('  👤 Vendedor ID:', profile.id);
  console.log('  📊 Meta semanal encontrada:', metaSemanaAtual);
  console.log('  📊 Total vendas carregadas:', vendas.length);
  console.log('  📊 Vendas do vendedor:', vendas.filter(v => v.vendedor_id === profile.id).length);

  // Calcular pontos de hoje
  const hoje = new Date();
  const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  const vendasHoje = vendas.filter(venda => {
    if (venda.vendedor_id !== profile.id) return false;
    if (venda.status !== 'matriculado') return false;
    
    // Usar data de aprovação se disponível (prioritária), senão data de envio
    const dataParaComparar = venda.data_aprovacao ? new Date(venda.data_aprovacao) : new Date(venda.enviado_em || venda.atualizado_em);
    const vendaSemHora = new Date(dataParaComparar.getFullYear(), dataParaComparar.getMonth(), dataParaComparar.getDate());
    
    return vendaSemHora.getTime() === hojeSemHora.getTime();
  });

  const pontosHoje = vendasHoje.reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);

  // Usar as funções do hook para calcular o período da semana - MAS usando o mês/ano corretos
  const inicioSemana = getDataInicioSemana(anoCorreto, mesCorreto, semanaAtual);
  const fimSemana = getDataFimSemana(anoCorreto, mesCorreto, semanaAtual);

  console.log('  📅 Início da semana (quarta):', inicioSemana.toLocaleDateString('pt-BR'));
  console.log('  📅 Fim da semana (terça):', fimSemana.toLocaleDateString('pt-BR'));

  // Calcular pontos da semana atual usando as datas corretas do hook
  const pontosSemanaAtual = vendas.filter(venda => {
    if (venda.vendedor_id !== profile.id) return false;
    if (venda.status !== 'matriculado') return false;
    
    // USAR DATA DE APROVAÇÃO (data_aprovacao) se disponível, senão usar atualizado_em
    const dataParaFiltro = venda.data_aprovacao 
      ? new Date(venda.data_aprovacao) 
      : venda.atualizado_em 
        ? new Date(venda.atualizado_em) 
        : new Date(venda.enviado_em);
    const vendaSemHora = new Date(dataParaFiltro.getFullYear(), dataParaFiltro.getMonth(), dataParaFiltro.getDate());
    
    const isInRange = vendaSemHora >= inicioSemana && vendaSemHora <= fimSemana;
    
    if (isInRange) {
      console.log(`    ✅ Venda incluída: ${venda.aluno?.nome}, Data Aprovação: ${dataParaFiltro.toLocaleDateString('pt-BR')}, Pontos: ${venda.pontuacao_validada || venda.pontuacao_esperada || 0}`);
    }
    
    return isInRange;
  }).reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);

  console.log('  📊 Pontos da semana atual:', pontosSemanaAtual);

  // Calcular total de dias na semana (quarta a terça = 7 dias)
  const totalDiasSemana = 7;
  
  // Meta diária = meta semanal / total de dias (fixo, não muda com o progresso)
  const metaDiaria = metaSemanaAtual?.meta_vendas 
    ? Number((metaSemanaAtual.meta_vendas / totalDiasSemana).toFixed(1)) 
    : 0;

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
            Semana {semanaAtual} de {anoCorreto} (referente a {mesCorreto}/{anoCorreto})
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
