
import type { FormData } from '@/store/FormStore';

export class FormDataMappingService {
  static prepareFormResponses(formEntryId: string, formData: FormData) {
    console.log('🔧 Preparando mapeamento completo de respostas...');
    console.log('📋 FormData para mapeamento:', formData);
    
    const responses = [];

    // Mapeamento COMPLETO e DETALHADO de todos os campos
    const fieldMappings = {
      // Informações Básicas do Lead
      dataChegada: 'Data de Chegada',
      nomeAluno: 'Nome do Aluno',
      emailAluno: 'Email do Aluno',
      telefone: 'Telefone do Aluno',
      crmv: 'CRMV',
      formacaoAluno: 'Formação do Aluno',
      ies: 'IES',
      vendedor: 'Vendedor',
      
      // Informações do Curso
      cursoId: 'Curso ID',
      
      // Informações de Pagamento
      valorContrato: 'Valor do Contrato',
      percentualDesconto: 'Percentual de Desconto',
      dataPrimeiroPagamento: 'Data do Primeiro Pagamento',
      carenciaPrimeiraCobranca: 'Carência da Primeira Cobrança',
      detalhesCarencia: 'Detalhes da Carência',
      reembolsoMatricula: 'Reembolso da Matrícula',
      indicacao: 'Indicação',
      nomeIndicador: 'Nome do Indicador',
      
      // Informações de Scoring/Pontuação
      lotePos: 'Lote da Pós-Graduação',
      matricula: 'Matrícula',
      modalidade: 'Modalidade do Curso',
      parcelamento: 'Condições de Parcelamento',
      pagamento: 'Forma de Pagamento',
      formaCaptacao: 'Forma de Captação do Lead',
      tipoVenda: 'Tipo de Venda',
      vendaCasada: 'Venda Casada',
      
      // Observações
      observacoes: 'Observações Gerais'
    };

    console.log('🗂️ Mapeamentos disponíveis:', Object.keys(fieldMappings));

    // Processar TODOS os campos do formulário
    Object.entries(fieldMappings).forEach(([fieldKey, fieldName]) => {
      const value = formData[fieldKey as keyof FormData];
      
      console.log(`🔍 Processando campo: ${fieldKey} -> ${fieldName}:`, value);
      
      if (value !== undefined && value !== null && value.toString().trim() !== '') {
        responses.push({
          form_entry_id: formEntryId,
          campo_nome: fieldName,
          valor_informado: value.toString().trim()
        });
        
        console.log(`✅ Campo adicionado: ${fieldName} = ${value}`);
      } else {
        console.log(`⚠️ Campo vazio/nulo ignorado: ${fieldKey}`);
      }
    });

    console.log(`📊 Total de respostas preparadas: ${responses.length}`);
    console.log('📋 Respostas finais:', responses);
    
    return responses;
  }
}
