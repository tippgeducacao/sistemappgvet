/**
 * Utility functions for lead data processing
 */

export const normalizePageSlug = (pageName?: string): string | null => {
  if (!pageName || typeof pageName !== 'string') {
    console.log('❌ [normalizePageSlug] Input inválido:', pageName);
    return null;
  }
  
  console.log('🔍 [normalizePageSlug] Processando:', pageName);
  
  // Debug específico para mba-gestao-ia
  if (pageName.includes('mba-gestao-ia')) {
    console.log('🎯 🎯 🎯 [FOUND MBA-GESTAO-IA] URL encontrada:', pageName);
  }
  
  // Versão mais simples: extrair sempre o último segmento após barra
  if (pageName.includes('/')) {
    // Remove query parameters e fragments primeiro
    const cleanUrl = pageName.split(/[?&#]/)[0];
    // Pega o último segmento após /
    const segments = cleanUrl.split('/');
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment && lastSegment.length > 0) {
      const slug = lastSegment.trim().toLowerCase();
      console.log('✅ [normalizePageSlug] Extraído slug:', slug, 'de:', pageName);
      
      if (pageName.includes('mba-gestao-ia')) {
        console.log('🎯 🎯 🎯 [MBA-GESTAO-IA] RESULTADO:', slug);
      }
      
      return slug;
    }
  }
  
  // Fallback: usar diretamente se já for um slug
  const slug = pageName.trim().toLowerCase();
  console.log('📝 [normalizePageSlug] Usando direto como slug:', slug);
  return slug;
};

// Teste imediato quando o módulo carrega
console.log('🧪 TESTE IMEDIATO:', normalizePageSlug('https://www.ppgvet.com.br/mba-gestao-ia'));

// Backward compatibility
export const extractPageSlug = normalizePageSlug;