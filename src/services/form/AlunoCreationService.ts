
import { supabase } from '@/integrations/supabase/client';
import type { FormData } from '@/store/FormStore';

export class AlunoCreationService {
  static async createAluno(formData: FormData, formEntryId: string, vendedorId: string): Promise<string | null> {
    // Verificar se dados obrigatórios estão presentes
    if (!formData.nomeAluno || !formData.emailAluno) {
      console.warn('⚠️ Dados do aluno incompletos - venda será salva sem aluno');
      return null;
    }

    console.log('💾 Salvando dados do aluno:', {
      nome: formData.nomeAluno,
      email: formData.emailAluno,
      telefone: formData.telefone,
      crmv: formData.crmv
    });

    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .insert({
        nome: formData.nomeAluno,
        email: formData.emailAluno,
        telefone: formData.telefone || null,
        crmv: formData.crmv || null,
        form_entry_id: formEntryId,
        vendedor_id: vendedorId
      })
      .select()
      .single();

    if (alunoError) {
      console.error('❌ Erro ao criar aluno:', alunoError);
      throw alunoError;
    }

    console.log('✅ Aluno criado com sucesso:', aluno);
    return aluno.id;
  }

  static async linkAlunoToFormEntry(alunoId: string, formEntryId: string): Promise<void> {
    console.log('🔗 Vinculando aluno à form_entry...');
    
    const { error: updateError } = await supabase
      .from('form_entries')
      .update({ aluno_id: alunoId })
      .eq('id', formEntryId);

    if (updateError) {
      console.error('❌ Erro ao vincular aluno à venda:', updateError);
      throw updateError;
    }

    console.log('✅ Aluno vinculado à venda com sucesso');
  }
}
