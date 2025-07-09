
import { supabase } from '@/integrations/supabase/client';
import { FormDataMappingService } from './FormDataMappingService';
import type { FormData } from '@/store/FormStore';

export class FormResponsesService {
  static async saveFormResponses(formEntryId: string, formData: FormData): Promise<void> {
    console.log('📝 Preparando respostas do formulário para salvamento...');
    
    const responses = FormDataMappingService.prepareFormResponses(formEntryId, formData);
    
    if (responses.length === 0) {
      console.warn('⚠️ NENHUMA RESPOSTA preparada para salvamento!');
      console.log('📋 FormData recebido:', formData);
      return;
    }

    console.log(`💾 Salvando ${responses.length} respostas:`, responses);

    // CORREÇÃO: Usar upsert para evitar duplicatas
    const { error } = await supabase
      .from('respostas_formulario')
      .upsert(responses, { 
        onConflict: 'form_entry_id,campo_nome',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('❌ Erro ao salvar respostas:', error);
      throw error;
    }

    console.log('✅ Respostas salvas com sucesso usando upsert!');
    
    // Verificação imediata
    const { data: savedRespostas, error: verifyError } = await supabase
      .from('respostas_formulario')
      .select('*')
      .eq('form_entry_id', formEntryId);

    if (verifyError) {
      console.error('❌ Erro ao verificar respostas salvas:', verifyError);
    } else {
      console.log(`✅ Verificação: ${savedRespostas?.length || 0} respostas confirmadas no banco`);
    }
  }
}
