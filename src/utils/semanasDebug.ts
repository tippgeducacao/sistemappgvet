/**
 * Utilitário para debuggar o cálculo de semanas de agosto 2025
 */

export const debugSemanasAgosto2025 = () => {
  console.log('🚨 === DEBUG SEMANAS AGOSTO 2025 ===');
  
  const ano = 2025;
  const mes = 8; // agosto
  
  // 1. Primeiro dia do mês
  const primeiroDiaMes = new Date(ano, mes - 1, 1); // 1º de agosto de 2025
  console.log(`1º de agosto 2025: ${primeiroDiaMes.toLocaleDateString('pt-BR')} (dia da semana: ${primeiroDiaMes.getDay()})`);
  
  // 2. Encontrar a primeira terça-feira do mês
  let primeiraTerca = new Date(ano, mes - 1, 1);
  while (primeiraTerca.getDay() !== 2) {
    primeiraTerca.setDate(primeiraTerca.getDate() + 1);
  }
  console.log(`Primeira terça de agosto 2025: ${primeiraTerca.toLocaleDateString('pt-BR')} (dia ${primeiraTerca.getDate()})`);
  
  // 3. Verificar se a primeira terça é muito tarde
  let tercaBase = new Date(primeiraTerca);
  if (primeiraTerca.getDate() > 7) {
    const tercaAnterior = new Date(primeiraTerca);
    tercaAnterior.setDate(tercaAnterior.getDate() - 7);
    console.log(`Primeira terça está tarde (dia ${primeiraTerca.getDate()}), usando terça anterior: ${tercaAnterior.toLocaleDateString('pt-BR')}`);
    tercaBase = tercaAnterior;
  }
  
  // 4. Calcular todas as terças do mês
  console.log('\n📅 TERÇAS DE AGOSTO 2025:');
  let currentTuesday = new Date(tercaBase);
  let weekNumber = 1;
  
  while (currentTuesday.getMonth() === mes - 1 && currentTuesday.getFullYear() === ano) {
    const quartaInicio = new Date(currentTuesday);
    quartaInicio.setDate(currentTuesday.getDate() - 6);
    
    console.log(`Semana ${weekNumber}: ${quartaInicio.toLocaleDateString('pt-BR')} a ${currentTuesday.toLocaleDateString('pt-BR')}`);
    
    weekNumber++;
    currentTuesday.setDate(currentTuesday.getDate() + 7);
  }
  
  // 5. Testar especificamente onde cai o dia 20/08/2025
  const dia20agosto = new Date(2025, 7, 20); // 20 de agosto de 2025
  console.log(`\n🎯 ANÁLISE DO DIA 20/08/2025:`);
  console.log(`Data: ${dia20agosto.toLocaleDateString('pt-BR')} (dia da semana: ${dia20agosto.getDay()})`);
  
  // Verificar em qual semana cai
  let tercaTestando = new Date(tercaBase);
  let semanaTestando = 1;
  
  while (tercaTestando.getMonth() === mes - 1 && tercaTestando.getFullYear() === ano) {
    const quartaInicio = new Date(tercaTestando);
    quartaInicio.setDate(tercaTestando.getDate() - 6);
    
    if (dia20agosto >= quartaInicio && dia20agosto <= tercaTestando) {
      console.log(`✅ O dia 20/08/2025 pertence à SEMANA ${semanaTestando}`);
      console.log(`   Período da semana: ${quartaInicio.toLocaleDateString('pt-BR')} a ${tercaTestando.toLocaleDateString('pt-BR')}`);
      break;
    }
    
    semanaTestando++;
    tercaTestando.setDate(tercaTestando.getDate() + 7);
  }
  
  console.log('🚨 === FIM DEBUG ===\n');
};