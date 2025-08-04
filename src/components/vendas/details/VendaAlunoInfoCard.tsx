
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
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b">
        <h3 className="font-semibold text-blue-900">Informações do Aluno</h3>
      </div>
      <div className="p-0">
        {isLoading ? (
          <div className="text-gray-500 p-4">Carregando dados do aluno...</div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b bg-white hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-700 w-1/4">Nome:</td>
                <td className="px-4 py-3 text-gray-900">{alunoData?.nome || 'Não informado'}</td>
              </tr>
              <tr className="border-b bg-gray-50 hover:bg-gray-100">
                <td className="px-4 py-3 font-medium text-gray-700 w-1/4">Email:</td>
                <td className="px-4 py-3 text-gray-900">{alunoData?.email || 'Não informado'}</td>
              </tr>
              {alunoData?.telefone && (
                <tr className="border-b bg-white hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700 w-1/4">Telefone:</td>
                  <td className="px-4 py-3 text-gray-900">{alunoData.telefone}</td>
                </tr>
              )}
              {alunoData?.crmv && (
                <tr className="border-b bg-gray-50 hover:bg-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-700 w-1/4">CRMV:</td>
                  <td className="px-4 py-3 text-gray-900">{alunoData.crmv}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default VendaAlunoInfoCard;
