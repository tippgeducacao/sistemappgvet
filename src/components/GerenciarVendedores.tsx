
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/LoadingSpinner';
import NovoVendedorDialog from '@/components/vendedores/NovoVendedorDialog';
import { Camera, Upload, Loader2, RefreshCw } from 'lucide-react';
import { useVendedores } from '@/hooks/useVendedores';
import { useAuth } from '@/hooks/useAuth';
import { UserService } from '@/services/user/UserService';

const GerenciarVendedores: React.FC = () => {
  const {
    vendedores,
    loading,
    uploadPhoto,
    fetchVendedores
  } = useVendedores();

  const { profile } = useAuth();
  const [canManageVendedores, setCanManageVendedores] = useState(false);

  // Verificar permissões
  React.useEffect(() => {
    const checkPermissions = async () => {
      if (!profile?.id) return;
      
      const isSecretary = UserService.isSecretary(profile);
      const isAdmin = await UserService.isAdmin(profile.id);
      
      setCanManageVendedores(isSecretary || isAdmin);
    };
    
    checkPermissions();
  }, [profile]);

  const fileInputRefs = useRef<{
    [key: string]: HTMLInputElement | null;
  }>({});

  const [uploadingPhotos, setUploadingPhotos] = useState<{
    [key: string]: boolean;
  }>({});

  const handleFileSelect = async (vendedorId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    try {
      setUploadingPhotos(prev => ({
        ...prev,
        [vendedorId]: true
      }));

      console.log('🎯 Iniciando upload para vendedor:', vendedorId);
      console.log('📁 Arquivo selecionado:', file.name);
      
      await uploadPhoto(vendedorId, file);
      console.log('✅ Upload concluído com sucesso');

      // Limpar o input para permitir selecionar o mesmo arquivo novamente se necessário
      if (fileInputRefs.current[vendedorId]) {
        fileInputRefs.current[vendedorId]!.value = '';
      }
    } catch (error) {
      console.error('❌ Erro no upload:', error);
    } finally {
      setUploadingPhotos(prev => ({
        ...prev,
        [vendedorId]: false
      }));
    }
  };

  const triggerFileInput = (vendedorId: string) => {
    fileInputRefs.current[vendedorId]?.click();
  };

  const handleRefresh = async () => {
    console.log('🔄 Recarregando vendedores manualmente...');
    await fetchVendedores();
  };

  const handleVendedorCadastrado = () => {
    console.log('🔄 Atualizando lista após cadastro...');
    fetchVendedores();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Vendedores</CardTitle>
              <CardDescription>
                Gerencie as fotos dos vendedores do sistema
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {canManageVendedores && (
                <NovoVendedorDialog onVendedorCadastrado={handleVendedorCadastrado} />
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendedores.map(vendedor => {
              const isUploading = uploadingPhotos[vendedor.id];
              
              return (
                <Card key={vendedor.id} className="p-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage 
                          src={vendedor.photo_url ? `${vendedor.photo_url}?t=${Date.now()}` : undefined} 
                          alt={vendedor.name}
                          onLoad={() => console.log('🖼️ Imagem carregada para:', vendedor.name, 'URL:', vendedor.photo_url)}
                          onError={(e) => {
                            console.log('❌ Erro ao carregar imagem para:', vendedor.name, 'URL:', vendedor.photo_url);
                            console.log('❌ Erro detalhado:', e);
                          }}
                        />
                        <AvatarFallback className="text-lg">
                          {vendedor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                        onClick={() => triggerFileInput(vendedor.id)}
                        disabled={isUploading}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-center">
                      <h3 className="font-semibold">{vendedor.name}</h3>
                      <p className="text-sm text-muted-foreground">{vendedor.email}</p>
                      {vendedor.photo_url ? (
                        <p className="text-xs text-green-600 mt-1">✅ Foto carregada</p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">📷 Sem foto</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => triggerFileInput(vendedor.id)}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {vendedor.photo_url ? 'Alterar foto' : 'Adicionar foto'}
                      </Button>
                    </div>

                    <Input
                      ref={el => {
                        fileInputRefs.current[vendedor.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(vendedor.id, file);
                        }
                      }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          {vendedores.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum vendedor encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarVendedores;
