
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VendedoresService, type Vendedor } from '@/services/vendedoresService';

export const useVendedores = () => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchVendedores = async () => {
    try {
      setLoading(true);
      console.log('🔄 Recarregando lista de vendedores...');
      const data = await VendedoresService.fetchVendedores();
      console.log('📊 Dados recebidos:', data.map(v => ({ 
        id: v.id, 
        name: v.name, 
        hasPhoto: !!v.photo_url,
        photoUrl: v.photo_url 
      })));
      setVendedores(data);
    } catch (error) {
      console.error('❌ Erro ao buscar vendedores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vendedores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (vendedorId: string, file: File) => {
    try {
      console.log('📤 Iniciando processo de upload para:', vendedorId);
      console.log('📄 Arquivo selecionado:', { name: file.name, size: file.size, type: file.type });
      
      // Upload da foto
      const photoUrl = await VendedoresService.uploadVendedorPhoto(vendedorId, file);
      console.log('🔗 URL gerada pelo serviço:', photoUrl);
      
      // Atualizar o perfil com a nova URL
      await VendedoresService.updateVendedorPhoto(vendedorId, photoUrl);
      console.log('✅ Processo de atualização no banco concluído');
      
      // Recarregar a lista para garantir sincronização
      console.log('🔄 Recarregando lista de vendedores...');
      await fetchVendedores();
      console.log('🔄 Lista recarregada após upload');

      toast({
        title: "Sucesso",
        description: "Foto do vendedor atualizada com sucesso!",
      });
    } catch (error) {
      console.error('❌ Erro no processo de upload:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao fazer upload da foto";
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const removePhoto = async (vendedorId: string) => {
    try {
      console.log('🗑️ Iniciando remoção de foto para:', vendedorId);
      
      await VendedoresService.removeVendedorPhoto(vendedorId);
      console.log('✅ Foto removida do sistema');
      
      // Recarregar a lista de vendedores
      await fetchVendedores();
      console.log('🔄 Lista atualizada após remoção');

      toast({
        title: "Sucesso",
        description: "Foto removida com sucesso!",
      });
    } catch (error) {
      console.error('❌ Erro ao remover foto:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover foto",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  return {
    vendedores,
    loading,
    fetchVendedores,
    uploadPhoto,
    removePhoto,
  };
};
