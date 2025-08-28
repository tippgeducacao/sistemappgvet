/**
 * Utility functions for lead data processing
 */

export const normalizePageSlug = (pageName?: string): string | null => {
  if (!pageName || typeof pageName !== 'string') return null;
  
  console.log('🔍 [normalizePageSlug] Processando:', pageName);
  
  // Pattern 1: Extract from any https URL - get the last path segment
  const httpsMatch = pageName.match(/https?:\/\/[^\/]+\/(.+)/);
  if (httpsMatch) {
    const fullPath = httpsMatch[1];
    // Remove query parameters and fragments, then get the last segment
    const cleanPath = fullPath.split(/[?&#]/)[0];
    const segments = cleanPath.split('/').filter(segment => segment.length > 0);
    if (segments.length > 0) {
      const slug = segments[segments.length - 1].trim().toLowerCase();
      console.log('✅ [normalizePageSlug] URL match - last segment:', slug);
      return slug;
    }
  }
  
  // Pattern 2: Direct slug without domain (fallback)
  const directSlugMatch = pageName.match(/^([a-zA-Z0-9\-_.]+)$/);
  if (directSlugMatch) {
    const slug = directSlugMatch[1].trim().toLowerCase();
    console.log('✅ [normalizePageSlug] direct slug match:', slug);
    return slug;
  }
  
  console.log('❌ [normalizePageSlug] No match found for:', pageName);
  return null;
};

// Backward compatibility
export const extractPageSlug = normalizePageSlug;

// Testes para validação
console.log('🧪 TESTE normalizePageSlug:');
console.log('Test 1:', normalizePageSlug('https://www.ppgvet.com.br/aula-gratuita-clinica-25ago'));
console.log('Test 2:', normalizePageSlug('https://ppgvet.com.br/aula-gratuita-clinica-25ago'));
console.log('Test 3:', normalizePageSlug('https://www.ppgvet.com.br/sanidade-avicola'));
console.log('Test 4:', normalizePageSlug('https://www.ppgvet.com.br/mba-gestao-ia'));
console.log('Test 5:', normalizePageSlug('mba-gestao-ia')); // Direct slug test