
import { AlunoLinkingService } from './AlunoLinkingService';
import { ScoringService } from './ScoringService';
import type { VendaCompleta } from '@/hooks/useVendas';

export class VendaAssemblyService {
  /**
   * Processa vendas individuais e monta objetos VendaCompleta
   */
  static async assembleVendas(
    formEntries: any[],
    alunos: any[],
    cursos: any[],
    profiles: any[],
    rules: any[],
    respostas: any[]
  ): Promise<VendaCompleta[]> {
    return Promise.all(
      formEntries.map(async (entry, index) => {
        console.log(`📋 Processando venda ${index + 1}/${formEntries.length}: ${entry.id}`);
        
        const aluno = await AlunoLinkingService.findOrCreateAluno(entry, alunos, respostas);
        
        // Debug curso mapping detalhado
        const curso = entry.curso_id ? cursos.find(c => c.id === entry.curso_id) : null;
        
        console.log(`🔍 Buscando curso para entry ${entry.id}:`, {
          curso_id: entry.curso_id,
          curso_encontrado: curso ? curso.nome : 'NÃO ENCONTRADO',
          total_cursos: cursos.length
        });
        
        if (entry.curso_id && !curso) {
          console.error(`❌ CURSO NÃO ENCONTRADO! ID: ${entry.curso_id}`);
          console.log('📋 Primeiros 5 cursos disponíveis:', cursos.slice(0, 5).map(c => `${c.id}: ${c.nome}`));
        } else if (curso) {
          console.log(`✅ Curso encontrado: ${curso.nome}`);
        }
        
        const vendedor = profiles.find(p => p.id === entry.vendedor_id) || null;

        // Buscar respostas específicas para esta venda
        const vendaRespostas = respostas?.filter(r => r.form_entry_id === entry.id) || [];

        // Recalcular pontuação se necessário
        const pontuacaoEsperada = await ScoringService.calculateOrUpdateScore(entry, vendaRespostas, rules);

        const venda: VendaCompleta = {
          id: entry.id,
          vendedor_id: entry.vendedor_id,
          curso_id: entry.curso_id,
          observacoes: entry.observacoes,
          status: entry.status as 'pendente' | 'matriculado' | 'desistiu',
          pontuacao_esperada: pontuacaoEsperada,
          pontuacao_validada: entry.pontuacao_validada,
          enviado_em: entry.enviado_em,
          atualizado_em: entry.atualizado_em,
          motivo_pendencia: entry.motivo_pendencia,
          documento_comprobatorio: entry.documento_comprobatorio,
          aluno,
          curso,
          vendedor
        };

        console.log(`✅ Venda processada: ${venda.id} - Aluno: ${venda.aluno?.nome || 'SEM NOME'} - Status: ${venda.status} - Pontos: ${venda.pontuacao_esperada}`);
        return venda;
      })
    );
  }
}
