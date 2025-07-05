
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface VendaObservationsCardProps {
  observacoes: string;
}

const VendaObservationsCard: React.FC<VendaObservationsCardProps> = ({
  observacoes
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Observações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {observacoes ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-800 whitespace-pre-wrap">{observacoes}</p>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma observação registrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendaObservationsCard;
