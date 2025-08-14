
import { supabase } from '@/integrations/supabase/client';
import type { FormData } from '@/store/FormStore';

export class FormEntryCreationService {
  static async createFormEntry(
    vendedorId: string, 
    formData: FormData, 
    pontuacaoEsperada: number, 
    documentPath: string | null
  ) {
    console.log('💾 Criando form_entry...');
    
    const { data: formEntry, error: formEntryError } = await supabase
      .from('form_entries')
      .insert({
        vendedor_id: vendedorId,
        curso_id: formData.cursoId || null,
        observacoes: formData.observacoes || null,
        status: 'pendente',
        pontuacao_esperada: pontuacaoEsperada,
        documento_comprobatorio: documentPath,
        data_assinatura_contrato: formData.dataAssinaturaContrato || null
      })
      .select()
      .single();

    if (formEntryError) {
      console.error('❌ Erro ao criar form_entry:', formEntryError);
      throw formEntryError;
    }

    console.log('✅ Form entry criado:', {
      id: formEntry.id,
      vendedor_id: formEntry.vendedor_id,
      curso_id: formEntry.curso_id,
      pontuacao_esperada: formEntry.pontuacao_esperada
    });

    return formEntry;
  }

  static async reorganizeDocumentPath(documentPath: string, formEntryId: string): Promise<string> {
    if (!documentPath || !formEntryId) return documentPath;

    try {
      const newFileName = documentPath.replace('/temp-', `/${formEntryId}/`);
      
      // Mover arquivo para local definitivo
      const { data: moveData, error: moveError } = await supabase.storage
        .from('documentos-vendas')
        .move(documentPath, newFileName);
        
      if (moveError) {
        console.warn('⚠️ Aviso: Não foi possível reorganizar arquivo, mas upload foi bem-sucedido:', moveError);
        return documentPath;
      }

      // Atualizar caminho na database
      await supabase
        .from('form_entries')
        .update({ documento_comprobatorio: newFileName })
        .eq('id', formEntryId);
        
      console.log('✅ Arquivo reorganizado para:', newFileName);
      return newFileName;
    } catch (moveError) {
      console.warn('⚠️ Erro ao reorganizar arquivo, mantendo original:', moveError);
      return documentPath;
    }
  }
}
