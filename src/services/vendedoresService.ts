
import { supabase } from '@/integrations/supabase/client';
import { VendedorCadastroService } from './vendedores/VendedorCadastroService';

export interface Vendedor {
  id: string;
  name: string;
  email: string;
  user_type: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export class VendedoresService {
  static async fetchVendedores(): Promise<Vendedor[]> {
    try {
      console.log('🔍 Buscando vendedores...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'vendedor')
        .order('name');

      if (error) {
        console.error('❌ Erro ao buscar vendedores:', error);
        throw new Error(`Erro ao buscar vendedores: ${error.message}`);
      }

      console.log('✅ Vendedores encontrados:', data?.length || 0);
      return data || [];
      
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar vendedores:', error);
      throw error;
    }
  }

  static async createVendedor(vendedorData: {
    name: string;
    email: string;
    password: string;
  }): Promise<void> {
    try {
      console.log('👤 Criando novo vendedor:', vendedorData.email);
      
      // Verificar se o usuário atual tem permissão para criar vendedores
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

      const hasAdminRole = roles?.some(r => ['admin', 'secretaria', 'diretor'].includes(r.role));
      const isAdminByProfile = profile?.user_type === 'secretaria';
      
      if (!hasAdminRole && !isAdminByProfile) {
        throw new Error('Você não tem permissão para criar vendedores. Apenas administradores podem realizar esta ação.');
      }
      
      // Usar o serviço de cadastro que não afeta a sessão atual
      await VendedorCadastroService.cadastrarVendedor(
        vendedorData.email,
        vendedorData.password,
        vendedorData.name
      );
      
      console.log('✅ Vendedor criado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao criar vendedor:', error);
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
}
