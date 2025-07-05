
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class FormValidationService {
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email) {
      errors.push('Email é obrigatório');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Formato de email inválido');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Senha é obrigatória');
    } else if (password.length < 6) {
      errors.push('A senha deve ter pelo menos 6 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateRequired(value: string, fieldName: string): ValidationResult {
    const errors: string[] = [];
    
    if (!value || value.trim().length === 0) {
      errors.push(`${fieldName} é obrigatório`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateForm(fields: { [key: string]: string }, requiredFields: string[]): ValidationResult {
    const errors: string[] = [];
    
    requiredFields.forEach(field => {
      const result = this.validateRequired(fields[field], field);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
