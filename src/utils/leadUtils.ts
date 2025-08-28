/**
 * Utility functions for lead data processing
 */

export const normalizePageSlug = (pageName?: string): string | null => {
  if (!pageName || typeof pageName !== 'string') return null;
  
  console.log('🔍 [normalizePageSlug] Processando:', pageName);
  
  // Pattern 1: Extract from .com.br/ URLs (most common)
  const comBrMatch = pageName.match(/\.com\.br\/([^?&#\s]+)/);
  if (comBrMatch) {
    const slug = comBrMatch[1].trim().toLowerCase();
    console.log('✅ [normalizePageSlug] .com.br match:', slug);
    return slug;
  }
  
  // Pattern 2: Extract from other .com/ URLs  
  const comMatch = pageName.match(/\.com\/([^?&#\s]+)/);
  if (comMatch) {
    const slug = comMatch[1].trim().toLowerCase();
    console.log('✅ [normalizePageSlug] .com match:', slug);
    return slug;
  }
  
  // Pattern 3: Extract from full URLs with other domains
  const fullUrlMatch = pageName.match(/https?:\/\/[^\/]+\/([^?&#\s]+)/);
  if (fullUrlMatch) {
    const slug = fullUrlMatch[1].trim().toLowerCase();
    console.log('✅ [normalizePageSlug] full URL match:', slug);
    return slug;
  }
  
  // Pattern 4: Direct slug without domain (fallback)
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