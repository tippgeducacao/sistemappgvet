
import { supabase } from '@/integrations/supabase/client';

export class VendedorProfileUpdateService {
  static async updateVendedorPhoto(vendedorId: string, photoUrl: string): Promise<void> {
    console.log('📝 Atualizando foto do vendedor:', vendedorId);
    console.log('🔗 Nova URL:', photoUrl);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ photo_url: photoUrl })
      .eq('id', vendedorId)
      .select();

    if (error) {
      console.error('❌ Erro ao atualizar foto do vendedor:', error);
      
      if (error.code === 'PGRST116' || error.message.includes('RLS') || error.message.includes('policy')) {
        throw new Error(`Erro de permissão: Apenas administradores, secretárias e diretores podem alterar fotos de perfil de usuários.`);
      }
      
      throw new Error(`Erro ao salvar foto: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Nenhuma linha foi atualizada. Verifique se você tem permissão para editar este vendedor.');
    }
    
    console.log('✅ Foto atualizada com sucesso');
  }
}
