/**
 * Utility functions for lead data processing
 */

export const extractPageSlug = (pageName?: string): string | null => {
  if (!pageName || typeof pageName !== 'string') return null;
  
  // Armazenar entrada para debug apenas em casos específicos
  const isAulaGratuita = pageName.includes('aula-gratuita');
  if (isAulaGratuita) {
    console.log('🔍 [EXTRACT] Input:', pageName);
  }
  
  // Decode URL-encoded characters first
  let decoded = pageName;
  try {
    decoded = decodeURIComponent(pageName);
  } catch {
    decoded = pageName;
  }
  
  // Pattern 1: Extract from .com.br/ URLs (most common)
  const comBrMatch = decoded.match(/\.com\.br\/([^?&#]+)/);
  if (comBrMatch) {
    const result = comBrMatch[1].trim();
    if (isAulaGratuita) {
      console.log('✅ [EXTRACT] .com.br match:', result);
    }
    return result;
  }
  
  // Pattern 2: Extract from other .com/ URLs
  const comMatch = decoded.match(/\.com\/([^?&#]+)/);
  if (comMatch) {
    const result = comMatch[1].trim();
    if (isAulaGratuita) {
      console.log('✅ [EXTRACT] .com match:', result);
    }
    return result;
  }
  
  // Pattern 3: Extract from full URLs (https://domain.com/slug)
  const fullUrlMatch = decoded.match(/https?:\/\/[^\/]+\/([^?&#]+)/);
  if (fullUrlMatch) {
    const result = fullUrlMatch[1].trim();
    if (isAulaGratuita) {
      console.log('✅ [EXTRACT] full URL match:', result);
    }
    return result;
  }
  
  // Pattern 4: Extract from path-only URLs (/slug or slug)
  const pathMatch = decoded.match(/\/?([^/?&#]+)\/?$/);
  if (pathMatch && pathMatch[1]) {
    const slug = pathMatch[1].trim();
    // Skip common domains or generic terms
    if (!['www', 'http', 'https', 'com', 'br'].includes(slug.toLowerCase())) {
      if (isAulaGratuita) {
        console.log('✅ [EXTRACT] path match:', slug);
      }
      return slug;
    }
  }
  
  // Pattern 5: If it's already a clean slug (no special chars), return it
  if (/^[a-zA-Z0-9\-_]+$/.test(decoded.trim())) {
    const result = decoded.trim();
    if (isAulaGratuita) {
      console.log('✅ [EXTRACT] clean slug match:', result);
    }
    return result;
  }
  
  if (isAulaGratuita) {
    console.log('❌ [EXTRACT] No match for:', pageName);
  }
  return null;
};