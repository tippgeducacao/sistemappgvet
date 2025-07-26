export interface HorarioTrabalho {
  dias_trabalho: 'segunda_sabado' | 'personalizado';
  dias_personalizados?: string[]; // ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
  segunda_sexta: {
    periodo1_inicio: string;
    periodo1_fim: string;
    periodo2_inicio?: string; // Opcional
    periodo2_fim?: string; // Opcional
  };
  sabado: {
    periodo1_inicio: string;
    periodo1_fim: string;
    periodo2_inicio?: string; // Opcional
    periodo2_fim?: string; // Opcional
  };
}

export const verificarDisponibilidadeVendedor = (
  horarioTrabalho: HorarioTrabalho | null, 
  dataHora: Date
): boolean => {
  if (!horarioTrabalho) return true;

  const diaSemana = dataHora.getDay(); // 0=domingo, 1=segunda, ..., 6=sábado
  
  // Verificar se é formato antigo
  const horarioAny = horarioTrabalho as any;
  if (horarioAny.manha_inicio) {
    // Formato antigo - assume segunda a sexta
    if (diaSemana < 1 || diaSemana > 5) return false;
    
    const hora = dataHora.getHours();
    const minuto = dataHora.getMinutes();
    const horaCompleta = hora + minuto / 60;
    
    const manhaInicio = converterHorarioParaDecimal(horarioAny.manha_inicio);
    const manhaFim = converterHorarioParaDecimal(horarioAny.manha_fim);
    const tardeInicio = converterHorarioParaDecimal(horarioAny.tarde_inicio);
    const tardeFim = converterHorarioParaDecimal(horarioAny.tarde_fim);
    
    return (horaCompleta >= manhaInicio && horaCompleta <= manhaFim) ||
           (horaCompleta >= tardeInicio && horaCompleta <= tardeFim);
  }
  
  // Formato novo
  const diasMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const diaAtual = diasMap[diaSemana];

  // Verificar se trabalha neste dia
  let trabalhaNesteDia = false;
  if (horarioTrabalho.dias_trabalho === 'segunda_sabado') {
    trabalhaNesteDia = diaSemana >= 1 && diaSemana <= 6; // Segunda a sábado
  } else if (horarioTrabalho.dias_trabalho === 'personalizado') {
    trabalhaNesteDia = horarioTrabalho.dias_personalizados?.includes(diaAtual) || false;
  }

  if (!trabalhaNesteDia) return false;

  const hora = dataHora.getHours();
  const minuto = dataHora.getMinutes();
  const horaCompleta = hora + minuto / 60;

  // Definir horários baseado no dia
  let horarios;
  if (diaSemana === 6) { // Sábado
    horarios = horarioTrabalho.sabado;
  } else { // Segunda a sexta
    horarios = horarioTrabalho.segunda_sexta;
  }

  // Converter horários para decimal
  const periodo1Inicio = converterHorarioParaDecimal(horarios.periodo1_inicio);
  const periodo1Fim = converterHorarioParaDecimal(horarios.periodo1_fim);
  
  // Verificar se está no primeiro período
  const noPeriodo1 = horaCompleta >= periodo1Inicio && horaCompleta <= periodo1Fim;
  
  // Verificar segundo período apenas se definido
  let noPeriodo2 = false;
  if (horarios.periodo2_inicio && horarios.periodo2_fim) {
    const periodo2Inicio = converterHorarioParaDecimal(horarios.periodo2_inicio);
    const periodo2Fim = converterHorarioParaDecimal(horarios.periodo2_fim);
    noPeriodo2 = horaCompleta >= periodo2Inicio && horaCompleta <= periodo2Fim;
  }

  return noPeriodo1 || noPeriodo2;
};

const converterHorarioParaDecimal = (horario: string): number => {
  if (!horario) return 0;
  const [hora, minuto] = horario.split(':').map(Number);
  return hora + minuto / 60;
};

export const formatarHorarioTrabalho = (horarioTrabalho: HorarioTrabalho | null): string => {
  if (!horarioTrabalho) return 'Horário não definido';
  
  // Verificar se é formato antigo (tem manha_inicio)
  const horarioAny = horarioTrabalho as any;
  if (horarioAny.manha_inicio) {
    // Formato antigo
    return `Manhã: ${horarioAny.manha_inicio} - ${horarioAny.manha_fim} | Tarde: ${horarioAny.tarde_inicio} - ${horarioAny.tarde_fim}`;
  }
  
  // Formato novo - verificar se tem a estrutura completa
  if (!horarioTrabalho.dias_trabalho || !horarioTrabalho.segunda_sexta || !horarioTrabalho.sabado) {
    return 'Horário não definido corretamente';
  }
  
  let diasTexto = '';
  if (horarioTrabalho.dias_trabalho === 'segunda_sabado') {
    diasTexto = 'Seg-Sáb';
  } else if (horarioTrabalho.dias_trabalho === 'personalizado' && horarioTrabalho.dias_personalizados) {
    const diasAbrev = {
      'segunda': 'Seg', 'terca': 'Ter', 'quarta': 'Qua', 
      'quinta': 'Qui', 'sexta': 'Sex', 'sabado': 'Sáb'
    };
    diasTexto = horarioTrabalho.dias_personalizados.map(dia => diasAbrev[dia as keyof typeof diasAbrev]).join(', ');
  }

  const segSex = horarioTrabalho.segunda_sexta.periodo2_inicio && horarioTrabalho.segunda_sexta.periodo2_fim
    ? `${horarioTrabalho.segunda_sexta.periodo1_inicio}-${horarioTrabalho.segunda_sexta.periodo1_fim}, ${horarioTrabalho.segunda_sexta.periodo2_inicio}-${horarioTrabalho.segunda_sexta.periodo2_fim}`
    : `${horarioTrabalho.segunda_sexta.periodo1_inicio}-${horarioTrabalho.segunda_sexta.periodo1_fim}`;
    
  const sabado = horarioTrabalho.sabado.periodo2_inicio && horarioTrabalho.sabado.periodo2_fim
    ? `${horarioTrabalho.sabado.periodo1_inicio}-${horarioTrabalho.sabado.periodo1_fim}, ${horarioTrabalho.sabado.periodo2_inicio}-${horarioTrabalho.sabado.periodo2_fim}`
    : `${horarioTrabalho.sabado.periodo1_inicio}-${horarioTrabalho.sabado.periodo1_fim}`;
  
  return `${diasTexto} | Seg-Sex: ${segSex} | Sáb: ${sabado}`;
};