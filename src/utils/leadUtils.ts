/**
 * Utility functions for lead data processing
 */

/**
 * Extracts a clean page slug from various URL formats
 * Handles full URLs, direct slugs, decoded components, and redirectors
 */
export const extractPageSlug = (pageName?: string): string | null => {
  if (!pageName || typeof pageName !== 'string') return null;
  
  console.log('🔍 extractPageSlug input:', pageName);
  
  // Decode URL-encoded characters first
  let decoded = pageName;
  try {
    decoded = decodeURIComponent(pageName);
    console.log('✅ Decoded URL:', decoded);
  } catch {
    // If decoding fails, use original
    decoded = pageName;
    console.log('⚠️ Decoding failed, using original');
  }
  
  // Pattern 1: Extract from .com.br/ URLs (most common)
  const comBrMatch = decoded.match(/\.com\.br\/([^?&#]+)/);
  if (comBrMatch) {
    const result = comBrMatch[1].trim();
    console.log('✅ Pattern 1 (.com.br/) match:', result);
    return result;
  }
  
  // Pattern 2: Extract from other .com/ URLs
  const comMatch = decoded.match(/\.com\/([^?&#]+)/);
  if (comMatch) {
    const result = comMatch[1].trim();
    console.log('✅ Pattern 2 (.com/) match:', result);
    return result;
  }
  
  // Pattern 3: Extract from full URLs (https://domain.com/slug)
  const fullUrlMatch = decoded.match(/https?:\/\/[^\/]+\/([^?&#]+)/);
  if (fullUrlMatch) {
    const result = fullUrlMatch[1].trim();
    console.log('✅ Pattern 3 (full URL) match:', result);
    return result;
  }
  
  // Pattern 4: Extract from path-only URLs (/slug or slug)
  const pathMatch = decoded.match(/\/?([^/?&#]+)\/?$/);
  if (pathMatch && pathMatch[1]) {
    const slug = pathMatch[1].trim();
    // Skip common domains or generic terms
    if (!['www', 'http', 'https', 'com', 'br'].includes(slug.toLowerCase())) {
      console.log('✅ Pattern 4 (path-only) match:', slug);
      return slug;
    }
  }
  
  // Pattern 5: If it's already a clean slug (no special chars), return it
  if (/^[a-zA-Z0-9\-_]+$/.test(decoded.trim())) {
    const result = decoded.trim();
    console.log('✅ Pattern 5 (clean slug) match:', result);
    return result;
  }
  
  console.log('❌ No pattern matched for:', pageName);
  return null;
};