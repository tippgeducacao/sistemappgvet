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
  // Debug específico para 20/08/2025
  if (vendaDate.toISOString().includes('2025-08-20')) {
    console.log(`🚨 semanaUtils.getVendaPeriod - Calculando período para 20/08/2025:`, {
      vendaDate: vendaDate.toISOString(),
      vendaDate_br: vendaDate.toLocaleDateString('pt-BR'),
      day_of_week: vendaDate.getDay()
    });
  }

  // Encontrar a terça-feira que encerra a semana da venda
  let tercaQueEncerra = new Date(vendaDate);
  
  if (tercaQueEncerra.getDay() === 2) {
    // A venda foi feita numa terça-feira - a semana termina no mesmo dia
    if (vendaDate.toISOString().includes('2025-08-20')) {
      console.log(`📅 Venda foi numa terça-feira, semana termina no mesmo dia`);
    }
  } else {
    // Encontrar a próxima terça-feira (que encerra a semana da venda)
    const diasAteTerca = (2 - tercaQueEncerra.getDay() + 7) % 7;
    const diasParaSomar = diasAteTerca === 0 ? 7 : diasAteTerca;
    
    if (vendaDate.toISOString().includes('2025-08-20')) {
      console.log(`📅 Calculando próxima terça: dias até terça = ${diasAteTerca}, dias para somar = ${diasParaSomar}`);
    }
    
    tercaQueEncerra.setDate(tercaQueEncerra.getDate() + diasParaSomar);
    
    if (vendaDate.toISOString().includes('2025-08-20')) {
      console.log(`📅 Próxima terça que encerra: ${tercaQueEncerra.toLocaleDateString('pt-BR')}`);
    }
  }
  
  const resultado = {
    mes: tercaQueEncerra.getMonth() + 1,
    ano: tercaQueEncerra.getFullYear()
  };
  
  if (vendaDate.toISOString().includes('2025-08-20')) {
    console.log(`✅ Período final calculado: mês ${resultado.mes}, ano ${resultado.ano}`);
  }
  
  // O mês/ano da venda é determinado pela terça-feira (fim da semana)
  return resultado;
};

/**
 * Obtém o mês e ano da semana atual (baseado na terça-feira que encerra a semana)
 */
export const getMesAnoSemanaAtual = (): { mes: number; ano: number } => {
  const now = new Date();
  return getVendaPeriod(now);
};