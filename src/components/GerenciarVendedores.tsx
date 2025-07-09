
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Upload, Trash2, Users, UserPlus, Camera } from 'lucide-react';
import { useVendedores } from '@/hooks/useVendedores';
import { useToast } from '@/hooks/use-toast';
import NovoVendedorDialog from '@/components/vendedores/NovoVendedorDialog';
import LoadingSpinner from '@/components/LoadingSpinner';

const GerenciarVendedores: React.FC = () => {
  const { vendedores, loading, fetchVendedores, uploadPhoto, removePhoto } = useVendedores();
  const [showNewVendedorDialog, setShowNewVendedorDialog] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePhotoUpload = async (vendedorId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingPhoto(vendedorId);
      await uploadPhoto(vendedorId, file);
    } catch (error) {
      console.error('Erro no upload:', error);
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleRemovePhoto = async (vendedorId: string) => {
    try {
      setUploadingPhoto(vendedorId);
      await removePhoto(vendedorId);
    } catch (error) {
      console.error('Erro ao remover foto:', error);
    } finally {
      setUploadingPhoto(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="mt-4 text-lg font-medium">Carregando vendedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Vendedores</h2>
          <p className="text-gray-600">Cadastre e gerencie vendedores do sistema</p>
        </div>
        
        <Button onClick={() => setShowNewVendedorDialog(true)} className="bg-ppgvet-teal hover:bg-ppgvet-teal/90">
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Vendedor
        </Button>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Lista de Vendedores ({vendedores.length})
          </TabsTrigger>
          <TabsTrigger value="estatisticas">
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendedores.map((vendedor) => (
              <Card key={vendedor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={vendedor.photo_url || ''} 
                          alt={vendedor.name}
                          key={vendedor.photo_url || 'no-photo'} // Force re-render when URL changes
                        />
                        <AvatarFallback className="bg-ppgvet-teal text-white">
                          {getInitials(vendedor.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="absolute -bottom-1 -right-1">
                        <label 
                          htmlFor={`photo-${vendedor.id}`}
                          className="cursor-pointer bg-white rounded-full p-1 shadow-lg hover:bg-gray-50 transition-colors"
                        >
                          <Camera className="h-3 w-3 text-gray-600" />
                        </label>
                        <input
                          id={`photo-${vendedor.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handlePhotoUpload(vendedor.id, file);
                            }
                          }}
                          disabled={uploadingPhoto === vendedor.id}
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <CardTitle className="text-lg">{vendedor.name}</CardTitle>
                      <p className="text-sm text-gray-600">{vendedor.email}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Vendedor
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Desde {new Date(vendedor.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      {uploadingPhoto === vendedor.id ? (
                        <Button disabled size="sm" className="flex-1">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Processando...
                        </Button>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => document.getElementById(`photo-${vendedor.id}`)?.click()}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Foto
                          </Button>
                          
                          {vendedor.photo_url && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRemovePhoto(vendedor.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {vendedores.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum vendedor cadastrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Comece cadastrando o primeiro vendedor do sistema
                </p>
                <Button onClick={() => setShowNewVendedorDialog(true)} className="bg-ppgvet-teal hover:bg-ppgvet-teal/90">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Vendedor
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="estatisticas" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total de Vendedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-ppgvet-teal">{vendedores.length}</div>
                <p className="text-sm text-gray-600">Ativos no sistema</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Com Foto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {vendedores.filter(v => v.photo_url).length}
                </div>
                <p className="text-sm text-gray-600">Perfis completos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Cadastros Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {vendedores.filter(v => {
                    const created = new Date(v.created_at);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return created > thirtyDaysAgo;
                  }).length}
                </div>
                <p className="text-sm text-gray-600">Últimos 30 dias</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <NovoVendedorDialog
        open={showNewVendedorDialog}
        onOpenChange={setShowNewVendedorDialog}
        onSuccess={() => {
          fetchVendedores();
          setShowNewVendedorDialog(false);
        }}
      />
    </div>
  );
};

export default GerenciarVendedores;
