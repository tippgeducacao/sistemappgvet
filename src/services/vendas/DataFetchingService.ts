
import { supabase } from '@/integrations/supabase/client';
import { CacheService } from '@/services/cache/CacheService';

export interface RelatedData {
  alunos: any[];
  cursos: any[];
  profiles: any[];
  rules: any[];
  respostas: any[];
}

export class DataFetchingService {
  /**
   * Busca todos os dados relacionados necessários para processar vendas
   */
  static async fetchRelatedData(formEntries: any[]): Promise<RelatedData> {
    console.log(`👥 Buscando dados relacionados para ${formEntries.length} form_entries`);

    // Extrair IDs únicos dos alunos das form_entries
    const alunoIds = [...new Set(formEntries.map(fe => fe.aluno_id).filter(Boolean))];
    console.log(`🎯 Buscando ${alunoIds.length} alunos específicos`);

    // Buscar dados relacionados em paralelo
    const [alunosResult, cursosResult, profilesResult, rulesResult] = await Promise.allSettled([
      // Buscar apenas os alunos relacionados às vendas, respeitando RLS
      alunoIds.length > 0 
        ? supabase.from('alunos').select('*').in('id', alunoIds)
        : Promise.resolve({ data: [] }),
      supabase.from('cursos').select('*').eq('ativo', true), // Buscar cursos ativos para resolver vendas existentes
      supabase.from('profiles').select('*').eq('ativo', true), // CORREÇÃO: Filtrar apenas usuários ativos
      this.fetchScoringRules()
    ]);

    const alunos = alunosResult.status === 'fulfilled' ? (alunosResult.value.data || []) : [];
    const cursos = cursosResult.status === 'fulfilled' ? (cursosResult.value.data || []) : [];
    const profiles = profilesResult.status === 'fulfilled' ? (profilesResult.value.data || []) : [];
    const rules = rulesResult.status === 'fulfilled' ? rulesResult.value : [];

    console.log(`👥 DADOS RELACIONADOS: ALUNOS: ${alunos.length}, CURSOS: ${cursos.length}, PROFILES: ${profiles.length}, REGRAS: ${rules.length}`);

    // Log de debug para alunos encontrados vs esperados
    if (alunoIds.length > 0 && alunos.length === 0) {
      console.warn('⚠️ RLS BLOQUEOU: Nenhum aluno encontrado mesmo com IDs válidos:', alunoIds);
    } else if (alunos.length < alunoIds.length) {
      console.warn(`⚠️ RLS FILTROU: Esperados ${alunoIds.length} alunos, encontrados ${alunos.length}`);
    }

    // Buscar todas as respostas dos formulários
    const respostas = await this.fetchAllRespostas(formEntries);

    return {
      alunos,
      cursos,
      profiles,
      rules,
      respostas
    };
  }

  /**
   * Busca regras de pontuação
   */
  private static async fetchScoringRules(): Promise<any[]> {
    const { data } = await supabase.from('regras_pontuacao').select('*');
    return data || [];
  }

  /**
   * Busca todas as respostas dos formulários
   */
  private static async fetchAllRespostas(formEntries: any[]): Promise<any[]> {
    const formEntryIds = formEntries.map(fe => fe.id);
    const { data: respostas } = await supabase
      .from('respostas_formulario')
      .select('*')
      .in('form_entry_id', formEntryIds);

    console.log(`📝 RESPOSTAS ENCONTRADAS: ${respostas?.length || 0}`);
    return respostas || [];
  }
}
