import React from 'react';
import { AlertTriangle, FileText } from 'lucide-react';
interface VendaDocumentStatusProps {
  currentDocumentPath: string | null;
  requerComprovacao: boolean;
  getFileName: (path: string) => string;
}
const VendaDocumentStatus: React.FC<VendaDocumentStatusProps> = ({
  currentDocumentPath,
  requerComprovacao,
  getFileName
}) => {
  // Documento não anexado mas obrigatório
  if (requerComprovacao && !currentDocumentPath) {
    return;
  }

  // Documento anexado
  if (currentDocumentPath) {
    return <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-800">
                Documento anexado
              </p>
              <p className="text-sm text-green-600">
                {getFileName(currentDocumentPath)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Caminho: {currentDocumentPath}
              </p>
            </div>
          </div>
        </div>
      </div>;
  }

  // Não requer comprovação e não tem documento
  return;
};
export default VendaDocumentStatus;