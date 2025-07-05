import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DocumentUploadService } from '@/services/form/DocumentUploadService';
import { Search } from 'lucide-react';
interface VendaDocumentDebugProps {
  vendaId: string;
  documentPath: string | null;
  currentDocumentPath: string | null;
  tipoVenda: string;
  requerComprovacao: boolean;
  isLoadingFormDetails: boolean;
  isLoadingAction: boolean;
}
const VendaDocumentDebug: React.FC<VendaDocumentDebugProps> = ({
  vendaId,
  documentPath,
  currentDocumentPath,
  tipoVenda,
  requerComprovacao,
  isLoadingFormDetails,
  isLoadingAction
}) => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [bucketFiles, setBucketFiles] = useState<any[]>([]);
  const handleDebugFiles = async () => {
    setIsDebugging(true);
    try {
      console.log('🔍 ========== DEBUG: LISTANDO ARQUIVOS ==========');
      const files = await DocumentUploadService.listAllFilesInBucket();
      setBucketFiles(files);
      console.log('📋 Arquivos no bucket:', files);

      // Buscar especificamente por arquivos relacionados a esta venda
      const vendaFiles = files.filter(file => file.name && (file.name.includes(vendaId) || file.name.includes(vendaId.substring(0, 8))));
      console.log('📋 Arquivos desta venda:', vendaFiles);
    } catch (error) {
      console.error('❌ Erro no debug:', error);
    } finally {
      setIsDebugging(false);
    }
  };
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return;
};
export default VendaDocumentDebug;