
import { supabase } from '@/integrations/supabase/client';

export class VendasQueryService {
  /**
   * Busca form_entries de um vendedor específico
   */
  static async getFormEntriesByVendedor(vendedorId: string): Promise<any[]> {
    console.log('🔍 Buscando form_entries para vendedor:', vendedorId);

    const { data: formEntries, error: formError } = await supabase
      .from('form_entries')
      .select('*')
      .eq('vendedor_id', vendedorId)
      .order('enviado_em', { ascending: false });

    if (formError) {
      console.error('❌ Erro ao buscar form_entries:', formError);
      throw formError;
    }

    if (!formEntries || formEntries.length === 0) {
      console.log('⚠️ Nenhuma form_entry encontrada para este vendedor');
      return [];
    }

    return formEntries;
  }

  /**
   * Busca TODAS as form_entries do sistema
   */
  static async getAllFormEntries(): Promise<any[]> {
    console.log('🔍🔍🔍 SECRETÁRIA: INICIANDO BUSCA COMPLETA DE FORM_ENTRIES');

    const { data: allFormEntries, error: formError } = await supabase
      .from('form_entries')
      .select('*')
      .order('enviado_em', { ascending: false });

    if (formError) {
      console.error('❌ Erro ao buscar form_entries:', formError);
      throw formError;
    }

    console.log(`📊 TOTAL DE FORM_ENTRIES ENCONTRADAS: ${allFormEntries?.length || 0}`);

    if (!allFormEntries || allFormEntries.length === 0) {
      console.log('⚠️ NENHUMA FORM_ENTRY ENCONTRADA NO SISTEMA!');
      return [];
    }

    return allFormEntries;
  }
}
