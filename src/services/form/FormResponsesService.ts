
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

    // CORREÇÃO: Deletar respostas antigas e inserir novas para evitar conflitos
    const { error: deleteError } = await supabase
      .from('respostas_formulario')
      .delete()
      .eq('form_entry_id', formEntryId);

    if (deleteError) {
      console.error('❌ Erro ao deletar respostas antigas:', deleteError);
      throw deleteError;
    }

    const { error } = await supabase
      .from('respostas_formulario')
      .insert(responses);

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
