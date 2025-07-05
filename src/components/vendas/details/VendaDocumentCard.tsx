import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { DocumentUploadService } from '@/services/form/DocumentUploadService';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import VendaDocumentHeader from './components/VendaDocumentHeader';
import VendaDocumentInfo from './components/VendaDocumentInfo';
import VendaDocumentStatus from './components/VendaDocumentStatus';
import VendaDocumentActions from './components/VendaDocumentActions';
import VendaDocumentDebug from './components/VendaDocumentDebug';
import VendaDocumentGallery from './components/VendaDocumentGallery';
interface VendaDocumentCardProps {
  documentPath: string | null;
  tipoVenda: string;
  vendaId: string;
  isLoadingFormDetails?: boolean;
}
const VendaDocumentCard: React.FC<VendaDocumentCardProps> = ({
  documentPath,
  tipoVenda,
  vendaId,
  isLoadingFormDetails = false
}) => {
  const {
    toast
  } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentDocumentPath, setCurrentDocumentPath] = useState(documentPath);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const tiposQueRequeremComprovacao = ['LIGAÇÃO'];
  const requerComprovacao = tiposQueRequeremComprovacao.includes(tipoVenda);

  // Atualizar o estado local quando a prop mudar
  useEffect(() => {
    console.log('📎 VendaDocumentCard - Atualizando documento path:', {
      vendaId: vendaId?.substring(0, 8),
      documentPathProp: documentPath,
      currentDocumentPath: currentDocumentPath
    });
    setCurrentDocumentPath(documentPath);
  }, [documentPath, vendaId]);
  const handleRefreshDocument = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 ========== BUSCANDO DOCUMENTO ATUALIZADO ==========');
      console.log('🔍 Buscando documento para venda:', vendaId);

      // NOVA ESTRATÉGIA: Primeiro tentar via SQL
      const foundPath = await DocumentUploadService.findDocumentByVendaId(vendaId);
      if (foundPath) {
        console.log('✅ Documento encontrado via SQL:', foundPath);
        setCurrentDocumentPath(foundPath);

        // Atualizar no banco de dados
        const {
          error: updateError
        } = await supabase.from('form_entries').update({
          documento_comprobatorio: foundPath
        }).eq('id', vendaId);
        if (updateError) {
          console.error('❌ Erro ao atualizar path no banco:', updateError);
        }
        toast({
          title: "Documento encontrado!",
          description: "O documento foi localizado e atualizado com sucesso."
        });
        return;
      }

      // Fallback: buscar no banco como antes
      const {
        data,
        error
      } = await supabase.from('form_entries').select('documento_comprobatorio').eq('id', vendaId).single();
      if (error) {
        console.error('❌ Erro ao buscar documento:', error);
        toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar as informações do documento."
        });
        return;
      }
      console.log('📎 RESULTADO DA BUSCA:', {
        vendaId: vendaId,
        documentoEncontrado: data.documento_comprobatorio,
        documentoExiste: !!data.documento_comprobatorio
      });
      setCurrentDocumentPath(data.documento_comprobatorio);
      if (data.documento_comprobatorio) {
        toast({
          title: "Documento encontrado!",
          description: "As informações do documento foram atualizadas."
        });
      } else {
        toast({
          title: "Nenhum documento encontrado",
          description: "Não há documento anexado para esta venda."
        });
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar documento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro inesperado ao buscar o documento."
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  const handleViewDocument = async () => {
    setIsLoadingAction(true);
    try {
      console.log('👁️ ========== VISUALIZANDO DOCUMENTO ==========');
      console.log('📎 Caminho atual do documento:', currentDocumentPath);
      console.log('🏪 Venda ID:', vendaId);

      // NOVA ESTRATÉGIA: Usar a função aprimorada que usa SQL
      const url = await DocumentUploadService.getDocumentUrl(currentDocumentPath || '', vendaId);
      console.log('🔗 URL gerada para visualização:', url);

      // Abrir em nova aba
      window.open(url, '_blank');
      toast({
        title: "Documento aberto",
        description: "O documento foi aberto em uma nova aba."
      });
    } catch (error) {
      console.error('❌ Erro ao abrir documento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        variant: "destructive",
        title: "Erro ao abrir documento",
        description: errorMessage
      });
    } finally {
      setIsLoadingAction(false);
    }
  };
  const handleDownloadDocument = async () => {
    setIsLoadingAction(true);
    try {
      console.log('⬇️ ========== FAZENDO DOWNLOAD DO DOCUMENTO ==========');
      console.log('⬇️ Caminho atual do documento:', currentDocumentPath);

      // NOVA ESTRATÉGIA: Usar a função aprimorada que usa SQL
      const url = await DocumentUploadService.getDocumentUrl(currentDocumentPath || '', vendaId);
      console.log('🔗 URL gerada para download:', url);

      // Fazer o download
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Falha ao baixar o arquivo: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      const fileName = getFileName(currentDocumentPath || '');

      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpar o objeto URL
      URL.revokeObjectURL(link.href);
      toast({
        title: "Download concluído",
        description: `O arquivo ${fileName} foi baixado com sucesso.`
      });
    } catch (error) {
      console.error('❌ Erro ao fazer download:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        variant: "destructive",
        title: "Erro no download",
        description: errorMessage
      });
    } finally {
      setIsLoadingAction(false);
    }
  };
  const handleCopyPath = () => {
    if (!currentDocumentPath) return;
    navigator.clipboard.writeText(currentDocumentPath);
    toast({
      title: "Caminho copiado",
      description: "O caminho do arquivo foi copiado para a área de transferência."
    });
  };
  const getFileName = (path: string) => {
    if (!path) return 'documento';
    const parts = path.split('/');
    const fileName = parts[parts.length - 1] || 'documento';
    // Remover timestamp do nome se existir
    return fileName.replace(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-/, '');
  };
  if (isLoadingFormDetails) {
    return <Card>
        <VendaDocumentHeader tipoVenda={tipoVenda} requerComprovacao={requerComprovacao} isRefreshing={false} onRefresh={() => {}} />
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Carregando informações do documento...</p>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-4">
      <Card>
        <VendaDocumentHeader tipoVenda={tipoVenda} requerComprovacao={requerComprovacao} isRefreshing={isRefreshing} onRefresh={handleRefreshDocument} />
        <CardContent>
          <div className="space-y-4">
            <VendaDocumentInfo tipoVenda={tipoVenda} />

            <VendaDocumentStatus currentDocumentPath={currentDocumentPath} requerComprovacao={requerComprovacao} getFileName={getFileName} />

            {/* SEMPRE mostrar os botões, mesmo se currentDocumentPath for null */}
            <VendaDocumentActions currentDocumentPath={currentDocumentPath || 'placeholder'} isLoadingAction={isLoadingAction} onView={handleViewDocument} onDownload={handleDownloadDocument} onCopyPath={handleCopyPath} />

            <VendaDocumentDebug vendaId={vendaId} documentPath={documentPath} currentDocumentPath={currentDocumentPath} tipoVenda={tipoVenda} requerComprovacao={requerComprovacao} isLoadingFormDetails={isLoadingFormDetails} isLoadingAction={isLoadingAction} />
          </div>
        </CardContent>
      </Card>

      {/* Nova Galeria de Debug */}
      {process.env.NODE_ENV === 'development' && <Card>
          
        </Card>}
    </div>;
};
export default VendaDocumentCard;