
import { supabase } from '@/integrations/supabase/client';

export class VendedorPhotoUploadService {
  static async uploadVendedorPhoto(vendedorId: string, file: File): Promise<string> {
    console.log('📤 Iniciando upload da foto para vendedor:', vendedorId);
    console.log('📁 Arquivo:', file.name, 'Tamanho:', file.size);
    
    this.validateFile(file);
    
    const filePath = this.generateFilePath(vendedorId, file);
    console.log('🗂️ Caminho do arquivo:', filePath);

    await this.removeExistingPhoto(vendedorId);
    
    const photoUrl = await this.performUpload(filePath, file);
    await this.validateUploadedFile(photoUrl);
    
    return photoUrl;
  }

  private static validateFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo deve ser uma imagem');
    }
    
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Arquivo muito grande (máximo 5MB)');
    }
  }

  private static generateFilePath(vendedorId: string, file: File): string {
    const fileExt = file.name.split('.').pop();
    const fileName = `${vendedorId}_${Date.now()}.${fileExt}`;
    return `vendedores/${fileName}`;
  }

  private static async removeExistingPhoto(vendedorId: string): Promise<void> {
    try {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('photo_url')
        .eq('id', vendedorId)
        .single();

      if (currentProfile?.photo_url) {
        await this.deleteFileFromStorage(currentProfile.photo_url);
      }
    } catch (error) {
      console.log('ℹ️ Nenhuma foto anterior para remover ou erro na busca');
    }
  }

  private static async deleteFileFromStorage(photoUrl: string): Promise<void> {
    try {
      const oldUrl = new URL(photoUrl);
      const pathSegments = oldUrl.pathname.split('/');
      const bucketIndex = pathSegments.findIndex(segment => segment === 'vendedor-photos');
      
      if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
        const oldPath = pathSegments.slice(bucketIndex + 1).join('/');
        console.log('🗑️ Removendo foto anterior:', oldPath);
        
        const { error: removeError } = await supabase.storage
          .from('vendedor-photos')
          .remove([oldPath]);
          
        if (removeError) {
          console.log('⚠️ Erro ao remover foto anterior (continuando):', removeError);
        }
      }
    } catch (urlError) {
      console.log('⚠️ Erro ao processar URL anterior (continuando):', urlError);
    }
  }

  private static async performUpload(filePath: string, file: File): Promise<string> {
    console.log('📤 Fazendo upload do arquivo...');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vendedor-photos')
      .upload(filePath, file, { 
        cacheControl: '3600',
        upsert: true 
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError);
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }
    
    console.log('✅ Upload concluído:', uploadData);

    const { data: urlData } = supabase.storage
      .from('vendedor-photos')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Erro ao gerar URL pública do arquivo');
    }

    console.log('🔗 URL pública gerada:', urlData.publicUrl);
    return urlData.publicUrl;
  }

  private static async validateUploadedFile(photoUrl: string): Promise<void> {
    try {
      const response = await fetch(photoUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error('❌ URL não está acessível:', response.status);
        throw new Error('Arquivo uploadado mas não está acessível');
      }
      console.log('✅ URL testada e acessível');
    } catch (fetchError) {
      console.error('❌ Erro ao testar URL:', fetchError);
      throw new Error('Arquivo uploadado mas não está acessível publicamente');
    }
  }
}
