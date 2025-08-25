/**
 * Utility functions for lead data processing
 */

export const extractPageSlug = (pageName?: string): string | null => {
  if (!pageName || typeof pageName !== 'string') return null;
  
  // Pattern 1: Extract from .com.br/ URLs (most common)
  const comBrMatch = pageName.match(/\.com\.br\/([^?&#]+)/);
  if (comBrMatch) {
    return comBrMatch[1].trim();
  }
  
  // Pattern 2: Extract from other .com/ URLs  
  const comMatch = pageName.match(/\.com\/([^?&#]+)/);
  if (comMatch) {
    return comMatch[1].trim();
  }
  
  // Pattern 3: Extract from full URLs
  const fullUrlMatch = pageName.match(/https?:\/\/[^\/]+\/([^?&#]+)/);
  if (fullUrlMatch) {
    return fullUrlMatch[1].trim();
  }
  
  return null;
};