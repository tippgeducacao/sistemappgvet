/**
 * Utility functions for lead data processing
 */

/**
 * Extracts a clean page slug from various URL formats
 * Handles full URLs, direct slugs, decoded components, and redirectors
 */
export const extractPageSlug = (pageName?: string): string | null => {
  if (!pageName || typeof pageName !== 'string') return null;
  
  // Decode URL-encoded characters first
  let decoded = pageName;
  try {
    decoded = decodeURIComponent(pageName);
  } catch {
    // If decoding fails, use original
    decoded = pageName;
  }
  
  // Pattern 1: Extract from .com.br/ URLs (most common)
  const comBrMatch = decoded.match(/\.com\.br\/([^?&#]+)/);
  if (comBrMatch) {
    return comBrMatch[1].trim();
  }
  
  // Pattern 2: Extract from other .com/ URLs
  const comMatch = decoded.match(/\.com\/([^?&#]+)/);
  if (comMatch) {
    return comMatch[1].trim();
  }
  
  // Pattern 3: Extract from full URLs (https://domain.com/slug)
  const fullUrlMatch = decoded.match(/https?:\/\/[^\/]+\/([^?&#]+)/);
  if (fullUrlMatch) {
    return fullUrlMatch[1].trim();
  }
  
  // Pattern 4: Extract from path-only URLs (/slug or slug)
  const pathMatch = decoded.match(/\/?([^/?&#]+)\/?$/);
  if (pathMatch && pathMatch[1]) {
    const slug = pathMatch[1].trim();
    // Skip common domains or generic terms
    if (!['www', 'http', 'https', 'com', 'br'].includes(slug.toLowerCase())) {
      return slug;
    }
  }
  
  // Pattern 5: If it's already a clean slug (no special chars), return it
  if (/^[a-zA-Z0-9\-_]+$/.test(decoded.trim())) {
    return decoded.trim();
  }
  
  return null;
};