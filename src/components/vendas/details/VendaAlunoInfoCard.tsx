
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AlunoData {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  crmv?: string;
}

interface VendaAlunoInfoCardProps {
  alunoData: AlunoData | null;
  isLoading: boolean;
}

const VendaAlunoInfoCard: React.FC<VendaAlunoInfoCardProps> = ({
  alunoData,
  isLoading
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informações do Aluno</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-gray-500">Carregando dados do aluno...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-600">Nome:</span>
              <p className="text-lg">
                {alunoData?.nome || 'Não informado'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Email:</span>
              <p>
                {alunoData?.email || 'Não informado'}
              </p>
            </div>
            {alunoData?.telefone && (
              <div>
                <span className="font-medium text-gray-600">Telefone:</span>
                <p>{alunoData.telefone}</p>
              </div>
            )}
            {alunoData?.crmv && (
              <div>
                <span className="font-medium text-gray-600">CRMV:</span>
                <p>{alunoData.crmv}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendaAlunoInfoCard;
