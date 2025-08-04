
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
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b">
        <h3 className="font-semibold text-green-900">Informações do Curso</h3>
      </div>
      <div className="p-0">
        <table className="w-full text-sm">
          <tbody>
            <tr className="bg-white hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-700 w-1/4">Curso:</td>
              <td className="px-4 py-3 text-gray-900">{cursoData?.nome || 'Não informado'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendaCursoInfoCard;
