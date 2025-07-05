import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Download, ExternalLink, Loader2 } from 'lucide-react';
interface VendaDocumentActionsProps {
  currentDocumentPath: string | null;
  isLoadingAction: boolean;
  onView: () => void;
  onDownload: () => void;
  onCopyPath: () => void;
}
const VendaDocumentActions: React.FC<VendaDocumentActionsProps> = ({
  currentDocumentPath,
  isLoadingAction,
  onView,
  onDownload,
  onCopyPath
}) => {
  return <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={onView} disabled={isLoadingAction} className="text-blue-600 hover:text-blue-700">
        {isLoadingAction ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
        Visualizar
      </Button>
      
      <Button variant="outline" size="sm" onClick={onDownload} disabled={isLoadingAction} className="text-green-600 hover:text-green-700">
        {isLoadingAction ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
        Download
      </Button>
      
      {currentDocumentPath && currentDocumentPath !== 'placeholder'}
    </div>;
};
export default VendaDocumentActions;