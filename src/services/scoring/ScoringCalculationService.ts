
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
    
    vendaCasada: 'Venda Casada'
  };

  static calculateTotalPoints(formData: FormData, rules: any[]): number {
    console.log('🔢 Calculando pontuação total do formulário');
    console.log('📋 Dados do formulário:', formData);
    console.log('📊 Regras disponíveis:', rules.length);
    
    // Verificar se modalidade é "Curso"
    const modalidade = formData.modalidade;
    const isCurso = modalidade === 'Curso';
    
    let totalPoints = this.getBasePoints(modalidade);
    console.log(`🎯 Pontos base: ${totalPoints} (modalidade: ${modalidade})`);

    // Se modalidade é "Curso", não aplicar regras de pontuação
    if (isCurso) {
      console.log('🚫 Modalidade é "Curso" - não aplicando regras de pontuação');
      console.log(`🏆 Pontuação total calculada: ${totalPoints}`);
      return totalPoints;
    }

    // Iterar pelos campos que têm pontuação
    for (const [formFieldName, ruleFieldName] of Object.entries(this.FIELD_NAME_MAPPING)) {
      const fieldValue = formData[formFieldName as keyof FormData];
      
      if (typeof fieldValue === 'string' && fieldValue.trim() !== '') {
        console.log(`🔍 PROCESSANDO CAMPO: ${formFieldName} → ${ruleFieldName} = "${fieldValue}"`);
        
        const fieldPoints = this.calculateFieldPointsByName(ruleFieldName, fieldValue, rules);
        console.log(`📍 Campo ${formFieldName} (${ruleFieldName}) = "${fieldValue}" → ${fieldPoints} pts`);
        totalPoints += fieldPoints;
      }
    }

    console.log(`🏆 Pontuação total calculada: ${totalPoints}`);
    return totalPoints;
  }

  static getBasePoints(modalidade?: string): number {
    // Se modalidade é "Curso", retorna 0,2; caso contrário, retorna 1
    return modalidade === 'Curso' ? 0.2 : 1;
  }

  static calculatePointsFromResponses(vendaRespostas: any[], rules: any[]): number {
    console.log('🔢 Calculando pontos das respostas...');
    console.log('📝 Respostas recebidas:', vendaRespostas.length);
    console.log('📊 Regras disponíveis:', rules.length);

    // Verificar se modalidade é "Curso"
    const modalidadeResposta = vendaRespostas.find(r => 
      r.campo_nome === 'Modalidade' || r.campo_nome === 'Modalidade do Curso'
    );
    const modalidade = modalidadeResposta?.valor_informado;
    const isCurso = modalidade === 'Curso';

    let totalPoints = this.getBasePoints(modalidade);
    console.log(`🎯 Pontos base: ${totalPoints} (modalidade: ${modalidade})`);

    // Se modalidade é "Curso", não aplicar regras de pontuação
    if (isCurso) {
      console.log('🚫 Modalidade é "Curso" - não aplicando regras de pontuação');
      console.log(`🏆 Pontuação total das respostas: ${totalPoints}`);
      return totalPoints;
    }

    // Mapear respostas do formulário para os nomes corretos dos campos
    const fieldMapping: Record<string, string> = {
      'Lote Pós': 'Lote da Pós-Graduação',
      'Lote da Pós-Graduação': 'Lote da Pós-Graduação',
      'Matrícula': 'Matrícula',
      'Modalidade': 'Modalidade do Curso',
      'Modalidade do Curso': 'Modalidade do Curso',
      'Parcelamento': 'Condições de Parcelamento',
      'Condições de Parcelamento': 'Condições de Parcelamento',
      'Forma de Pagamento': 'Forma de Pagamento',
      'Forma de Captação': 'Forma de Captação do Lead',
      'Forma de Captação do Lead': 'Forma de Captação do Lead',
      'Tipo de Venda': 'Tipo de Venda',
      
      'Venda Casada': 'Venda Casada'
    };

    for (const resposta of vendaRespostas) {
      if (resposta.campo_nome && resposta.valor_informado) {
        const nomeCampoMapeado = fieldMapping[resposta.campo_nome] || resposta.campo_nome;
        const pontos = this.calculateFieldPointsByName(nomeCampoMapeado, resposta.valor_informado, rules);
        console.log(`📍 Resposta: ${resposta.campo_nome} → ${nomeCampoMapeado} = "${resposta.valor_informado}" → ${pontos} pts`);
        totalPoints += pontos;
      }
    }

    console.log(`🏆 Pontuação total das respostas: ${totalPoints}`);
    return totalPoints;
  }

  private static calculateFieldPointsByName(fieldName: string, fieldValue: string, rules: any[]): number {
    console.log(`🔍 Buscando regra: campo="${fieldName}", valor="${fieldValue}"`);
    
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
