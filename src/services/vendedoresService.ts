
import { supabase } from '@/integrations/supabase/client';
import { VendedorCadastroService } from './vendedores/VendedorCadastroService';
import { filterUsersByInactivationDate, type UserProfile } from '@/utils/userInactivationUtils';

export interface Vendedor extends UserProfile {
  name: string;
  email: string;
  user_type: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  nivel?: string;
  pos_graduacoes?: string[] | null;
  horario_trabalho?: any;
}

export class VendedoresService {
  static async fetchVendedores(referenceDate?: Date): Promise<Vendedor[]> {
    try {
      console.log('🔍 Buscando usuários considerando data de inativação...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_type', ['vendedor', 'admin', 'sdr', 'supervisor'])
        .order('name');

      if (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        throw new Error(`Erro ao buscar usuários: ${error.message}`);
      }

      // Filtrar usuários baseado na data de inativação
      const filteredData = filterUsersByInactivationDate(data || [], referenceDate);

      console.log('✅ Usuários encontrados (antes do filtro):', data?.length || 0);
      console.log('✅ Usuários válidos (após filtro de inativação):', filteredData.length);
      return filteredData.map(item => ({
        ...item,
        nivel: item.nivel as 'junior' | 'pleno' | 'senior'
      })) as Vendedor[];
      
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar usuários:', error);
      throw error;
    }
  }

  static async createVendedor(vendedorData: {
    name: string;
    email: string;
    password: string;
    userType: string;
    nivel?: string;
  }): Promise<void> {
    try {
      console.log('👤 Criando novo usuário:', vendedorData.email, 'tipo:', vendedorData.userType);
      
      // Verificar se o usuário atual tem permissão para criar usuários (apenas diretores)
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', currentUser.user.id)
        .single();

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.user.id);

      const isDiretor = roles?.some(r => r.role === 'diretor') || profile?.user_type === 'diretor';
      
      if (!isDiretor) {
        throw new Error('Você não tem permissão para criar usuários. Apenas diretores podem realizar esta ação.');
      }
      
      // Primeiro, criar o usuário usando o serviço de cadastro
      const newUserId = await VendedorCadastroService.cadastrarVendedor(
        vendedorData.email,
        vendedorData.password,
        vendedorData.name,
        vendedorData.userType,
        vendedorData.nivel
      );
      
      // Depois, criar a role no contexto do diretor (apenas para admin)
      if (vendedorData.userType === 'admin') {
        console.log('🔧 Criando role para usuário no contexto do diretor:', { userType: vendedorData.userType, userId: newUserId });
        
        const { error: roleCreateError } = await supabase
          .from('user_roles')
          .insert({
            user_id: newUserId,
            role: vendedorData.userType as 'admin',
            created_by: currentUser.user.id
          });

        if (roleCreateError) {
          console.error('❌ Erro ao criar role:', roleCreateError);
          throw new Error(`Erro ao criar role: ${roleCreateError.message}`);
        } else {
          console.log('✅ Role criada no contexto do diretor:', vendedorData.userType);
        }
      }
      
      console.log('✅ Usuário criado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }
  }

  static async uploadVendedorPhoto(vendedorId: string, file: File): Promise<string> {
    try {
      console.log('📤 Iniciando upload de foto para vendedor:', vendedorId);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${vendedorId}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('📁 Caminho do arquivo:', filePath);

      // Upload do arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vendedor-photos')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      console.log('✅ Upload realizado:', uploadData.path);

      // Gerar URL pública
      const { data: urlData } = supabase.storage
        .from('vendedor-photos')
        .getPublicUrl(filePath);

      // Adicionar timestamp para evitar cache
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      console.log('🔗 URL pública gerada:', publicUrl);

      return publicUrl;

    } catch (error) {
      console.error('❌ Erro no upload da foto:', error);
      throw error;
    }
  }

  static async updateVendedorPhoto(vendedorId: string, photoUrl: string): Promise<void> {
    try {
      console.log('🔄 Atualizando URL da foto no perfil:', vendedorId);
      console.log('🔗 Nova URL a ser salva:', photoUrl);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          photo_url: photoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendedorId)
        .select();

      if (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      }

      console.log('✅ Resposta do banco de dados:', data);
      console.log('✅ Foto atualizada no perfil com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao atualizar foto do vendedor:', error);
      throw error;
    }
  }

  static async removeVendedorPhoto(vendedorId: string): Promise<void> {
    try {
      console.log('🗑️ Removendo foto do vendedor:', vendedorId);
      
      // Buscar a foto atual
      const { data: profile } = await supabase
        .from('profiles')
        .select('photo_url')
        .eq('id', vendedorId)
        .single();

      if (profile?.photo_url) {
        // Extrair o nome do arquivo da URL
        const fileName = profile.photo_url.split('/').pop();
        
        if (fileName) {
          // Remover arquivo do storage
          const { error: deleteError } = await supabase.storage
            .from('vendedor-photos')
            .remove([fileName]);

          if (deleteError) {
            console.warn('⚠️ Erro ao remover arquivo do storage:', deleteError);
          } else {
            console.log('✅ Arquivo removido do storage:', fileName);
          }
        }
      }

      // Remover URL do perfil
      const { error } = await supabase
        .from('profiles')
        .update({ 
          photo_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendedorId);

      if (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      }

      console.log('✅ Foto removida do perfil');
      
    } catch (error) {
      console.error('❌ Erro ao remover foto:', error);
      throw error;
    }
  }

  static async toggleUserStatus(userId: string, ativo: boolean): Promise<void> {
    try {
      console.log(`🔄 ${ativo ? 'Ativando' : 'Desativando'} usuário:`, userId);
      
      // Verificar permissão (apenas diretores)
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', currentUser.user.id)
        .single();

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.user.id);

      const isDiretor = roles?.some(r => r.role === 'diretor') || profile?.user_type === 'diretor';
      
      if (!isDiretor) {
        throw new Error('Apenas diretores podem ativar/desativar usuários.');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          ativo,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao atualizar status do usuário:', error);
        throw new Error(`Erro ao atualizar status do usuário: ${error.message}`);
      }

      console.log(`✅ Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`);
      
    } catch (error) {
      console.error('❌ Erro ao alterar status do usuário:', error);
      throw error;
    }
  }

  static async fetchAllUsers(): Promise<Vendedor[]> {
    try {
      console.log('🔍 Buscando todos os usuários (ativos e inativos)...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_type', ['vendedor', 'admin', 'sdr', 'supervisor'])
        .order('name');

      if (error) {
        console.error('❌ Erro ao buscar todos os usuários:', error);
        throw new Error(`Erro ao buscar usuários: ${error.message}`);
      }

      console.log('✅ Todos os usuários encontrados:', data?.length || 0);
      return (data || []).map(item => ({
        ...item,
        nivel: item.nivel as 'junior' | 'pleno' | 'senior'
      }));
      
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar todos os usuários:', error);
      throw error;
    }
  }

  static async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      console.log('🔐 Resetando senha do usuário:', userId);
      
      // Validar nova senha
      if (!newPassword || newPassword.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres');
      }

      // Chamar a edge function para resetar senha
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('https://lrpyxyhhqfzozrkklxwu.supabase.co/functions/v1/reset-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao resetar senha');
      }

      console.log('✅ Senha resetada com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao resetar senha:', error);
      throw error;
    }
  }
}
