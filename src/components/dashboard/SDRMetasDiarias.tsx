import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useMetasSemanaisSDR } from '@/hooks/useMetasSemanaisSDR';
import { useAgendamentosSDR } from '@/hooks/useAgendamentosSDR';
import { useAuthStore } from '@/stores/AuthStore';
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
  
  const { profile } = useAuthStore();
  const { 
    getMetaSemanalSDR, 
    getSemanaAtual, 
    loading: metasLoading 
  } = useMetasSemanaisSDR();
  const { agendamentos } = useAgendamentosSDR();
  
  console.log('📊 SDRMetasDiarias: Dados do usuário', { 
    profile: { id: profile?.id, user_type: profile?.user_type }, 
    agendamentos: agendamentos?.length || 0,
    metasLoading 
  });

  // Verificar se é mês/ano atual para mostrar metas diárias
  const currentDate = new Date();
  const isCurrentMonth = selectedMonth === currentDate.getMonth() + 1 && 
                        selectedYear === currentDate.getFullYear();

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

  // Obter semana atual e meta semanal
  const semanaAtual = getSemanaAtual();
  const metaSemanal = profile?.id ? getMetaSemanalSDR(profile.id, selectedYear, semanaAtual) : null;
  
  console.log('🎯 SDRMetasDiarias: Meta semanal calculada', { 
    semanaAtual, 
    metaSemanal, 
    userId: profile?.id,
    userType: profile?.user_type,
    selectedYear 
  });

  // Calcular agendamentos da semana atual
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 4) % 7)); // Última quarta-feira
  inicioSemana.setHours(0, 0, 0, 0);

  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(fimSemana.getDate() + 6); // Próxima terça-feira
  fimSemana.setHours(23, 59, 59, 999);

  // Agendamentos da semana (quarta a terça) - apenas com comparecimento confirmado
  const agendamentosSemana = agendamentos.filter(agendamento => {
    const dataAgendamento = new Date(agendamento.data_agendamento);
    const dentroDoPeriodo = dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana;
    
    // Contar apenas agendamentos onde houve comparecimento confirmado
    const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                       agendamento.resultado_reuniao === 'comprou';
    
    return dentroDoPeriodo && compareceu;
  });

  // Agendamentos de hoje - apenas com comparecimento confirmado
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const agendamentosHoje = agendamentos.filter(agendamento => {
    const dataAgendamento = new Date(agendamento.data_agendamento);
    dataAgendamento.setHours(0, 0, 0, 0);
    const dentroDoPeriodo = dataAgendamento.getTime() === hoje.getTime();
    
    // Contar apenas agendamentos onde houve comparecimento confirmado
    const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                       agendamento.resultado_reuniao === 'comprou';
    
    return dentroDoPeriodo && compareceu;
  });

  // Cálculos
  const metaDiaria = metaSemanal?.meta_agendamentos ? Math.ceil(metaSemanal.meta_agendamentos / 7) : 0;
  const agendamentosHojeCount = agendamentosHoje.length;
  const agendamentosSemanaCount = agendamentosSemana.length;

  const progressoDiario = metaDiaria > 0 ? Math.min((agendamentosHojeCount / metaDiaria) * 100, 100) : 0;
  const progressoSemanal = metaSemanal?.meta_agendamentos ? 
    Math.min((agendamentosSemanaCount / metaSemanal.meta_agendamentos) * 100, 100) : 0;

  const metaBatidaHoje = agendamentosHojeCount >= metaDiaria;
  const metaBatidaSemana = metaSemanal ? agendamentosSemanaCount >= metaSemanal.meta_agendamentos : false;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Meta Diária */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Meta Diária
            </div>
            <Badge variant={metaBatidaHoje ? "default" : "secondary"}>
              {metaBatidaHoje ? "Atingida" : "Em Progresso"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Agendamentos Hoje</span>
            <span className="text-lg font-semibold">
              {agendamentosHojeCount} / {metaDiaria}
            </span>
          </div>
          
          <Progress 
            value={progressoDiario} 
            className="h-2"
          />
          
          <div className="text-xs text-muted-foreground">
            {Math.round(progressoDiario)}% da meta diária concluída
          </div>
        </CardContent>
      </Card>

      {/* Meta Semanal */}
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
            <span className="text-sm text-muted-foreground">Agendamentos Esta Semana</span>
            <span className="text-lg font-semibold">
              {agendamentosSemanaCount} / {metaSemanal?.meta_agendamentos || 0}
            </span>
          </div>
          
          <Progress 
            value={progressoSemanal} 
            className="h-2"
          />
          
          <div className="text-xs text-muted-foreground">
            {Math.round(progressoSemanal)}% da meta semanal concluída
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SDRMetasDiarias;