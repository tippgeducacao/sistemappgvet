import { format } from 'date-fns';

/**
 * Utilitários para lidar com filtros de usuários inativos baseados na data de inativação
 */

export interface UserProfile {
  id: string;
  ativo: boolean;
  inativado_em?: string | null;
  [key: string]: any;
}

/**
 * Filtra usuários considerando a data de inativação
 * @param users - Lista de usuários
 * @param filterDate - Data de referência para o filtro (opcional, usa data atual se não fornecida)
 * @returns Lista filtrada de usuários
 */
export const filterUsersByInactivationDate = <T extends UserProfile>(
  users: T[], 
  filterDate?: Date
): T[] => {
  const refDate = filterDate || new Date();
  
  return users.filter(user => {
    // Se o usuário está ativo, sempre incluir
    if (user.ativo) {
      return true;
    }
    
    // Se o usuário está inativo, verificar a data de inativação
    if (!user.inativado_em) {
      // Se não tem data de inativação, foi marcado como inativo antes da implementação
      // Consideramos que foi inativado no início do mês atual
      const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      return refDate >= currentMonthStart;
    }
    
    // Se tem data de inativação, verificar se a data de referência é anterior
    const inactivationDate = new Date(user.inativado_em);
    return refDate <= inactivationDate;
  });
};

/**
 * Gera condições SQL para filtrar usuários por data de inativação
 * @param filterDate - Data de referência para o filtro
 * @param tableAlias - Alias da tabela (opcional, default 'profiles')
 * @returns Objeto com as condições SQL para usar no Supabase
 */
export const getUserInactivationFilter = (filterDate?: Date, tableAlias = 'profiles') => {
  const refDate = filterDate || new Date();
  const refDateISO = refDate.toISOString();
  const currentMonthStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1).toISOString();
  
  return {
    // Para usuários ativos: sempre incluir
    activeFilter: `${tableAlias}.ativo.eq.true`,
    // Para usuários inativos: só incluir se foram inativados após a data de referência
    inactiveFilter: `and(${tableAlias}.ativo.eq.false,or(${tableAlias}.inativado_em.is.null,${tableAlias}.inativado_em.gte.${refDateISO}))`,
    // Filtro completo combinado
    combinedFilter: `or(${tableAlias}.ativo.eq.true,and(${tableAlias}.ativo.eq.false,or(${tableAlias}.inativado_em.is.null,${tableAlias}.inativado_em.gte.${refDateISO})))`
  };
};

/**
 * Verifica se um usuário deve aparecer nos dados baseado na data de inativação
 * @param user - Usuário para verificar
 * @param referenceDate - Data de referência (opcional)
 * @returns true se o usuário deve aparecer nos dados
 */
export const shouldUserAppearInData = <T extends UserProfile>(user: T, referenceDate?: Date): boolean => {
  const refDate = referenceDate || new Date();
  
  // Se está ativo, sempre aparece
  if (user.ativo) {
    return true;
  }
  
  // Se está inativo, verificar data de inativação
  if (!user.inativado_em) {
    // Sem data de inativação = inativo desde início do mês atual
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return refDate >= currentMonthStart;
  }
  
  // Com data de inativação, verificar se a referência é anterior
  const inactivationDate = new Date(user.inativado_em);
  return refDate <= inactivationDate;
};

/**
 * Adiciona filtros de inativação a uma query do Supabase
 * @param query - Query do Supabase
 * @param referenceDate - Data de referência para o filtro
 * @returns Query modificada com os filtros
 */
export const addInactivationFiltersToQuery = (query: any, referenceDate?: Date) => {
  const refDate = referenceDate || new Date();
  const refDateISO = refDate.toISOString();
  
  // Filtro: usuários ativos OU usuários inativos que foram inativados após a data de referência
  return query.or(
    'ativo.eq.true,and(ativo.eq.false,or(inativado_em.is.null,inativado_em.gte.' + refDateISO + '))'
  );
};