
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, RefreshCw, Loader2 } from 'lucide-react';

interface VendaDocumentHeaderProps {
  tipoVenda: string;
  requerComprovacao: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const VendaDocumentHeader: React.FC<VendaDocumentHeaderProps> = ({
  tipoVenda,
  requerComprovacao,
  isRefreshing,
  onRefresh
}) => {
  return (
    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b dark:border-gray-600">
      <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
        <FileText className="h-5 w-5" />
        Documento Comprobatório
        {requerComprovacao && (
          <Badge variant="destructive" className="ml-2">
            Obrigatório
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="ml-auto hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardTitle>
    </CardHeader>
  );
};

export default VendaDocumentHeader;
