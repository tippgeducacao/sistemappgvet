
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, GraduationCap } from 'lucide-react';

const MatriculadasEmptyState: React.FC = () => {
  console.log('📝 MatriculadasEmptyState: Nenhuma venda matriculada encontrada');
  
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Vendas Matriculadas (0)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Nenhuma Matrícula Efetivada
          </h3>
          <p className="text-blue-700">
            As matrículas aprovadas aparecerão aqui automaticamente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatriculadasEmptyState;
