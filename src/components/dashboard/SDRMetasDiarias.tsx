import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useMetasSemanaisSDR } from '@/hooks/useMetasSemanaisSDR';
import { useAgendamentosSDR } from '@/hooks/useAgendamentosSDR';
import { useAuthStore } from '@/stores/AuthStore';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useAllVendas } from '@/hooks/useVendas';
import { useNiveis } from '@/hooks/useNiveis';
import { Calendar, Target } from 'lucide-react';

interface SDRMetasDiariasProps {
  selectedMonth: number;
  selectedYear: number;
}

const SDRMetasDiarias: React.FC<SDRMetasDiariasProps> = ({ 
  selectedMonth, 
  selectedYear 
}) => {
  console.log('🚀 SDRMetasDiarias: Componente iniciado', { selectedMonth, selectedYear });
  
  const { profile, currentUser } = useAuthStore();
  const { 
    getMetaSemanalSDR, 
    getSemanaAtual, 
    loading: metasLoading 
  } = useMetasSemanaisSDR();
  const { agendamentos } = useAgendamentosSDR();
  const { metasSemanais, getSemanaAtual: getSemanaAtualVendedor } = useMetasSemanais();
  const { vendas } = useAllVendas();
  const { niveis } = useNiveis();
  
  console.log('📊 SDRMetasDiarias: Dados do usuário', { 
    profile: { id: profile?.id, user_type: profile?.user_type }, 
    agendamentos: agendamentos?.length || 0,
    metasLoading 
  });

  // Verificar se é mês/ano atual para mostrar metas diárias (baseado na regra de semanas)
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  const { mes: mesAtualSemana, ano: anoAtualSemana } = getMesAnoSemanaAtual();
  const isCurrentMonth = selectedMonth === mesAtualSemana && selectedYear === anoAtualSemana;

  if (metasLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Carregando metas...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isCurrentMonth) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Metas de Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-4">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Metas diárias disponíveis apenas para o mês atual</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se é SDR ou vendedor
  const isSDR = profile?.user_type?.includes('sdr') || false;
  
  if (isSDR) {
    // Lógica para SDRs (meta de vendas de cursos)
    const semanaAtual = getSemanaAtual();
    const metaSemanal = profile?.id ? getMetaSemanalSDR(profile.id, selectedYear, semanaAtual) : null;
    
    console.log('🎯 SDRMetasDiarias: Meta semanal SDR calculada', { 
      semanaAtual, 
      metaSemanal, 
      userId: profile?.id,
      userType: profile?.user_type,
      selectedYear 
    });

    // Calcular vendas de cursos da semana atual
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 4) % 7)); // Última quarta-feira
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6); // Próxima terça-feira
    fimSemana.setHours(23, 59, 59, 999);

    // Vendas de cursos da semana (quarta a terça) - apenas matriculadas
    const vendasCursosSemana = vendas.filter(venda => {
      const dataVenda = new Date(venda.enviado_em);
      const dentroDoPeriodo = dataVenda >= inicioSemana && dataVenda <= fimSemana;
      const isSDRVenda = venda.vendedor_id === profile?.id;
      const isMatriculada = venda.status === 'matriculado';
      
      return dentroDoPeriodo && isSDRVenda && isMatriculada;
    });

    // Vendas de cursos de hoje - apenas matriculadas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vendasCursosHoje = vendas.filter(venda => {
      const dataVenda = new Date(venda.enviado_em);
      dataVenda.setHours(0, 0, 0, 0);
      const dentroDoPeriodo = dataVenda.getTime() === hoje.getTime();
      const isSDRVenda = venda.vendedor_id === profile?.id;
      const isMatriculada = venda.status === 'matriculado';
      
      return dentroDoPeriodo && isSDRVenda && isMatriculada;
    });

    // Cálculos para SDR
    const metaDiaria = metaSemanal?.meta_vendas_cursos ? Math.ceil(metaSemanal.meta_vendas_cursos / 7) : 0;
    const vendasCursosHojeCount = vendasCursosHoje.length;
    const vendasCursosSemanaCount = vendasCursosSemana.length;

    const progressoDiario = metaDiaria > 0 ? Math.min((vendasCursosHojeCount / metaDiaria) * 100, 100) : 0;
    const progressoSemanal = metaSemanal?.meta_vendas_cursos ? 
      Math.min((vendasCursosSemanaCount / metaSemanal.meta_vendas_cursos) * 100, 100) : 0;

    const metaBatidaHoje = vendasCursosHojeCount >= metaDiaria;
    const metaBatidaSemana = metaSemanal ? vendasCursosSemanaCount >= metaSemanal.meta_vendas_cursos : false;

    // Verificar se atingiu 71% da meta para desbloqueio de comissão
    const percentual71 = 71;
    const atingiu71Porcento = progressoSemanal >= percentual71;

    // Calcular agendamentos da semana atual
    const agendamentosRealizadosSemana = agendamentos?.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.data_agendamento);
      const dentroDoPeriodo = dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
      const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                         agendamento.resultado_reuniao === 'comprou';
      
      return dentroDoPeriodo && compareceu;
    })?.length || 0;

    // Buscar meta de agendamentos baseada no nível do SDR
    const nivel = (currentUser as any)?.nivel || (profile as any)?.nivel || 'junior';
    const metaAgendamentos = profile?.user_type === 'sdr_inbound' ? 
      (niveis.find(n => n.nivel === nivel)?.meta_semanal_inbound || 0) :
      (niveis.find(n => n.nivel === nivel)?.meta_semanal_outbound || 0);
    
    const progressoAgendamentos = metaAgendamentos > 0 ? 
      Math.min((agendamentosRealizadosSemana / metaAgendamentos) * 100, 100) : 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meta Semanal de Cursos SDR */}
        <Card className={!atingiu71Porcento ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Meta Semanal de Cursos
              </div>
              <Badge 
                variant={atingiu71Porcento ? "default" : "destructive"}
                className={!atingiu71Porcento ? "bg-red-500 hover:bg-red-600" : ""}
              >
                {atingiu71Porcento ? "Comissão Desbloqueada" : "Comissão Bloqueada"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cursos Vendidos Esta Semana</span>
              <span className="text-lg font-semibold">
                {vendasCursosSemanaCount} / {metaSemanal?.meta_vendas_cursos || 0}
              </span>
            </div>
            
            <Progress 
              value={progressoSemanal} 
              className={`h-2 ${!atingiu71Porcento ? '[&>div]:bg-red-500' : ''}`}
            />
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {Math.round(progressoSemanal)}% da meta semanal
              </span>
              <span className={`font-semibold ${progressoSemanal >= 100 ? 'text-green-600' : progressoSemanal >= 71 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.round(progressoSemanal)}%
              </span>
            </div>
            
            <div className={`text-xs font-medium ${atingiu71Porcento ? 'text-green-600' : 'text-red-600'}`}>
              {atingiu71Porcento 
                ? `✅ Acima de 71% - Comissão desbloqueada` 
                : `❌ Abaixo de 71% - Comissão bloqueada (faltam ${Math.ceil((percentual71 * (metaSemanal?.meta_vendas_cursos || 0) / 100) - vendasCursosSemanaCount)} cursos)`
              }
            </div>
          </CardContent>
        </Card>

        {/* Meta Semanal de Reuniões SDR */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Meta Semanal de Reuniões
              </div>
              <Badge variant={agendamentosRealizadosSemana >= metaAgendamentos ? "default" : "secondary"}>
                {agendamentosRealizadosSemana >= metaAgendamentos ? "Atingida" : "Em Progresso"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reuniões Realizadas Esta Semana</span>
              <span className="text-lg font-semibold">
                {agendamentosRealizadosSemana} / {metaAgendamentos}
              </span>
            </div>
            
            <Progress 
              value={progressoAgendamentos} 
              className="h-2"
            />
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {Math.round(progressoAgendamentos)}% da meta semanal
              </span>
              <span className={`font-semibold ${progressoAgendamentos >= 100 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {Math.round(progressoAgendamentos)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } else {
    // Lógica para vendedores (meta de pontos)
    const semanaAtual = getSemanaAtualVendedor();
    const metaSemanal = metasSemanais.find(m => 
      m.vendedor_id === profile?.id && 
      m.ano === selectedYear && 
      m.semana === semanaAtual
    );
    
    console.log('🎯 SDRMetasDiarias: Meta semanal vendedor calculada', { 
      semanaAtual, 
      metaSemanal, 
      userId: profile?.id,
      userType: profile?.user_type,
      selectedYear 
    });

    // Calcular vendas da semana atual (quarta a terça)
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 4) % 7)); // Última quarta-feira
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6); // Próxima terça-feira
    fimSemana.setHours(23, 59, 59, 999);

    // Vendas da semana do vendedor atual - apenas matriculadas
    const vendasSemana = vendas.filter(venda => {
      const vendaDate = new Date(venda.enviado_em);
      const dentroDoPeriodo = vendaDate >= inicioSemana && vendaDate <= fimSemana;
      const isVendedorVenda = venda.vendedor_id === profile?.id;
      const isMatriculada = venda.status === 'matriculado';
      
      return dentroDoPeriodo && isVendedorVenda && isMatriculada;
    });

    // Vendas de hoje do vendedor atual - apenas matriculadas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const vendasHoje = vendas.filter(venda => {
      const vendaDate = new Date(venda.enviado_em);
      vendaDate.setHours(0, 0, 0, 0);
      const dentroDoPeriodo = vendaDate.getTime() === hoje.getTime();
      const isVendedorVenda = venda.vendedor_id === profile?.id;
      const isMatriculada = venda.status === 'matriculado';
      
      return dentroDoPeriodo && isVendedorVenda && isMatriculada;
    });

    // Calcular pontos obtidos
    const pontosSemana = vendasSemana.reduce((total, venda) => total + (venda.pontuacao_validada || 0), 0);
    const pontosHoje = vendasHoje.reduce((total, venda) => total + (venda.pontuacao_validada || 0), 0);

    // Cálculos para vendedor
    const metaPontosSemanal = metaSemanal?.meta_vendas || 0;
    const metaPontosDiaria = Math.ceil(metaPontosSemanal / 7);

    const progressoDiario = metaPontosDiaria > 0 ? Math.min((pontosHoje / metaPontosDiaria) * 100, 100) : 0;
    const progressoSemanal = metaPontosSemanal > 0 ? 
      Math.min((pontosSemana / metaPontosSemanal) * 100, 100) : 0;

    const metaBatidaHoje = pontosHoje >= metaPontosDiaria;
    const metaBatidaSemana = pontosSemana >= metaPontosSemanal;

    return (
      <div className="grid grid-cols-1 gap-6">
        {/* Meta Semanal Vendedor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Meta Semanal
              </div>
              <Badge variant={metaBatidaSemana ? "default" : "secondary"}>
                {metaBatidaSemana ? "Atingida" : "Em Progresso"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pontos Esta Semana</span>
              <span className="text-lg font-semibold">
                {pontosSemana.toFixed(1)} / {metaPontosSemanal.toFixed(1)}
              </span>
            </div>
            
            <Progress 
              value={progressoSemanal} 
              className="h-2"
            />
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {Math.round(progressoSemanal)}% da meta semanal concluída
              </span>
              <span className={`font-semibold ${progressoSemanal >= 100 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {Math.round(progressoSemanal)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
};

export default SDRMetasDiarias;