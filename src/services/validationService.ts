
export class ValidationService {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateRequired(value: string): boolean {
    return value.trim().length > 0;
  }

  static validateForm(formData: Record<string, any>, requiredFields: string[]): string[] {
    const errors: string[] = [];
    
    requiredFields.forEach(field => {
      if (!formData[field] || !this.validateRequired(formData[field])) {
        errors.push(`${field} é obrigatório`);
      }
    });

    if (formData.emailAluno && !this.validateEmail(formData.emailAluno)) {
      errors.push('Email inválido');
    }

    return errors;
  }
}
