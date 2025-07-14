
import { ErrorService } from '@/services/error/ErrorService';
import { supabase } from '@/integrations/supabase/client';
import type { FormData } from '@/store/FormStore';

export class FormValidationService {
  static async validateVendedor(vendedorId: string): Promise<void> {
    console.log('🔍 Validando vendedor:', vendedorId);
    
    try {
      // Verificar se o vendedor existe na tabela profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, user_type')
        .eq('id', vendedorId)
        .single();

      if (profileError || !profile) {
        console.error('❌ Vendedor não encontrado na tabela profiles:', profileError);
        throw new Error('Vendedor não encontrado no sistema. Verifique se o usuário foi criado corretamente.');
      }

      if (profile.user_type !== 'vendedor') {
        console.error('❌ Usuário não é um vendedor:', profile);
        throw new Error('Usuário não tem permissão de vendedor.');
      }

      console.log('✅ Vendedor validado com sucesso:', profile);
    } catch (error) {
      console.error('💥 Erro na validação do vendedor:', error);
      throw error;
    }
  }

  static async validateFormData(formData: FormData): Promise<void> {
    console.log('🔍 Validando dados do formulário...');
    
    // Validações obrigatórias
    ErrorService.validateRequired(formData.nomeAluno, 'Nome do aluno');
    ErrorService.validateRequired(formData.emailAluno, 'Email do aluno');
    ErrorService.validateRequired(formData.cursoId, 'Curso');
    ErrorService.validateRequired(formData.modalidade, 'Modalidade');
    
    ErrorService.validateRequired(formData.vendaCasada, 'Venda Casada');

    // Validar detalhes da carência se carência for SIM
    if (formData.carenciaPrimeiraCobranca === 'SIM') {
      ErrorService.validateRequired(formData.detalhesCarencia, 'Detalhes da carência são obrigatórios quando há carência');
    }

    // Como todos os canais agora são reuniões, não há mais validação de documento comprobatório obrigatório

    if (formData.emailAluno) {
      ErrorService.validateEmail(formData.emailAluno);
    }

    console.log('✅ Validação do formulário APROVADA!');
  }
}
