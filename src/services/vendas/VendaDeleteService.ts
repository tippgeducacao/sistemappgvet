import { supabase } from '@/integrations/supabase/client';
import { ErrorService } from '@/services/error/ErrorService';

export class VendaDeleteService {
  // Emails autorizados para excluir vendas (admin e o email específico)
  private static readonly AUTHORIZED_EMAILS = ['wallasmonteiro019@gmail.com', 'admin@ppgvet.com'];

  static async deleteVenda(vendaId: string, currentUserEmail: string): Promise<boolean> {
    try {
      console.log('🗑️ VendaDeleteService: Iniciando exclusão de venda:', vendaId.substring(0, 8));
      console.log('👤 Usuário solicitante:', currentUserEmail);

      // 1. Verificar permissão
      if (!this.hasDeletePermission(currentUserEmail)) {
        console.error('❌ Usuário não autorizado:', currentUserEmail);
        throw new Error('Você não tem permissão para excluir vendas.');
      }

      // 2. Diagnóstico PRÉ-exclusão
      console.log('🔍 Executando diagnóstico PRÉ-exclusão...');
      await this.diagnosticoCompleto(vendaId);

      // 3. Chamar a função RPC corrigida com timeout
      console.log('🔥 Executando RPC delete_venda_cascade com constraints corrigidas...');
      
      const { data: deleteResult, error: rpcError } = await supabase.rpc('delete_venda_cascade', {
        venda_id: vendaId
      });

      // 4. Verificar erro do RPC
      if (rpcError) {
        console.error('❌ ERRO RPC:', rpcError);
        
        // Tentar diagnóstico pós-erro
        console.log('🔍 Diagnóstico pós-erro RPC...');
        await this.diagnosticoCompleto(vendaId);
        
        throw new Error(`Erro na função de exclusão: ${rpcError.message}`);
      }

      // 5. Verificar resultado da função
      console.log('📊 Resultado da função RPC:', deleteResult);
      
      if (deleteResult !== true) {
        console.error('💥 Função RPC retornou falso - exclusão falhou');
        
        // Diagnóstico detalhado do problema
        console.log('🔍 Diagnóstico de falha...');
        await this.diagnosticoCompleto(vendaId);
        
        throw new Error('A exclusão falhou na função do banco de dados. Verifique os logs para mais detalhes.');
      }

      // 6. Verificação final DUPLA para garantir sucesso
      console.log('🔍 Verificação final de segurança...');
      
      const { data: vendaAindaExiste, error: checkError } = await supabase
        .from('form_entries')
        .select('id')
        .eq('id', vendaId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.warn('⚠️ Erro na verificação final (pode ser normal):', checkError);
      }

      if (vendaAindaExiste) {
        console.error('💥 ERRO CRÍTICO: Venda ainda existe após função RPC reportar sucesso!');
        await this.diagnosticoCompleto(vendaId);
        throw new Error('Inconsistência detectada - venda ainda existe após exclusão reportada como bem-sucedida.');
      }

      // 7. SUCESSO CONFIRMADO
      console.log('🎉 EXCLUSÃO CONFIRMADA COM SUCESSO!');
      console.log('📋 Log de Auditoria - SUCESSO:', {
        acao: 'EXCLUSAO_VENDA_SUCESSO',
        vendaId: vendaId,
        usuario: currentUserEmail,
        timestamp: new Date().toISOString(),
        metodo: 'RPC_delete_venda_cascade'
      });

      return true;

    } catch (error) {
      console.error('💥 ERRO CRÍTICO na exclusão:', error);
      
      console.log('📊 Log de Auditoria - ERRO:', {
        acao: 'EXCLUSAO_VENDA_ERRO',
        vendaId: vendaId,
        usuario: currentUserEmail,
        timestamp: new Date().toISOString(),
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });

      ErrorService.logError(error as Error, 'VendaDeleteService.deleteVenda');
      throw error;
    }
  }

  private static async deleteValidationHistory(vendaId: string): Promise<boolean> {
    try {
      console.log('🗑️ Excluindo histórico de validações...');
      
      // Usar delete direto em vez de from com select
      const { error } = await supabase
        .from('historico_validacoes')
        .delete()
        .eq('form_entry_id', vendaId);

      if (error) {
        console.error('❌ Erro ao excluir histórico:', error);
        return false;
      }

      console.log('✅ Histórico de validações excluído');
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir histórico:', error);
      return false;
    }
  }

  // Diagnóstico completo e detalhado para debug
  private static async diagnosticoCompleto(vendaId: string): Promise<void> {
    try {
      console.log('🔬 === DIAGNÓSTICO COMPLETO DETALHADO ===');
      
      // 1. Verificar venda principal
      const { data: venda, error: vendaError } = await supabase
        .from('form_entries')
        .select('*')
        .eq('id', vendaId)
        .maybeSingle();
      
      console.log('📊 Venda principal:', { 
        exists: !!venda, 
        error: vendaError?.message,
        data: venda ? {
          id: venda.id,
          aluno_id: venda.aluno_id,
          status: venda.status,
          vendedor_id: venda.vendedor_id
        } : null
      });

      if (!venda) {
        console.log('✅ Venda não encontrada - pode ter sido excluída com sucesso');
        return;
      }

      // 2. Verificar aluno via form_entry_id
      const { data: alunoViaFormEntry, error: alunoFormError } = await supabase
        .from('alunos')
        .select('*')
        .eq('form_entry_id', vendaId)
        .maybeSingle();
      
      console.log('👤 Aluno via form_entry_id:', { 
        exists: !!alunoViaFormEntry, 
        error: alunoFormError?.message,
        data: alunoViaFormEntry ? {
          id: alunoViaFormEntry.id,
          nome: alunoViaFormEntry.nome,
          email: alunoViaFormEntry.email,
          form_entry_id: alunoViaFormEntry.form_entry_id
        } : null
      });

      // 3. Verificar aluno via aluno_id (se existir referência)
      if (venda.aluno_id) {
        const { data: alunoViaId, error: alunoIdError } = await supabase
          .from('alunos')
          .select('*')
          .eq('id', venda.aluno_id)
          .maybeSingle();
        
        console.log('👤 Aluno via aluno_id:', { 
          exists: !!alunoViaId, 
          error: alunoIdError?.message,
          data: alunoViaId ? {
            id: alunoViaId.id,
            nome: alunoViaId.nome,
            form_entry_id: alunoViaId.form_entry_id
          } : null
        });
      }

      // 4. Verificar respostas do formulário
      const { data: respostas, error: respostasError } = await supabase
        .from('respostas_formulario')
        .select('id, campo_nome, valor_informado')
        .eq('form_entry_id', vendaId);
      
      console.log('📝 Respostas do formulário:', { 
        count: respostas?.length || 0, 
        error: respostasError?.message,
        sample: respostas?.slice(0, 3) || []
      });

      // 5. Verificar histórico de validações
      const { data: historico, error: historicoError } = await supabase
        .from('historico_validacoes')
        .select('id, acao, data, descricao')
        .eq('form_entry_id', vendaId);
      
      console.log('📋 Histórico de validações:', { 
        count: historico?.length || 0, 
        error: historicoError?.message,
        sample: historico?.slice(0, 3) || []
      });

      // 6. Resumo das dependências
      const totalDependencies = (respostas?.length || 0) + (historico?.length || 0) + (alunoViaFormEntry ? 1 : 0);
      console.log('🔗 Resumo de dependências:', {
        aluno: !!alunoViaFormEntry,
        respostas: respostas?.length || 0,
        historico: historico?.length || 0,
        total: totalDependencies
      });

      console.log('🔬 === FIM DO DIAGNÓSTICO ===');
      
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error);
    }
  }

  static hasDeletePermission(userEmail: string): boolean {
    const hasPermission = this.AUTHORIZED_EMAILS.includes(userEmail);
    console.log('🔐 Verificando permissão de exclusão:', {
      userEmail,
      authorized: hasPermission,
      requiredEmails: this.AUTHORIZED_EMAILS
    });
    return hasPermission;
  }

  static getAuthorizedEmail(): string {
    return this.AUTHORIZED_EMAILS.join(', ');
  }
}
