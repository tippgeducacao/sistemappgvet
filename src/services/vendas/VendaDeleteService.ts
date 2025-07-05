
import { supabase } from '@/integrations/supabase/client';
import { ErrorService } from '@/services/error/ErrorService';

export class VendaDeleteService {
  private static readonly AUTHORIZED_EMAIL = 'wallasmonteiro019@gmail.com';

  static async deleteVenda(vendaId: string, currentUserEmail: string): Promise<boolean> {
    try {
      console.log('🗑️ VendaDeleteService: Iniciando exclusão de venda:', vendaId.substring(0, 8));
      console.log('👤 Usuário solicitante:', currentUserEmail);

      if (!this.hasDeletePermission(currentUserEmail)) {
        console.error('❌ Usuário não autorizado:', currentUserEmail);
        throw new Error('Você não tem permissão para excluir vendas.');
      }

      console.log('🔍 Executando diagnóstico PRÉ-exclusão...');
      await this.diagnosticoCompleto(vendaId);

      console.log('🔥 Executando RPC delete_venda_cascade...');
      
      const { data: deleteResult, error: rpcError } = await supabase.rpc('delete_venda_cascade', {
        venda_id: vendaId
      });

      if (rpcError) {
        console.error('❌ ERRO RPC:', rpcError);
        console.log('🔍 Diagnóstico pós-erro RPC...');
        await this.diagnosticoCompleto(vendaId);
        throw new Error(`Erro na função de exclusão: ${rpcError.message}`);
      }

      console.log('📊 Resultado da função RPC:', deleteResult);
      
      if (deleteResult !== true) {
        console.error('💥 Função RPC retornou falso - exclusão falhou');
        console.log('🔍 Diagnóstico de falha...');
        await this.diagnosticoCompleto(vendaId);
        throw new Error('A exclusão falhou na função do banco de dados. Verifique os logs para mais detalhes.');
      }

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

  private static async diagnosticoCompleto(vendaId: string): Promise<void> {
    try {
      console.log('🔬 === DIAGNÓSTICO COMPLETO DETALHADO ===');
      
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

      const { data: respostas, error: respostasError } = await supabase
        .from('respostas_formulario')
        .select('id, campo_nome, valor_informado')
        .eq('form_entry_id', vendaId);
      
      console.log('📝 Respostas do formulário:', { 
        count: respostas?.length || 0, 
        error: respostasError?.message,
        sample: respostas?.slice(0, 3) || []
      });

      const totalDependencies = (respostas?.length || 0) + (alunoViaFormEntry ? 1 : 0);
      console.log('🔗 Resumo de dependências:', {
        aluno: !!alunoViaFormEntry,
        respostas: respostas?.length || 0,
        total: totalDependencies
      });

      console.log('🔬 === FIM DO DIAGNÓSTICO ===');
      
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error);
    }
  }

  static hasDeletePermission(userEmail: string): boolean {
    const hasPermission = userEmail === this.AUTHORIZED_EMAIL;
    console.log('🔐 Verificando permissão de exclusão:', {
      userEmail,
      authorized: hasPermission,
      requiredEmail: this.AUTHORIZED_EMAIL
    });
    return hasPermission;
  }

  static getAuthorizedEmail(): string {
    return this.AUTHORIZED_EMAIL;
  }
}
