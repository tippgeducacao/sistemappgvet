
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
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
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
          className="ml-auto"
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
