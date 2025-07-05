export const FORMACAO_OPTIONS = [
  'Médico Veterinário',
  'Zootecnista', 
  'Pedagogia',
  'Engenheiro Agrônomo', 
  'Administrador',
  'Técnica Agropecuária',
  'Gestor do Agronegócio',
  'Bióloga',
  'Engenharia de Produção',
  'Ciências Contábeis',
  'Farmacêutico',
  'Sem formação acadêmica',
  'Outro'
].map(opcao => ({ value: opcao, label: opcao }));

export const IES_OPTIONS = [
  { value: 'ITH', label: 'ITH - Instituto Health Ith Eireli' },
  { value: 'FAMPER', label: 'FAMPER' },
  { value: 'GRUPO_PPG', label: 'GRUPO PPG - CURSOS' },
  { value: 'PRODUTIVA', label: 'PRODUTIVA CURSOS' },
  { value: 'POS_EXTENSAO', label: 'PÓS/CURSO DE EXTENSÃO' }
];

export const PERCENTUAL_DESCONTO_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '5', label: '5%' },
  { value: '10', label: '10%' },
  { value: '15', label: '15%' },
  { value: '20', label: '20%' },
  { value: '30', label: '30%' },
  { value: '40', label: '40%' },
  { value: 'condicao-especial', label: 'Condição Especial (descreva)' }
];

export const DATA_PRIMEIRO_PAGAMENTO_OPTIONS = [
  { value: 'dia-05', label: 'Dia 05 de cada mês' },
  { value: 'dia-10', label: 'Dia 10 de cada mês' },
  { value: 'dia-15', label: 'Dia 15 de cada mês' },
  { value: 'dia-20', label: 'Dia 20 de cada mês' },
  { value: 'dia-25', label: 'Dia 25 de cada mês' },
  { value: 'outro', label: 'Outro' }
];

export const CARENCIA_PRIMEIRA_COBRANCA_OPTIONS = [
  { value: 'SIM', label: 'SIM' },
  { value: 'NÃO', label: 'NÃO' },
  { value: 'Outro', label: 'Outro' }
];

export const REEMBOLSO_MATRICULA_OPTIONS = [
  { value: 'SIM', label: 'SIM' },
  { value: 'NÃO', label: 'NÃO' }
];

export const INDICACAO_OPTIONS = [
  { value: 'SIM', label: 'SIM' },
  { value: 'NÃO', label: 'NÃO' }
];

export const FORMA_CAPTACAO_OPTIONS = [
  { value: 'INDICAÇÃO', label: 'INDICAÇÃO' },
  { value: 'ORGÂNICO', label: 'ORGÂNICO' },
  { value: 'GOOGLE', label: 'GOOGLE' },
  { value: 'META ADS', label: 'META ADS' },
  { value: 'LINKEDIN', label: 'LINKEDIN' }
];
