export interface HorarioTrabalho {
  manha_inicio: string;
  manha_fim: string;
  tarde_inicio: string;
  tarde_fim: string;
}

export const verificarDisponibilidadeVendedor = (
  horarioTrabalho: HorarioTrabalho | null, 
  dataHora: Date
): boolean => {
  if (!horarioTrabalho) return true; // Se não tem horário definido, assume disponível

  const hora = dataHora.getHours();
  const minuto = dataHora.getMinutes();
  const horaCompleta = hora + minuto / 60;

  // Converter horários de string para decimal
  const manhaInicio = converterHorarioParaDecimal(horarioTrabalho.manha_inicio);
  const manhaFim = converterHorarioParaDecimal(horarioTrabalho.manha_fim);
  const tardeInicio = converterHorarioParaDecimal(horarioTrabalho.tarde_inicio);
  const tardeFim = converterHorarioParaDecimal(horarioTrabalho.tarde_fim);

  // Verificar se está no horário da manhã ou tarde
  const noHorarioManha = horaCompleta >= manhaInicio && horaCompleta <= manhaFim;
  const noHorarioTarde = horaCompleta >= tardeInicio && horaCompleta <= tardeFim;

  return noHorarioManha || noHorarioTarde;
};

const converterHorarioParaDecimal = (horario: string): number => {
  if (!horario) return 0;
  const [hora, minuto] = horario.split(':').map(Number);
  return hora + minuto / 60;
};

export const formatarHorarioTrabalho = (horarioTrabalho: HorarioTrabalho | null): string => {
  if (!horarioTrabalho) return 'Horário não definido';
  
  return `Manhã: ${horarioTrabalho.manha_inicio} - ${horarioTrabalho.manha_fim} | Tarde: ${horarioTrabalho.tarde_inicio} - ${horarioTrabalho.tarde_fim}`;
};