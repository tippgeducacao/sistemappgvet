
import { FormData } from '@/store/FormStore';

export class ScoringCalculationService {
  // Mapeamento entre campos do formulário e nomes nas regras de pontuação
  private static readonly FIELD_NAME_MAPPING: Record<string, string> = {
    lotePos: 'Lote da Pós-Graduação',
    matricula: 'Matrícula',
    modalidade: 'Modalidade do Curso',
    parcelamento: 'Condições de Parcelamento',
    pagamento: 'Forma de Pagamento',
    formaCaptacao: 'Forma de Captação do Lead',
    tipoVenda: 'Canal/Local da Venda',
    vendaCasada: 'Venda Casada'
  };

  static calculateTotalPoints(formData: FormData, rules: any[]): number {
    console.log('🔢 Calculando pontuação total do formulário');
    console.log('📋 Dados do formulário:', formData);
    console.log('📊 Regras disponíveis:', rules.length);
    console.log('📊 TODAS AS REGRAS:', rules);
    
    let totalPoints = this.getBasePoints();
    console.log(`🎯 Pontos base: ${totalPoints}`);

    // Iterar pelos campos que têm pontuação
    for (const [formFieldName, ruleFieldName] of Object.entries(this.FIELD_NAME_MAPPING)) {
      const fieldValue = formData[formFieldName as keyof FormData];
      
      if (typeof fieldValue === 'string' && fieldValue.trim() !== '') {
        console.log(`🔍 PROCESSANDO CAMPO: ${formFieldName} → ${ruleFieldName} = "${fieldValue}"`);
        
        // Debug específico para tipoVenda
        if (formFieldName === 'tipoVenda') {
          console.log(`🎯 TIPO VENDA - Valor do formulário: "${fieldValue}"`);
          console.log(`🎯 TIPO VENDA - Campo nas regras: "${ruleFieldName}"`);
          console.log(`🎯 TIPO VENDA - Regras disponíveis para este campo:`, 
            rules.filter(r => r.campo_nome === ruleFieldName)
          );
        }
        
        const fieldPoints = this.calculateFieldPointsByName(ruleFieldName, fieldValue, rules);
        console.log(`📍 Campo ${formFieldName} (${ruleFieldName}) = "${fieldValue}" → ${fieldPoints} pts`);
        totalPoints += fieldPoints;
      }
    }

    console.log(`🏆 Pontuação total calculada: ${totalPoints}`);
    return totalPoints;
  }

  static getBasePoints(): number {
    // Retorna 1 ponto fixo como base, conforme regra estabelecida
    return 1;
  }

  static calculatePointsFromResponses(vendaRespostas: any[], rules: any[]): number {
    let totalPoints = 0;

    for (const resposta of vendaRespostas) {
      if (resposta.campo_nome && resposta.valor) {
        totalPoints += this.calculateFieldPointsByName(resposta.campo_nome, resposta.valor, rules);
      }
    }

    return totalPoints;
  }

  private static calculateFieldPoints(fieldName: string, fieldValue: string, rules: any[]): number {
    // Forma de captação não pontua
    if (fieldName === 'formaCaptacao') {
      return 0;
    }

    const rule = rules.find(rule => rule.field_name === fieldName && rule.field_value === fieldValue);
    return rule ? rule.points : 0;
  }

  private static calculateFieldPointsByName(fieldName: string, fieldValue: string, rules: any[]): number {
    console.log(`🔍 Buscando regra: campo="${fieldName}", valor="${fieldValue}"`);
    console.log(`📊 Total de regras disponíveis: ${rules.length}`);
    
    // Log de todas as regras para debug
    console.log(`📊 REGRAS PARA CAMPO "${fieldName}":`, 
      rules.filter(r => r.campo_nome === fieldName)
    );
    
    // Forma de captação não pontua
    if (fieldName === 'Forma de Captação do Lead') {
      console.log('📝 Campo de captação não pontua');
      return 0;
    }

    const rule = rules.find(rule => {
      const fieldMatch = rule.campo_nome === fieldName;
      const valueMatch = rule.opcao_valor === fieldValue;
      console.log(`Verificando regra: ${rule.campo_nome} = ${rule.opcao_valor} (${rule.pontos} pts) - Field: ${fieldMatch}, Value: ${valueMatch}`);
      return fieldMatch && valueMatch;
    });
    
    const points = rule ? rule.pontos : 0;
    console.log(`🎯 Regra encontrada:`, rule ? `${points} pontos` : 'nenhuma');
    
    if (!rule) {
      console.warn(`⚠️ NENHUMA REGRA ENCONTRADA para campo="${fieldName}" e valor="${fieldValue}"`);
      console.warn(`⚠️ Valores disponíveis para este campo:`, 
        rules.filter(r => r.campo_nome === fieldName).map(r => r.opcao_valor)
      );
    }
    
    return points;
  }
}
