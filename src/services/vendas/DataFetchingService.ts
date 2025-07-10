
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

    // Buscar dados relacionados em paralelo
    const [alunosResult, cursosResult, profilesResult, rulesResult] = await Promise.allSettled([
      supabase.from('alunos').select('*'),
      supabase.from('cursos').select('*'),
      supabase.from('profiles').select('*'),
      this.fetchScoringRules()
    ]);

    const alunos = alunosResult.status === 'fulfilled' ? (alunosResult.value.data || []) : [];
    const cursos = cursosResult.status === 'fulfilled' ? (cursosResult.value.data || []) : [];
    const profiles = profilesResult.status === 'fulfilled' ? (profilesResult.value.data || []) : [];
    const rules = rulesResult.status === 'fulfilled' ? rulesResult.value : [];

    console.log(`👥 DADOS RELACIONADOS: ALUNOS: ${alunos.length}, CURSOS: ${cursos.length}, PROFILES: ${profiles.length}, REGRAS: ${rules.length}`);

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
