
import { supabase } from '@/integrations/supabase/client';

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: any;
}

export interface ImageFile {
  name: string;
  path: string;
  url: string;
  fullPath: string;
}

export class StorageListService {
  /**
   * Lista todos os arquivos de uma pasta específica no bucket
   * @param bucketName Nome do bucket (ex: 'documentos-vendas')
   * @param folderPath Caminho da pasta (ex: 'vendedor-id/form-id' ou '' para raiz)
   * @param options Opções de listagem
   */
  static async listFiles(
    bucketName: string, 
    folderPath: string = '', 
    options: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
      search?: string;
    } = {}
  ): Promise<StorageFile[]> {
    try {
      console.log('📋 Listando arquivos do bucket:', {
        bucketName,
        folderPath,
        options
      });

      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folderPath, {
          limit: options.limit || 1000,
          offset: options.offset || 0,
          sortBy: options.sortBy || { column: 'created_at', order: 'desc' },
          search: options.search
        });

      if (error) {
        console.error('❌ Erro ao listar arquivos:', error);
        throw error;
      }

      console.log('✅ Arquivos encontrados:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('💥 Erro no StorageListService:', error);
      throw error;
    }
  }

  /**
   * Lista apenas arquivos de imagem (PNG, JPG, JPEG) de uma pasta
   * @param bucketName Nome do bucket
   * @param folderPath Caminho da pasta
   */
  static async listImageFiles(
    bucketName: string, 
    folderPath: string = ''
  ): Promise<ImageFile[]> {
    try {
      const files = await this.listFiles(bucketName, folderPath);
      
      // Filtrar apenas imagens
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
      const imageFiles = files.filter(file => 
        imageExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        )
      );

      console.log('🖼️ Imagens encontradas:', imageFiles.length);

      // Gerar URLs públicas para cada imagem
      const imagesWithUrls: ImageFile[] = imageFiles.map(file => {
        const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fullPath);

        return {
          name: file.name,
          path: folderPath,
          fullPath,
          url: urlData.publicUrl
        };
      });

      console.log('🔗 URLs geradas:', imagesWithUrls.length);
      return imagesWithUrls;

    } catch (error) {
      console.error('💥 Erro ao listar imagens:', error);
      throw error;
    }
  }

  /**
   * Lista arquivos de múltiplas pastas
   * @param bucketName Nome do bucket
   * @param folderPaths Array de caminhos de pastas
   */
  static async listImagesFromMultipleFolders(
    bucketName: string,
    folderPaths: string[]
  ): Promise<{ [folder: string]: ImageFile[] }> {
    try {
      const results: { [folder: string]: ImageFile[] } = {};

      for (const folderPath of folderPaths) {
        console.log(`📂 Processando pasta: ${folderPath}`);
        try {
          results[folderPath] = await this.listImageFiles(bucketName, folderPath);
        } catch (error) {
          console.error(`❌ Erro na pasta ${folderPath}:`, error);
          results[folderPath] = [];
        }
      }

      return results;
    } catch (error) {
      console.error('💥 Erro ao listar múltiplas pastas:', error);
      throw error;
    }
  }

  /**
   * Busca arquivos por padrão no nome
   * @param bucketName Nome do bucket
   * @param searchPattern Padrão de busca (ex: 'vendedor-123')
   * @param folderPath Pasta específica ou '' para buscar em todas
   */
  static async searchFiles(
    bucketName: string,
    searchPattern: string,
    folderPath: string = ''
  ): Promise<StorageFile[]> {
    try {
      console.log('🔍 Buscando arquivos com padrão:', searchPattern);
      
      const files = await this.listFiles(bucketName, folderPath, {
        search: searchPattern
      });

      const matchingFiles = files.filter(file => 
        file.name.includes(searchPattern)
      );

      console.log('✅ Arquivos encontrados:', matchingFiles.length);
      return matchingFiles;

    } catch (error) {
      console.error('💥 Erro na busca:', error);
      throw error;
    }
  }
}
