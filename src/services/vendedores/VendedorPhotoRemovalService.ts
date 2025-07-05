
import { supabase } from '@/integrations/supabase/client';

export class VendedorPhotoRemovalService {
  static async removeVendedorPhoto(vendedorId: string): Promise<void> {
    console.log('🗑️ Removendo foto do vendedor:', vendedorId);
    
    await this.deletePhotoFromStorage(vendedorId);
    await this.updateProfilePhotoUrl(vendedorId);
    
    console.log('✅ Foto removida com sucesso');
  }

  private static async deletePhotoFromStorage(vendedorId: string): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('photo_url')
      .eq('id', vendedorId)
      .single();

    if (profile?.photo_url) {
      try {
        const url = new URL(profile.photo_url);
        const pathSegments = url.pathname.split('/');
        const bucketIndex = pathSegments.findIndex(segment => segment === 'vendedor-photos');
        
        if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
          const filePath = pathSegments.slice(bucketIndex + 1).join('/');
          
          console.log('🗂️ Deletando arquivo:', filePath);
          
          const { error: removeError } = await supabase.storage
            .from('vendedor-photos')
            .remove([filePath]);
            
          if (removeError) {
            console.error('⚠️ Erro ao deletar arquivo:', removeError);
          }
        }
      } catch (error) {
        console.error('⚠️ Erro ao processar URL da foto:', error);
      }
    }
  }

  private static async updateProfilePhotoUrl(vendedorId: string): Promise<void> {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photo_url: null })
      .eq('id', vendedorId);

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError);
      throw updateError;
    }
  }
}
