
import { supabase } from '@/integrations/supabase/client';
import { ErrorService } from '@/services/error/ErrorService';
import { ScoringService } from '@/services/scoringService';
import { ScoringCalculationService } from '@/services/scoring/ScoringCalculationService';
import { FormValidationService } from './FormValidationService';
import { FormEntryCreationService } from './FormEntryCreationService';
import { AlunoCreationService } from './AlunoCreationService';
import { FormResponsesService } from './FormResponsesService';
import type { FormData } from '@/store/FormStore';

export interface SaveFormDataParams {
  formData: FormData;
  vendedorId: string;
  editId?: string | null;
}

export class FormPersistenceService {
  static async saveFormData(data: SaveFormDataParams): Promise<string> {
    console.log('📤 INICIANDO SALVAMENTO DO FORMULÁRIO');
    console.log('👤 Vendedor ID:', data.vendedorId);
    console.log('📋 Dados do formulário:', data.formData);
    console.log('✏️ EditId recebido:', data.editId);
    console.log('🔍 É edição?', !!data.editId);

    try {
      // 1. Validar dados obrigatórios
      await this.validateFormData(data.formData);

      // 2. Calcular pontuação esperada
      const pontuacaoEsperada = await this.calculateExpectedScore(data.formData);
      console.log('🎯 Pontuação calculada:', pontuacaoEsperada);

      // 3. Se é edição, atualizar venda existente
      if (data.editId) {
        console.log('🔄 EDITANDO VENDA EXISTENTE:', data.editId);
        
        // Primeiro verificar se a venda existe e pertence ao vendedor
        const { data: existingVenda, error: checkError } = await supabase
          .from('form_entries')
          .select('id, status, vendedor_id')
          .eq('id', data.editId)
          .eq('vendedor_id', data.vendedorId)
          .single();

        if (checkError || !existingVenda) {
          console.error('❌ Venda não encontrada ou sem permissão:', checkError);
          throw new Error('Venda não encontrada ou você não tem permissão para editá-la');
        }

        console.log('✅ Venda encontrada, status atual:', existingVenda.status);
        
        return await this.updateExistingVenda(data.editId, data.formData, data.vendedorId, pontuacaoEsperada);
      }

      // 3. Criar nova entrada do formulário primeiro
      const formEntry = await FormEntryCreationService.createFormEntry(
        data.vendedorId,
        data.formData,
        pontuacaoEsperada,
        null // documento será enviado após criar o form_entry
      );

      // 4. Upload do documento se fornecido
      if (data.formData.documentoComprobatorio) {
        console.log('📎 Fazendo upload do documento...');
        try {
          const { DocumentUploadService } = await import('./DocumentUploadService');
          const documentPath = await DocumentUploadService.uploadDocument(
            data.formData.documentoComprobatorio,
            data.vendedorId,
            formEntry.id
          );
          
          // Atualizar form_entry com o caminho do documento
          await supabase
            .from('form_entries')
            .update({ documento_comprobatorio: documentPath })
            .eq('id', formEntry.id);
            
          console.log('✅ Documento enviado e vinculado:', documentPath);
        } catch (error) {
          console.error('❌ Erro no upload do documento:', error);
          // Não bloquear o salvamento, apenas alertar
        }
      }

      console.log('📄 Form entry criado:', formEntry.id);

      // 5. Criar ou buscar aluno
      const alunoId = await AlunoCreationService.createAluno(
        data.formData,
        formEntry.id, // formEntryId já definido
        data.vendedorId
      );

      console.log('👨‍🎓 Aluno processado:', alunoId);

      // 6. Atualizar form_entry com o aluno_id se necessário
      if (alunoId) {
        await AlunoCreationService.linkAlunoToFormEntry(alunoId, formEntry.id);
      }

      // 7. Salvar respostas do formulário
      await FormResponsesService.saveFormResponses(formEntry.id, data.formData);

      console.log('✅ FORMULÁRIO SALVO COM SUCESSO!');
      return formEntry.id;

    } catch (error) {
      console.error('❌ ERRO NO SALVAMENTO:', error);
      
      // Log detalhado do erro
      if (error instanceof Error) {
        console.error('🔍 Detalhes do erro:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      throw error;
    }
  }

  private static async calculateExpectedScore(formData: FormData): Promise<number> {
    try {
      console.log('🧮 Calculando pontuação esperada...');
      
      // Buscar regras de pontuação
      const { data: rules, error } = await supabase
        .from('regras_pontuacao')
        .select('*');

      if (error) {
        console.error('❌ Erro ao buscar regras:', error);
        console.warn('⚠️ Usando pontuação padrão (1 ponto)');
        return 1; // Fallback para pontuação base
      }

      if (!rules || rules.length === 0) {
        console.warn('⚠️ Nenhuma regra encontrada, usando pontuação padrão');
        return 1;
      }

      console.log(`📊 ${rules.length} regras carregadas`);
      
      // Calcular pontuação
      const pontuacao = ScoringCalculationService.calculateTotalPoints(formData, rules);
      
      // Garantir que a pontuação seja um número válido
      if (!isFinite(pontuacao) || isNaN(pontuacao)) {
        console.warn('⚠️ Pontuação inválida calculada, usando padrão');
        return 1;
      }

      return pontuacao;

    } catch (error) {
      console.error('❌ Erro no cálculo de pontuação:', error);
      console.warn('⚠️ Usando pontuação padrão devido ao erro');
      return 1; // Fallback seguro
    }
  }

  static async validateFormData(formData: FormData): Promise<void> {
    console.log('🔍 Validando dados do formulário...');

    const errors: string[] = [];

    // Validações obrigatórias básicas
    if (!formData.nomeAluno?.trim()) {
      errors.push('Nome do aluno é obrigatório');
    }

    if (!formData.emailAluno?.trim()) {
      errors.push('Email do aluno é obrigatório');
    }

    if (!formData.cursoId?.trim()) {
      errors.push('Curso é obrigatório');
    }

    // Validar se pelo menos alguns campos de scoring estão preenchidos
    const scoringFields = [
      formData.lotePos, formData.matricula, formData.modalidade, 
      formData.parcelamento, formData.pagamento, formData.formaCaptacao, 
      formData.tipoVenda
    ];
    
    const filledScoringFields = scoringFields.filter(field => field && field.trim() !== '');
    
    if (filledScoringFields.length === 0) {
      errors.push('Pelo menos um campo de pontuação deve ser preenchido');
    }

    // Validações específicas para venda casada
    if (formData.vendaCasada === 'SIM' && !formData.detalhesVendaCasada?.trim()) {
      errors.push('Detalhes da venda casada são obrigatórios quando venda casada = SIM');
    }

    // Validações de comprovação obrigatória
    const tiposQueRequeremComprovacao = ['LIGAÇÃO', 'LIGAÇÃO E FECHAMENTO NO WHATSAPP'];
    if (tiposQueRequeremComprovacao.includes(formData.tipoVenda)) {
      if (!formData.documentoComprobatorio && !formData.observacoes?.trim()) {
        errors.push('Para este tipo de venda é obrigatório anexar um documento comprobatório ou adicionar observações detalhadas');
      }
    }

    if (errors.length > 0) {
      const errorMessage = `Erros de validação: ${errors.join(', ')}`;
      console.error('❌ Validação falhou:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ Validação passou');
  }

  private static async updateExistingVenda(
    editId: string, 
    formData: FormData, 
    vendedorId: string, 
    pontuacaoEsperada: number
  ): Promise<string> {
    console.log('🔄 Atualizando venda existente:', editId);
    console.log('📊 Nova pontuação esperada:', pontuacaoEsperada);
    console.log('👤 Vendedor ID:', vendedorId);

    // 1. Atualizar form_entry principal usando UPDATE direto
    console.log('📝 Executando UPDATE na form_entries...');
    
    const { data: updatedEntry, error: updateError } = await supabase
      .from('form_entries')
      .update({
        curso_id: formData.cursoId,
        observacoes: formData.observacoes,
        pontuacao_esperada: pontuacaoEsperada,
        status: 'pendente', // FORÇAR status pendente
        motivo_pendencia: null, // Limpar motivo da rejeição anterior
        pontuacao_validada: null, // Resetar pontuação validada
        atualizado_em: new Date().toISOString()
      })
      .eq('id', editId)
      .select('*');

    if (updateError) {
      console.error('❌ Erro ao atualizar form_entry:', updateError);
      throw new Error('Erro ao atualizar venda: ' + updateError.message);
    }

    if (!updatedEntry || updatedEntry.length === 0) {
      console.error('❌ Nenhuma linha foi atualizada');
      throw new Error('Não foi possível atualizar a venda. Verifique se você tem permissão.');
    }

    console.log('✅ Form entry atualizado com sucesso:', updatedEntry[0]);
    console.log('🎯 Novo status:', updatedEntry[0].status);

    // 2. Atualizar dados do aluno
    const { error: alunoError } = await supabase
      .from('alunos')
      .update({
        nome: formData.nomeAluno,
        email: formData.emailAluno,
        telefone: formData.telefone || null,
        crmv: formData.crmv || null,
        updated_at: new Date().toISOString()
      })
      .eq('form_entry_id', editId);

    if (alunoError) {
      console.error('❌ Erro ao atualizar aluno:', alunoError);
      throw new Error('Erro ao atualizar dados do aluno: ' + alunoError.message);
    }

    // 3. Salvar novas respostas (usando upsert, não precisamos deletar antes)
    await FormResponsesService.saveFormResponses(editId, formData);

    console.log('✅ VENDA ATUALIZADA COM SUCESSO!');
    return editId;
  }
}
