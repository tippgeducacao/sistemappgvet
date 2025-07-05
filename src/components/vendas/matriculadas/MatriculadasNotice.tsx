
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const MatriculadasNotice: React.FC = () => {
  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-medium">
            Secretaria: Use "Ver Detalhes" para visualizar informações completas e "Reverter" para retornar uma matrícula ao status pendente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatriculadasNotice;
