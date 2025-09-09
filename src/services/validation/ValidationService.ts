
import { FormData } from '@/store/FormStore';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FieldValidationRule {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export class ValidationService {
  private static readonly FIELD_RULES: Record<keyof FormData, FieldValidationRule> = {
    // Lead info validations
    dataChegada: { required: true },
    nomeAluno: { required: true, minLength: 2, maxLength: 100 },
    emailAluno: { required: true, email: true },
    formacaoAluno: { required: true },
    dataMatricula: {},
    dataAssinaturaContrato: {},
    ies: { required: true },
    modalidadeCurso: { required: true },
    cursoId: { required: true },
    semestre: {},
    ano: {},
    turma: {},
    telefone: {},
    crmv: {},
    valorContrato: { required: true },
    percentualDesconto: {},
    dataPrimeiroPagamento: { required: true },
    carenciaPrimeiraCobranca: {},
    detalhesCarencia: {},
    reembolsoMatricula: {},
    indicacao: { required: true },
    nomeIndicador: {},
    vendedor: { required: true },
    
    // Scoring rules validations
    lotePos: {},
    matricula: {},
    modalidade: { required: true },
    parcelamento: {},
    pagamento: {},
    formaCaptacao: {},
    
    vendaCasada: { required: true },
    detalhesVendaCasada: { maxLength: 500 },
    
    // Document
    documentoComprobatorio: {},
    
    // Observations
    observacoes: { maxLength: 1000 },
    
    // Meeting ID (optional)
    agendamentoId: {},
    sdrId: {},
    sdrNome: {}
  };

  static validateField(fieldName: keyof FormData, value: string | File | null): string | null {
    const rule = this.FIELD_RULES[fieldName];
    if (!rule) return null;

    // Handle File type for document field
    if (fieldName === 'documentoComprobatorio') {
      if (rule.required && !value) {
        return `${this.getFieldDisplayName(fieldName)} é obrigatório`;
      }
      return null;
    }

    // Convert to string for other validations
    const stringValue = value ? value.toString() : '';

    // Required validation
    if (rule.required && (!stringValue || stringValue.trim().length === 0)) {
      return `${this.getFieldDisplayName(fieldName)} é obrigatório`;
    }

    // Skip other validations if field is empty and not required
    if (!stringValue || stringValue.trim().length === 0) {
      return null;
    }

    // Email validation
    if (rule.email && !this.isValidEmail(stringValue)) {
      return 'Formato de email inválido';
    }

    // Min length validation
    if (rule.minLength && stringValue.length < rule.minLength) {
      return `Deve ter pelo menos ${rule.minLength} caracteres`;
    }

    // Max length validation
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return `Deve ter no máximo ${rule.maxLength} caracteres`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return 'Formato inválido';
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(stringValue);
    }

    return null;
  }

  static validateForm(formData: FormData): ValidationResult {
    const errors: Record<string, string> = {};

    Object.keys(formData).forEach(key => {
      const fieldName = key as keyof FormData;
      const error = this.validateField(fieldName, formData[fieldName]);
      if (error) {
        errors[fieldName] = error;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateRequiredFields(formData: FormData, requiredFields: (keyof FormData)[]): ValidationResult {
    const errors: Record<string, string> = {};

    requiredFields.forEach(fieldName => {
      const error = this.validateField(fieldName, formData[fieldName]);
      if (error) {
        errors[fieldName] = error;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static getFieldDisplayName(fieldName: keyof FormData): string {
    const displayNames: Record<keyof FormData, string> = {
      dataChegada: 'Data de Chegada',
      nomeAluno: 'Nome do Aluno',
      emailAluno: 'Email do Aluno',
      formacaoAluno: 'Formação do Aluno',
      dataMatricula: 'Data de Matrícula',
      dataAssinaturaContrato: 'Data de Assinatura do Contrato',
      ies: 'IES',
      modalidadeCurso: 'Modalidade',
      cursoId: 'Curso',
      semestre: 'Semestre',
      ano: 'Ano',
      turma: 'Turma',
      telefone: 'Telefone',
      crmv: 'CRMV',
      valorContrato: 'Valor do Contrato',
      percentualDesconto: 'Percentual de Desconto',
      dataPrimeiroPagamento: 'Data do Primeiro Pagamento',
      carenciaPrimeiraCobranca: 'Carência da Primeira Cobrança',
      detalhesCarencia: 'Detalhes da Carência',
      reembolsoMatricula: 'Reembolso da Matrícula',
      indicacao: 'Indicação',
      nomeIndicador: 'Nome do Indicador',
      vendedor: 'Vendedor',
      lotePos: 'Lote da Pós-Graduação',
      matricula: 'Matrícula',
      modalidade: 'Modalidade do Curso',
      parcelamento: 'Condições de Parcelamento',
      pagamento: 'Forma de Pagamento',
      formaCaptacao: 'Forma de Captação do Lead',
      
      vendaCasada: 'Venda Casada',
      detalhesVendaCasada: 'Detalhes da Venda Casada',
      documentoComprobatorio: 'Documento Comprobatório',
      observacoes: 'Observações',
      agendamentoId: 'ID do Agendamento',
      sdrId: 'ID do SDR',
      sdrNome: 'Nome do SDR'
    };

    return displayNames[fieldName] || fieldName;
  }
}
