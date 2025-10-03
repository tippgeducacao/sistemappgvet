/**
 * Utilitários para trabalhar com a regra de semana (quarta a terça)
 */

/**
 * Verifica se uma data está dentro do período de um mês/ano considerando
 * a regra de semana (quarta a terça)
 */
export const isVendaInPeriod = (vendaDate: Date, targetMonth: number, targetYear: number): boolean => {
  // Encontrar a primeira terça-feira do mês alvo
  let primeiraTerca = new Date(targetYear, targetMonth - 1, 1);
  while (primeiraTerca.getDay() !== 2) {
    primeiraTerca.setDate(primeiraTerca.getDate() + 1);
  }
  
  // Se a primeira terça-feira é muito tarde no mês, usar a anterior
  if (primeiraTerca.getDate() > 7) {
    primeiraTerca.setDate(primeiraTerca.getDate() - 7);
  }
  
  // Início do período: primeira quarta após a primeira terça do mês anterior
  const inicioPeriodo = new Date(primeiraTerca);
  inicioPeriodo.setDate(inicioPeriodo.getDate() - 6); // Voltar 6 dias para chegar na quarta
  
  // Fim do período: última terça do mês alvo
  let ultimaTerca = new Date(targetYear, targetMonth, 0); // Último dia do mês
  while (ultimaTerca.getDay() !== 2) {
    ultimaTerca.setDate(ultimaTerca.getDate() - 1);
  }
  
  // Se a última terça é muito cedo, usar a próxima
  if (ultimaTerca.getDate() <= 25) {
    ultimaTerca.setDate(ultimaTerca.getDate() + 7);
  }
  
  // Verificar se a venda está dentro do período
  return vendaDate >= inicioPeriodo && vendaDate <= ultimaTerca;
};

/**
 * Obtém o mês e ano que uma venda deve ser categorizada
 * baseado na regra de semana (quarta a terça)
 */
export const getVendaPeriod = (vendaDate: Date): { mes: number; ano: number } => {
  // Encontrar a terça-feira que encerra a semana da venda
  let tercaQueEncerra = new Date(vendaDate);
  
  if (tercaQueEncerra.getDay() === 2) {
    // A venda foi feita numa terça-feira - a semana termina no mesmo dia
  } else {
    // Encontrar a próxima terça-feira (que encerra a semana da venda)
    const diasAteTerca = (2 - tercaQueEncerra.getDay() + 7) % 7;
    const diasParaSomar = diasAteTerca === 0 ? 7 : diasAteTerca;
    tercaQueEncerra.setDate(tercaQueEncerra.getDate() + diasParaSomar);
  }
  
  // O mês/ano da venda é determinado pela terça-feira (fim da semana)
  return {
    mes: tercaQueEncerra.getMonth() + 1,
    ano: tercaQueEncerra.getFullYear()
  }
};

/**
 * Obtém o mês e ano da semana atual (baseado na terça-feira que encerra a semana)
 */
export const getMesAnoSemanaAtual = (): { mes: number; ano: number } => {
  const now = new Date();
  return getVendaPeriod(now);
};

/**
 * Obtém o range (início e fim) da semana atual seguindo a regra quarta-terça
 */
export const getWeekRange = (referenceDate: Date = new Date()): { start: Date; end: Date } => {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  
  // Encontrar a quarta-feira que inicia a semana
  let startOfWeek = new Date(date);
  const dayOfWeek = date.getDay();
  
  if (dayOfWeek === 3) {
    // É quarta-feira, a semana começa hoje
  } else if (dayOfWeek < 3) {
    // Domingo (0), Segunda (1), Terça (2) - voltar para quarta anterior
    startOfWeek.setDate(date.getDate() - (dayOfWeek + 4));
  } else {
    // Quinta (4), Sexta (5), Sábado (6) - voltar para quarta da semana atual
    startOfWeek.setDate(date.getDate() - (dayOfWeek - 3));
  }
  
  // Fim da semana é sempre terça-feira (6 dias após quarta)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return { start: startOfWeek, end: endOfWeek };
};

/**
 * Get current week number (1-based, starts from first Tuesday of year)
 */
export const getSemanaAtual = (): number => {
  const now = new Date();
  return getSemanaFromDate(now);
};

/**
 * Get week number from any date (1-based, starts from first Tuesday of year)
 */
export const getSemanaFromDate = (date: Date): number => {
  // First, find the closing Tuesday for this date (following week definition)
  let closingTuesday = new Date(date);
  
  if (closingTuesday.getDay() === 2) {
    // The date is already a Tuesday - this is the closing Tuesday
  } else {
    // Find the next Tuesday (which closes the week containing this date)
    const daysUntilTuesday = (2 - closingTuesday.getDay() + 7) % 7;
    const daysToAdd = daysUntilTuesday === 0 ? 7 : daysUntilTuesday;
    closingTuesday.setDate(closingTuesday.getDate() + daysToAdd);
  }
  
  // Now calculate week number based on the closing Tuesday
  const year = closingTuesday.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  
  // Find first Tuesday of the year
  let firstTuesday = new Date(startOfYear);
  while (firstTuesday.getDay() !== 2) { // 2 = Tuesday
    firstTuesday.setDate(firstTuesday.getDate() + 1);
  }
  
  // If first Tuesday is after January 7th, the first week actually starts on the previous Tuesday
  if (firstTuesday.getDate() > 7) {
    firstTuesday.setDate(firstTuesday.getDate() - 7);
  }
  
  const diffTime = closingTuesday.getTime() - firstTuesday.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.floor(diffDays / 7) + 1;
};

/**
 * Get all weeks in a year (returns array of week numbers)
 */
export const getSemanasDoAno = (ano: number): number[] => {
  const startOfYear = new Date(ano, 0, 1);
  
  // Find the last Tuesday of the year (not December 31st)
  const endOfYear = new Date(ano, 11, 31);
  let lastTuesday = new Date(endOfYear);
  
  // Go backwards until we find a Tuesday
  while (lastTuesday.getDay() !== 2) {
    lastTuesday.setDate(lastTuesday.getDate() - 1);
  }
  
  const startWeek = getSemanaFromDate(startOfYear);
  const endWeek = getSemanaFromDate(lastTuesday);
  
  const weeks = [];
  for (let week = startWeek; week <= endWeek; week++) {
    weeks.push(week);
  }
  
  return weeks;
};

/**
 * Get week start and end dates for a specific year and week number
 */
export const getWeekDatesFromNumber = (ano: number, semana: number): { start: Date; end: Date } => {
  const year = ano;
  const startOfYear = new Date(year, 0, 1);
  
  // Find first Tuesday of the year
  let firstTuesday = new Date(startOfYear);
  while (firstTuesday.getDay() !== 2) {
    firstTuesday.setDate(firstTuesday.getDate() + 1);
  }
  
  if (firstTuesday.getDate() > 7) {
    firstTuesday.setDate(firstTuesday.getDate() - 7);
  }
  
  // Calculate the start date of the target week (Wednesday before the Tuesday)
  const targetTuesday = new Date(firstTuesday);
  targetTuesday.setDate(firstTuesday.getDate() + ((semana - 1) * 7));
  
  const start = new Date(targetTuesday);
  start.setDate(targetTuesday.getDate() - 6); // Go back 6 days to Wednesday
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(targetTuesday);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};