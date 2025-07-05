
import type { VendaCompleta } from '@/hooks/useVendas';

export class ProcessingStatsService {
  /**
   * Exibe estatísticas do processamento
   */
  static logProcessingStats(vendas: VendaCompleta[]): void {
    console.log('✅✅✅ VENDAS PROCESSADAS COM SUCESSO!');
    console.log('📊 TOTAL DE VENDAS RETORNADAS:', vendas.length);
    console.log('📊 DISTRIBUIÇÃO POR STATUS:', {
      pendentes: vendas.filter(v => v.status === 'pendente').length,
      matriculadas: vendas.filter(v => v.status === 'matriculado').length,
      desistentes: vendas.filter(v => v.status === 'desistiu').length
    });

    const totalPontos = vendas.reduce((sum, v) => sum + (v.pontuacao_esperada || 0), 0);
    console.log('📊 TOTAL DE PONTOS:', totalPontos);

    const vendasSemNome = vendas.filter(v => !v.aluno?.nome);
    if (vendasSemNome.length > 0) {
      console.log('⚠️ VENDAS SEM NOME DE ALUNO APÓS PROCESSAMENTO:', vendasSemNome.map(v => ({
        id: v.id,
        aluno_id: v.aluno?.id || 'null',
        vendedor_id: v.vendedor_id
      })));
    }
  }
}
