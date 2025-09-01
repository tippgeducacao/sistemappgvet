/**
 * Utility functions for lead data processing
 */

export const normalizePageSlug = (pageName?: string): string | null => {
  if (!pageName || typeof pageName !== 'string') {
    return null;
  }
  
  const original = pageName.trim();
  if (!original) return null;
  
  // Se contém protocolo HTTP/HTTPS, é uma URL
  if (original.match(/^https?:\/\//)) {
    try {
      const url = new URL(original);
      const pathname = url.pathname;
      
      // Ignorar domínios genéricos sem path específico
      if (pathname === '/' || pathname === '') {
        return null;
      }
      
      // Extrair o último segmento significativo do path
      const segments = pathname.split('/').filter(segment => segment.length > 0);
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        // Verificar se não é um arquivo (.html, .php, etc)
        if (lastSegment.includes('.')) {
          const nameWithoutExt = lastSegment.split('.')[0];
          return nameWithoutExt.toLowerCase();
        }
        return lastSegment.toLowerCase();
      }
    } catch (error) {
      // Se falhar ao processar como URL, tratar como texto
    }
  }
  
  // Se contém barra mas não é URL completa
  if (original.includes('/')) {
    const segments = original.split('/').filter(segment => segment.trim().length > 0);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      return convertToSlug(lastSegment);
    }
  }
  
  // Converter texto normal para slug
  return convertToSlug(original);
};

// Função auxiliar para converter texto em slug
const convertToSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    // Remove acentos
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // Substitui espaços e caracteres especiais por hífen
    .replace(/[^a-z0-9]+/g, '-')
    // Remove hífens no início e fim
    .replace(/^-+|-+$/g, '')
    // Remove hífens duplos
    .replace(/-+/g, '-');
};

// Backward compatibility
export const extractPageSlug = normalizePageSlug;