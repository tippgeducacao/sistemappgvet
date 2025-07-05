
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StorageListService, ImageFile } from '@/services/storage/StorageListService';

interface UseStorageImagesProps {
  bucketName: string;
  folderPath?: string;
  autoLoad?: boolean;
}

interface UseStorageImagesReturn {
  images: ImageFile[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  searchByPattern: (pattern: string) => Promise<ImageFile[]>;
}

export const useStorageImages = ({
  bucketName,
  folderPath = '',
  autoLoad = true
}: UseStorageImagesProps): UseStorageImagesReturn => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    if (!bucketName) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Hook: Carregando imagens para:', { bucketName, folderPath });
      
      const imageFiles = await StorageListService.listImageFiles(bucketName, folderPath);
      setImages(imageFiles);
      
      console.log('✅ Hook: Imagens carregadas:', imageFiles.length);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Hook: Erro ao carregar imagens:', err);
    } finally {
      setIsLoading(false);
    }
  }, [bucketName, folderPath]);

  const searchByPattern = useCallback(async (pattern: string): Promise<ImageFile[]> => {
    try {
      console.log('🔍 Hook: Buscando por padrão:', pattern);
      
      const files = await StorageListService.searchFiles(bucketName, pattern, folderPath);
      
      // Filtrar apenas imagens e gerar URLs
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
      const imageFiles = files.filter(file => 
        imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      );

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

      console.log('🔍 Imagens encontradas:', imagesWithUrls.length);
      return imagesWithUrls;
      
    } catch (err) {
      console.error('❌ Erro na busca por padrão:', err);
      throw err;
    }
  }, [bucketName, folderPath]);

  useEffect(() => {
    if (autoLoad) {
      loadImages();
    }
  }, [loadImages, autoLoad]);

  return {
    images,
    isLoading,
    error,
    refetch: loadImages,
    searchByPattern
  };
};
