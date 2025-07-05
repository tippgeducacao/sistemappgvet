
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Image as ImageIcon, Download, ExternalLink } from 'lucide-react';
import { StorageListService, ImageFile } from '@/services/storage/StorageListService';
import { useToast } from '@/components/ui/use-toast';

interface ImageGalleryProps {
  bucketName: string;
  folderPath?: string;
  title?: string;
  showDownload?: boolean;
  showExternalLink?: boolean;
  maxImages?: number;
  gridCols?: 2 | 3 | 4;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  bucketName,
  folderPath = '',
  title = 'Galeria de Imagens',
  showDownload = true,
  showExternalLink = true,
  maxImages,
  gridCols = 3
}) => {
  const { toast } = useToast();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImages = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🖼️ Carregando imagens para:', { bucketName, folderPath });
      
      const imageFiles = await StorageListService.listImageFiles(bucketName, folderPath);
      
      // Limitar número de imagens se especificado
      const finalImages = maxImages ? imageFiles.slice(0, maxImages) : imageFiles;
      setImages(finalImages);
      
      console.log('✅ Imagens carregadas:', finalImages.length);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro ao carregar imagens:', err);
      
      toast({
        variant: "destructive",
        title: "Erro ao carregar imagens",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [bucketName, folderPath]);

  const handleDownload = async (image: ImageFile) => {
    try {
      console.log('⬇️ Baixando imagem:', image.name);
      
      const response = await fetch(image.url);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = image.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download concluído",
        description: `${image.name} foi baixado com sucesso.`
      });
      
    } catch (error) {
      console.error('❌ Erro no download:', error);
      toast({
        variant: "destructive",
        title: "Erro no download",
        description: `Não foi possível baixar ${image.name}`
      });
    }
  };

  const handleOpenExternal = (image: ImageFile) => {
    window.open(image.url, '_blank');
  };

  const getGridClass = () => {
    const gridClassMap = {
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    };
    return gridClassMap[gridCols];
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {title}
          </CardTitle>
          {folderPath && (
            <p className="text-sm text-gray-500 mt-1">
              📁 {folderPath}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadImages}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Carregando imagens...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">❌ {error}</p>
            <Button variant="outline" onClick={loadImages}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !error && images.length === 0 && (
          <div className="text-center py-8">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Nenhuma imagem encontrada</p>
            <p className="text-sm text-gray-400 mt-1">
              Bucket: {bucketName} | Pasta: {folderPath || 'raiz'}
            </p>
          </div>
        )}

        {!isLoading && !error && images.length > 0 && (
          <div>
            <div className="mb-4 text-sm text-gray-600">
              📊 {images.length} imagem{images.length !== 1 ? 'ns' : ''} encontrada{images.length !== 1 ? 's' : ''}
            </div>
            
            <div className={`grid gap-4 ${getGridClass()}`}>
              {images.map((image, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('❌ Erro ao carregar imagem:', image.url);
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  
                  <div className="p-3">
                    <p className="text-sm font-medium truncate" title={image.name}>
                      {image.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      📁 {image.path || 'raiz'}
                    </p>
                    
                    <div className="flex gap-2 mt-3">
                      {showExternalLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenExternal(image)}
                          className="flex-1"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Abrir
                        </Button>
                      )}
                      
                      {showDownload && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(image)}
                          className="flex-1"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Baixar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageGallery;
