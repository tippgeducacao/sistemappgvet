
import { supabase } from '@/integrations/supabase/client';

export class UltraSimpleUpdateService {
  static async updateVenda(vendaId: string, newStatus: 'pendente' | 'matriculado' | 'desistiu'): Promise<boolean> {
    console.log('🔥 UltraSimple: DIAGNÓSTICO COMPLETO', { vendaId, newStatus });
    
    try {
      // STEP 1: Verificar usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuário autenticado:', user?.id);

      if (!user) {
        console.error('❌ Usuário não autenticado');
        return false;
      }

      // STEP 2: Verificar se o registro existe e suas propriedades
      const { data: existingRecord, error: selectError } = await supabase
        .from('form_entries')
        .select('*')
        .eq('id', vendaId)
        .single();

      if (selectError) {
        console.error('❌ Erro ao buscar registro:', selectError);
        return false;
      }

      if (!existingRecord) {
        console.error('❌ Registro não encontrado');
        return false;
      }

      console.log('✅ Registro completo encontrado:', {
        id: existingRecord.id,
        status_atual: existingRecord.status,
        vendedor_id: existingRecord.vendedor_id,
        created: existingRecord.enviado_em
      });

      // STEP 3: Preparar dados para atualização
      const updateData: any = { 
        status: newStatus,
        atualizado_em: new Date().toISOString()
      };

      // Definir data de aprovação e assinatura apenas quando aprovado
      if (newStatus === 'matriculado') {
        updateData.data_aprovacao = new Date().toISOString();
        updateData.data_assinatura_contrato = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (newStatus === 'pendente' || newStatus === 'desistiu') {
        // Limpar datas quando pendente ou rejeitado
        updateData.data_aprovacao = null;
        updateData.data_assinatura_contrato = null;
      }

      // STEP 4: Tentar atualização SIMPLES primeiro
      console.log('🔄 Tentativa 1: Update simples...');
      const { data: updateResult1, error: updateError1 } = await supabase
        .from('form_entries')
        .update(updateData)
        .eq('id', vendaId)
        .select('id, status, atualizado_em');

      if (updateError1) {
        console.error('❌ Erro na tentativa 1:', updateError1);
      } else {
        console.log('📊 Resultado tentativa 1:', updateResult1);
        
        if (updateResult1 && updateResult1.length > 0) {
          const updatedRecord = updateResult1[0];
          if (updatedRecord.status === newStatus) {
            console.log('✅ SUCESSO na tentativa 1!');
            return true;
          }
        }
      }

      // STEP 5: Tentar atualização com UPSERT
      console.log('🔄 Tentativa 2: Upsert...');
      const upsertData = { 
        id: vendaId,
        ...updateData,
        vendedor_id: existingRecord.vendedor_id,
        enviado_em: existingRecord.enviado_em
      };

      const { data: updateResult2, error: updateError2 } = await supabase
        .from('form_entries')
        .upsert(upsertData)
        .select('id, status, atualizado_em');

      if (updateError2) {
        console.error('❌ Erro na tentativa 2:', updateError2);
      } else {
        console.log('📊 Resultado tentativa 2:', updateResult2);
        
        if (updateResult2 && updateResult2.length > 0) {
          const updatedRecord = updateResult2[0];
          if (updatedRecord.status === newStatus) {
            console.log('✅ SUCESSO na tentativa 2!');
            return true;
          }
        }
      }

      // STEP 6: Tentar atualização com match
      console.log('🔄 Tentativa 3: Update com match...');
      const { data: updateResult3, error: updateError3 } = await supabase
        .from('form_entries')
        .update(updateData)
        .match({ id: vendaId })
        .select();

      if (updateError3) {
        console.error('❌ Erro na tentativa 3:', updateError3);
        return false;
      }

      console.log('📊 Resultado tentativa 3:', updateResult3);
      return updateResult3 && updateResult3.length > 0;

    } catch (error) {
      console.error('❌ Erro inesperado na atualização:', error);
      return false;
    }
  }
}
