
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CursoData {
  id: string;
  nome: string;
}

interface VendaCursoInfoCardProps {
  cursoData: CursoData | null;
}

const VendaCursoInfoCard: React.FC<VendaCursoInfoCardProps> = ({
  cursoData
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informações do Curso</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <span className="font-medium text-gray-600">Curso:</span>
          <p className="text-lg">
            {cursoData?.nome || 'Não informado'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendaCursoInfoCard;
