
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export class VendedorPhotoUploadService {
  static async uploadVendedorPhoto(vendedorId: string, file: File): Promise<string> {
    console.log('📤 Iniciando upload de foto para vendedor:', vendedorId);
    console.log('📄 Arquivo:', file.name, file.type, file.size);

    try {
      // Deletar foto anterior se existir
      await this.deleteExistingPhoto(vendedorId);

      // Gerar nome único para o arquivo
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${vendedorId}_${uuidv4()}.${fileExtension}`;
      const filePath = `vendedores/${fileName}`;

      console.log('📁 Caminho do arquivo:', filePath);

      // Upload do arquivo para o storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vendedor-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      console.log('✅ Upload realizado:', uploadData);

      // Obter URL pública da imagem
      const { data: urlData } = supabase.storage
        .from('vendedor-photos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('🔗 URL pública gerada:', publicUrl);

      return publicUrl;

    } catch (error) {
      console.error('💥 Erro durante upload:', error);
      throw error;
    }
  }

  private static async deleteExistingPhoto(vendedorId: string): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('photo_url')
        .eq('id', vendedorId)
        .single();

      if (profile?.photo_url) {
        console.log('🗑️ Removendo foto anterior:', profile.photo_url);
        
        try {
          const url = new URL(profile.photo_url);
          const pathSegments = url.pathname.split('/');
          const bucketIndex = pathSegments.findIndex(segment => segment === 'vendedor-photos');
          
          if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
            const oldFilePath = pathSegments.slice(bucketIndex + 1).join('/');
            
            const { error: removeError } = await supabase.storage
              .from('vendedor-photos')
              .remove([oldFilePath]);
              
            if (removeError) {
              console.error('⚠️ Erro ao deletar foto anterior:', removeError);
            } else {
              console.log('✅ Foto anterior removida');
            }
          }
        } catch (error) {
          console.error('⚠️ Erro ao processar URL da foto anterior:', error);
        }
      }
    } catch (error) {
      console.error('⚠️ Erro ao buscar foto anterior:', error);
    }
  }
}
