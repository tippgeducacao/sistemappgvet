
import { supabase } from '@/integrations/supabase/client';
import { ErrorService } from '@/services/error/ErrorService';
import { ScoringService } from '@/services/scoringService';
import { ScoringCalculationService } from '@/services/scoring/ScoringCalculationService';
import { FormValidationService } from './FormValidationService';
import { FormEntryCreationService } from './FormEntryCreationService';
import { AlunoCreationService } from './AlunoCreationService';
import { FormResponsesService } from './FormResponsesService';
import type { FormData } from '@/store/FormStore';

export interface FormSubmissionData {
  formData: FormData;
  vendedorId: string;
}

export class FormPersistenceService {
  static async saveFormData(data: FormSubmissionData): Promise<string> {
    try {
      console.log('🔄 FormPersistenceService: Iniciando salvamento completo do formulário');
      console.log('📋 Dados do formulário a serem salvos:', data.formData);
      console.log('👤 Vendedor ID:', data.vendedorId);
      console.log('📎 DOCUMENTO COMPROBATÓRIO:', data.formData.documentoComprobatorio);

      // 0. Verificar se o vendedor existe no sistema
      await FormValidationService.validateVendedor(data.vendedorId);

      // 1. Validar dados obrigatórios
      await FormValidationService.validateFormData(data.formData);

      // 2. Buscar regras de pontuação
      const rules = await ScoringService.fetchScoringRules();
      console.log('📏 Regras de pontuação carregadas:', rules.length);

      // 3. Calcular pontuação esperada
      const pontuacaoEsperada = ScoringCalculationService.calculateTotalPoints(data.formData, rules);
      console.log('🔢 Pontuação calculada:', pontuacaoEsperada);

      // 4. CRÍTICO: Upload do documento PRIMEIRO
      let documentPath: string | null = null;
      
      if (data.formData.documentoComprobatorio) {
        console.log('📎 ========== UPLOAD PRIORITÁRIO DO DOCUMENTO ==========');
        documentPath = await this.uploadDocument(data.formData.documentoComprobatorio, data.vendedorId);
        console.log('✅ Documento enviado para:', documentPath);
      }

      // 5. Criar entrada principal do formulário COM o documento já anexado
      const formEntry = await FormEntryCreationService.createFormEntry(
        data.vendedorId,
        data.formData,
        pontuacaoEsperada,
        documentPath
      );

      console.log('✅ Form entry criado com documento:', {
        id: formEntry.id,
        documento: formEntry.documento_comprobatorio
      });

      let alunoId: string | null = null;

      // 6. Reorganizar arquivo se necessário (manter estrutura de pastas)
      if (documentPath && formEntry.id) {
        const finalDocumentPath = await FormEntryCreationService.reorganizeDocumentPath(documentPath, formEntry.id);
        
        // Atualizar o documento_comprobatorio na form_entry com o caminho final
        if (finalDocumentPath !== documentPath) {
          const { error: updateDocError } = await supabase
            .from('form_entries')
            .update({ documento_comprobatorio: finalDocumentPath })
            .eq('id', formEntry.id);
            
          if (updateDocError) {
            console.error('❌ Erro ao atualizar caminho final do documento:', updateDocError);
          } else {
            console.log('✅ Caminho do documento atualizado para:', finalDocumentPath);
          }
        }
      }

      // 7. Criar registro do aluno se dados obrigatórios estão presentes
      alunoId = await AlunoCreationService.createAluno(data.formData, formEntry.id, data.vendedorId);

      // 8. Vincular aluno à form_entry se aluno foi criado
      if (alunoId) {
        await AlunoCreationService.linkAlunoToFormEntry(alunoId, formEntry.id);
      }

      // 9. Salvar TODAS as respostas do formulário
      console.log('💾 Iniciando salvamento de respostas do formulário...');
      await FormResponsesService.saveFormResponses(formEntry.id, data.formData);

      // 10. Verificação final CRÍTICA - buscar dados atualizados
      const { data: finalFormEntry, error: finalCheckError } = await supabase
        .from('form_entries')
        .select('id, aluno_id, status, documento_comprobatorio')
        .eq('id', formEntry.id)
        .single();

      if (finalCheckError || !finalFormEntry) {
        console.error('❌ Erro na verificação final:', finalCheckError);
        throw new Error('Falha na verificação final dos dados salvos');
      }

      console.log('🎉 ========== SALVAMENTO CONCLUÍDO COM SUCESSO ==========');
      console.log('📊 Resumo final COMPLETO:', {
        formEntryId: finalFormEntry.id,
        alunoId: alunoId,
        pontuacao: pontuacaoEsperada,
        status: finalFormEntry.status,
        documentoFinal: finalFormEntry.documento_comprobatorio,
        documentoSalvoCorretamente: !!finalFormEntry.documento_comprobatorio
      });

      return finalFormEntry.id;

    } catch (error) {
      console.error('💥 ERRO CRÍTICO ao salvar formulário:', error);
      ErrorService.logError(error as Error, 'FormPersistenceService.saveFormData');
      throw error;
    }
  }

  private static async uploadDocument(file: File, vendedorId: string): Promise<string> {
    console.log('📎 ========== UPLOAD PRIORITÁRIO DO DOCUMENTO ==========');
    console.log('📄 Arquivo para upload:', {
      nome: file.name,
      tamanho: file.size,
      tipo: file.type
    });
    
    // Fazer upload com nome temporário primeiro
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${vendedorId}/temp-${timestamp}/${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documentos-vendas')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erro no upload do documento:', uploadError);
      throw new Error(`Falha no upload do documento: ${uploadError.message}`);
    }
    
    console.log('✅ DOCUMENTO ENVIADO COM SUCESSO:', uploadData.path);
    return uploadData.path;
  }

  // Manter os métodos estáticos de validação para compatibilidade
  static async validateFormData(formData: FormData): Promise<void> {
    return FormValidationService.validateFormData(formData);
  }
}
