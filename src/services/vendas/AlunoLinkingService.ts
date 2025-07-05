
import { supabase } from '@/integrations/supabase/client';

export class AlunoLinkingService {
  /**
   * Busca ou cria um aluno baseado nos dados da form_entry
   */
  static async findOrCreateAluno(entry: any, alunos: any[], respostas: any[]): Promise<any> {
    console.log(`🔍 Processando aluno para form_entry: ${entry.id}`);
    
    // Primeira tentativa: buscar por aluno_id
    let aluno = null;
    if (entry.aluno_id) {
      aluno = alunos.find(a => a.id === entry.aluno_id);
      if (aluno) {
        console.log(`  🧑‍🎓 Aluno encontrado por aluno_id: ${aluno.nome} (${aluno.email})`);
        return aluno;
      }
    }
    
    // Segunda tentativa: buscar por form_entry_id
    aluno = alunos.find(a => a.form_entry_id === entry.id);
    if (aluno) {
      console.log(`  🧑‍🎓 Aluno encontrado por form_entry_id: ${aluno.nome} (${aluno.email})`);
      
      // Atualizar o aluno_id na form_entry se não estiver definido
      if (!entry.aluno_id) {
        console.log(`  🔗 Atualizando aluno_id na form_entry ${entry.id}`);
        await supabase
          .from('form_entries')
          .update({ aluno_id: aluno.id })
          .eq('id', entry.id);
      }
      return aluno;
    }

    // Terceira tentativa: buscar pelos dados das respostas
    const vendaRespostas = respostas?.filter(r => r.form_entry_id === entry.id) || [];
    const nomeResposta = vendaRespostas.find(r => r.campo_nome === 'Nome do Aluno');
    const emailResposta = vendaRespostas.find(r => r.campo_nome === 'Email do Aluno');
    
    if (nomeResposta && emailResposta) {
      // Buscar aluno por email nas respostas
      aluno = alunos.find(a => a.email === emailResposta.valor_informado);
      
      if (!aluno) {
        // Criar novo aluno
        aluno = await this.createNewAluno(entry, nomeResposta.valor_informado, emailResposta.valor_informado);
      } else {
        console.log(`  🔍 Aluno encontrado por email das respostas: ${aluno.nome}`);
        
        // Vincular aluno existente à form_entry
        await supabase
          .from('form_entries')
          .update({ aluno_id: aluno.id })
          .eq('id', entry.id);
      }
      
      return aluno;
    }
    
    console.warn(`  ⚠️ Não foi possível encontrar dados do aluno para form_entry: ${entry.id}`);
    return null;
  }

  /**
   * Cria um novo aluno baseado nos dados da resposta
   */
  private static async createNewAluno(entry: any, nome: string, email: string): Promise<any> {
    console.log(`  ➕ Criando novo aluno: ${nome} (${email})`);
    
    const { data: novoAluno, error: alunoError } = await supabase
      .from('alunos')
      .insert({
        nome,
        email,
        form_entry_id: entry.id,
        vendedor_id: entry.vendedor_id
      })
      .select()
      .single();

    if (!alunoError && novoAluno) {
      // Atualizar aluno_id na form_entry
      await supabase
        .from('form_entries')
        .update({ aluno_id: novoAluno.id })
        .eq('id', entry.id);
        
      console.log(`  ✅ Novo aluno criado e vinculado: ${novoAluno.nome}`);
      return novoAluno;
    } else {
      console.error(`  ❌ Erro ao criar aluno:`, alunoError);
      return null;
    }
  }
}
