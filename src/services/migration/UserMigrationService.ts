import { supabase } from '@/integrations/supabase/client';

export interface MigrationResult {
  success: boolean;
  migratedUsers: number;
  errors: string[];
}

export class UserMigrationService {
  /**
   * Migra usuários do sistema antigo (IDs de cursos) para o novo sistema (IDs de grupos)
   */
  static async migrateUsersToGroups(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedUsers: 0,
      errors: []
    };

    try {
      console.log('🔄 Iniciando migração de usuários para sistema de grupos...');

      // 1. Buscar mapeamento curso -> grupo
      const { data: courseMappings, error: mappingError } = await supabase
        .from('grupos_pos_graduacoes_cursos')
        .select('curso_id, grupo_id');

      if (mappingError) {
        result.errors.push(`Erro ao buscar mapeamentos: ${mappingError.message}`);
        return result;
      }

      // Criar mapa curso_id -> grupo_id
      const courseToGroupMap = new Map<string, string>();
      courseMappings?.forEach(mapping => {
        courseToGroupMap.set(mapping.curso_id, mapping.grupo_id);
      });

      // 2. Buscar usuários com pós-graduações
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, pos_graduacoes')
        .not('pos_graduacoes', 'is', null);

      if (usersError) {
        result.errors.push(`Erro ao buscar usuários: ${usersError.message}`);
        return result;
      }

      if (!users || users.length === 0) {
        console.log('✅ Nenhum usuário encontrado para migração');
        result.success = true;
        return result;
      }

      // 3. Processar cada usuário
      for (const user of users) {
        try {
          const userCourseIds = user.pos_graduacoes || [];
          
          // Verificar se são IDs de cursos (se pelo menos um ID corresponde a um curso no mapeamento)
          const hasCourseIds = userCourseIds.some((id: string) => courseToGroupMap.has(id));
          
          if (!hasCourseIds) {
            console.log(`⏭️ Usuário ${user.name} já está no sistema de grupos`);
            continue;
          }

          // Mapear cursos para grupos
          const groupIds = new Set<string>();
          
          userCourseIds.forEach((courseId: string) => {
            const groupId = courseToGroupMap.get(courseId);
            if (groupId) {
              groupIds.add(groupId);
            }
          });

          const uniqueGroupIds = Array.from(groupIds);

          // Verificar limite de 10 grupos
          if (uniqueGroupIds.length > 10) {
            console.warn(`⚠️ Usuário ${user.name} tem ${uniqueGroupIds.length} grupos. Limitando a 10.`);
            uniqueGroupIds.splice(10); // Manter apenas os primeiros 10
          }

          // Atualizar usuário
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ pos_graduacoes: uniqueGroupIds })
            .eq('id', user.id);

          if (updateError) {
            result.errors.push(`Erro ao atualizar usuário ${user.name}: ${updateError.message}`);
            continue;
          }

          console.log(`✅ Usuário ${user.name} migrado: ${userCourseIds.length} cursos → ${uniqueGroupIds.length} grupos`);
          result.migratedUsers++;

        } catch (userError) {
          const errorMsg = `Erro ao processar usuário ${user.name}: ${userError}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      result.success = result.errors.length === 0;
      console.log(`🎉 Migração concluída: ${result.migratedUsers} usuários migrados`);
      
      if (result.errors.length > 0) {
        console.error('❌ Erros durante migração:', result.errors);
      }

    } catch (error) {
      const errorMsg = `Erro geral na migração: ${error}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
    }

    return result;
  }

  /**
   * Verifica quantos usuários precisam ser migrados
   */
  static async checkMigrationNeeded(): Promise<{ usersToMigrate: number; details: Array<{ name: string; courseCount: number }> }> {
    try {
      // Buscar mapeamento curso -> grupo
      const { data: courseMappings } = await supabase
        .from('grupos_pos_graduacoes_cursos')
        .select('curso_id');

      const courseIds = new Set(courseMappings?.map(m => m.curso_id) || []);

      // Buscar usuários com pós-graduações
      const { data: users } = await supabase
        .from('profiles')
        .select('id, name, pos_graduacoes')
        .not('pos_graduacoes', 'is', null);

      const usersToMigrate = users?.filter(user => {
        const userCourseIds = user.pos_graduacoes || [];
        return userCourseIds.some((id: string) => courseIds.has(id));
      }) || [];

      return {
        usersToMigrate: usersToMigrate.length,
        details: usersToMigrate.map(user => ({
          name: user.name,
          courseCount: user.pos_graduacoes?.length || 0
        }))
      };

    } catch (error) {
      console.error('Erro ao verificar migração:', error);
      return { usersToMigrate: 0, details: [] };
    }
  }
}