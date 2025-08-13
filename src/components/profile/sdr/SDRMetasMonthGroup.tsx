import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface SDRMetasMonthGroupProps {
  mesAno: string;
  semanas: Array<{
    numero: number;
    periodo: string;
    metaAgendamentos: number;
    agendamentosRealizados: number;
    percentual: number;
    variabelSemanal: number;
    metaAtingida: boolean;
    semanasConsecutivas: number;
    isCurrentWeek: boolean;
  }>;
}

const SDRMetasMonthGroup: React.FC<SDRMetasMonthGroupProps> = ({ mesAno, semanas }) => {
  if (semanas.length === 0) return null;

  const totalMultiplicador = semanas.reduce((total, semana) => total + (semana.metaAtingida ? semana.variabelSemanal : 0), 0);
  const totalComissao = totalMultiplicador;

  return (
    <div className="mb-8">
      {/* Cabeçalho do Mês */}
      <div className="bg-muted/50 p-4 rounded-t-lg border border-b-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">📅 Metas Semanais - {mesAno}</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-blue-600 font-medium">Multiplicador Total: <span className="text-blue-800">{totalMultiplicador.toFixed(0)}</span></span>
            <span className="text-green-600 font-medium">Comissão Total: <span className="text-green-800">R$ {totalComissao.toFixed(2)}</span></span>
          </div>
        </div>
      </div>

      {/* Tabela de Semanas */}
      <div className="border border-t-0 rounded-b-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left p-3 font-medium text-sm">Semana</th>
              <th className="text-left p-3 font-medium text-sm">Período</th>
              <th className="text-left p-3 font-medium text-sm">Meta Agendamentos</th>
              <th className="text-left p-3 font-medium text-sm">Agendamentos</th>
              <th className="text-left p-3 font-medium text-sm">% Agendamentos</th>
              <th className="text-left p-3 font-medium text-sm">Multiplicador</th>
              <th className="text-left p-3 font-medium text-sm">Comissão</th>
              <th className="text-left p-3 font-medium text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((semana, index) => (
              <tr 
                key={semana.numero} 
                className={`border-b hover:bg-muted/20 ${semana.isCurrentWeek ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{semana.numero}</span>
                    {semana.isCurrentWeek && <Badge variant="secondary" className="text-xs">Semana Atual</Badge>}
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {semana.periodo}
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    {semana.metaAgendamentos}
                  </Badge>
                </td>
                <td className="p-3">
                  <span className="font-medium">{semana.agendamentosRealizados}</span>
                </td>
                <td className="p-3">
                  <span className={`font-bold ${
                    semana.percentual >= 100 ? 'text-green-600' : 
                    semana.percentual >= 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {semana.percentual}%
                  </span>
                </td>
                <td className="p-3">
                  <span className="text-sm">
                    {semana.metaAtingida ? '1x' : '0x'}
                  </span>
                </td>
                <td className="p-3">
                  <span className="font-medium">
                    R$ {semana.metaAtingida ? semana.variabelSemanal.toFixed(2) : '0,00'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    <Badge className={semana.metaAtingida ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {semana.metaAtingida ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Bateu
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Não Bateu
                        </>
                      )}
                    </Badge>
                    {semana.semanasConsecutivas > 0 && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 text-xs">
                        {semana.semanasConsecutivas} STREAK
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SDRMetasMonthGroup;