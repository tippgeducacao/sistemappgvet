/**
 * Utility functions for geographic data normalization
 * Handles Brazilian state (UF) extraction and normalization
 */

// Map of Brazilian state names to UF codes
const STATE_NAME_TO_UF: Record<string, string> = {
  'acre': 'AC',
  'alagoas': 'AL',
  'amapa': 'AP',
  'amazonas': 'AM',
  'bahia': 'BA',
  'ceara': 'CE',
  'distritofederal': 'DF',
  'distrito federal': 'DF',
  'espiritosanto': 'ES',
  'goias': 'GO',
  'maranhao': 'MA',
  'matogrosso': 'MT',
  'matogrossodosul': 'MS',
  'minasgerais': 'MG',
  'para': 'PA',
  'paraiba': 'PB',
  'parana': 'PR',
  'pernambuco': 'PE',
  'piaui': 'PI',
  'riodejaneiro': 'RJ',
  'riograndedonorte': 'RN',
  'riograndedosul': 'RS',
  'rondonia': 'RO',
  'roraima': 'RR',
  'santacatarina': 'SC',
  'saopaulo': 'SP',
  'sergipe': 'SE',
  'tocantins': 'TO',
};

// Valid Brazilian UF codes
const VALID_UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]);

/**
 * Normalizes a region string to a valid Brazilian UF code
 * Handles formats like: "Cidade, UF", "Cidade - UF", "UF", "Nome do Estado", etc.
 * @param regiao - The region string to normalize
 * @returns The normalized UF code (e.g., "SP", "RJ") or null if not identifiable
 */
export const normalizeEstado = (regiao?: string): string | null => {
  if (!regiao || typeof regiao !== 'string') {
    return null;
  }

  // Remove extra spaces and normalize
  let normalized = regiao.trim();
  
  // Remove content in parentheses
  normalized = normalized.replace(/\([^)]*\)/g, '');
  
  // Try to extract from common formats: "Cidade, UF", "Cidade - UF", "Cidade/UF"
  const separators = [',', '-', '/'];
  for (const sep of separators) {
    if (normalized.includes(sep)) {
      const parts = normalized.split(sep);
      const lastPart = parts[parts.length - 1].trim().toUpperCase();
      
      // Check if last part is a valid UF (2 letters)
      if (lastPart.length === 2 && VALID_UFS.has(lastPart)) {
        return lastPart;
      }
    }
  }
  
  // Try as direct UF code
  const directUF = normalized.toUpperCase().trim();
  if (directUF.length === 2 && VALID_UFS.has(directUF)) {
    return directUF;
  }
  
  // Try to match by state name
  const cleanedName = normalized
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z\s]/g, '') // Remove non-letters
    .replace(/\s+/g, ''); // Remove spaces
  
  if (STATE_NAME_TO_UF[cleanedName]) {
    return STATE_NAME_TO_UF[cleanedName];
  }
  
  // Try to match partial state name (last word)
  const words = normalized.toLowerCase().split(/\s+/);
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '');
    
    if (STATE_NAME_TO_UF[word]) {
      return STATE_NAME_TO_UF[word];
    }
  }
  
  return null;
};
