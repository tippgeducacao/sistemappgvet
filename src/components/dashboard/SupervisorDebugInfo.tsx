import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SupervisorComissionamentoService } from '@/services/supervisor/SupervisorComissionamentoService';
import { Info, Eye, EyeOff } from 'lucide-react';

interface SupervisorDebugInfoProps {
  supervisorId: string;
  supervisorName: string;
  selectedMonth: string;
  getWeeksOfMonth: (year: number, month: number) => any[];
}

const SupervisorDebugInfo: React.FC<SupervisorDebugInfoProps> = ({
  supervisorId,
  supervisorName,
  selectedMonth,
  getWeeksOfMonth
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const currentYear = parseInt(selectedMonth.split('-')[0]);
  const currentMonth = parseInt(selectedMonth.split('-')[1]);
  const weeks = getWeeksOfMonth(currentYear, currentMonth);

  const analyzeData = async () => {
    setLoading(true);
    const analysis: any = {
      supervisor: { id: supervisorId, name: supervisorName },
      month: { year: currentYear, month: currentMonth },
      weeks: [],
      allMembers: new Map(),
      summary: {
        totalWeeks: weeks.length,
        weeksWithData: 0,
        weeksWithoutData: 0,
        uniqueMembers: 0,
        membersWithIncompleteData: []
      }
    };

    // Analisar cada semana
    for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
      const weekNumber = weekIndex + 1;
      
      try {
        const comissionamentoData = await SupervisorComissionamentoService.calcularComissionamentoSupervisor(
          supervisorId,
          currentYear,
          currentMonth,
          weekNumber
        );

        const weekAnalysis = {
          weekNumber,
          weekInfo: weeks[weekIndex],
          hasData: !!comissionamentoData,
          memberCount: comissionamentoData?.sdrsDetalhes?.length || 0,
          members: comissionamentoData?.sdrsDetalhes?.map(sdr => ({
            id: sdr.id,
            name: sdr.nome,
            meetings: sdr.reunioesRealizadas,
            goal: sdr.metaSemanal,
            percentage: sdr.percentualAtingimento
          })) || []
        };

        analysis.weeks.push(weekAnalysis);

        if (comissionamentoData) {
          analysis.summary.weeksWithData++;
          
            // Registrar membros únicos
            comissionamentoData.sdrsDetalhes?.forEach(sdr => {
              if (!analysis.allMembers.has(sdr.id)) {
                analysis.allMembers.set(sdr.id, {
                  id: sdr.id,
                  name: sdr.nome,
                  weeksActive: []
                });
              }
              const member = analysis.allMembers.get(sdr.id);
              if (member) {
                member.weeksActive.push(weekNumber);
              }
            });
        } else {
          analysis.summary.weeksWithoutData++;
        }

      } catch (error) {
        analysis.weeks.push({
          weekNumber,
          weekInfo: weeks[weekIndex],
          hasData: false,
          memberCount: 0,
          members: [],
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        analysis.summary.weeksWithoutData++;
      }
    }

    // Converter Map para Array e analisar dados incompletos
    const allMembersArray = Array.from(analysis.allMembers.values());
    analysis.summary.uniqueMembers = allMembersArray.length;

    allMembersArray.forEach((member: any) => {
      const missingWeeks = weeks.map((_, i) => i + 1).filter(w => !member.weeksActive.includes(w));
      if (missingWeeks.length > 0) {
        analysis.summary.membersWithIncompleteData.push({
          ...member,
          missingWeeks,
          activeWeeks: member.weeksActive.length,
          totalWeeks: weeks.length
        });
      }
    });

    analysis.allMembersArray = allMembersArray;
    setDebugData(analysis);
    setLoading(false);
  };

  if (!isVisible) {
    return (
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="flex items-center gap-2"
        >
          <Info className="h-4 w-4" />
          Debug: Analisar Dados do Supervisor
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Debug: Análise de Dados - {supervisorName}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="flex items-center gap-1"
          >
            <EyeOff className="h-4 w-4" />
            Ocultar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            onClick={analyzeData}
            disabled={loading}
            size="sm"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {loading ? 'Analisando...' : 'Analisar Dados'}
          </Button>
        </div>

        {debugData && (
          <div className="space-y-4">
            {/* Resumo */}
            <div>
              <h4 className="font-semibold mb-2">Resumo Geral:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <Badge variant="outline">Total Semanas: {debugData.summary.totalWeeks}</Badge>
                <Badge variant="outline">Com Dados: {debugData.summary.weeksWithData}</Badge>
                <Badge variant="outline">Sem Dados: {debugData.summary.weeksWithoutData}</Badge>
                <Badge variant="outline">Membros Únicos: {debugData.summary.uniqueMembers}</Badge>
              </div>
            </div>

            {/* Membros com dados incompletos */}
            {debugData.summary.membersWithIncompleteData.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Membros com Dados Incompletos:</h4>
                <div className="space-y-2">
                  {debugData.summary.membersWithIncompleteData.map((member: any) => (
                    <div key={member.id} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <strong>{member.name}</strong>
                      <div>Ativo em: {member.activeWeeks}/{member.totalWeeks} semanas</div>
                      <div>Semanas ausentes: {member.missingWeeks.join(', ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalhes por semana */}
            <div>
              <h4 className="font-semibold mb-2">Detalhes por Semana:</h4>
              <div className="space-y-2">
                {debugData.weeks.map((week: any) => (
                  <div key={week.weekNumber} className="p-3 border rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Semana {week.weekNumber}</span>
                      <Badge variant={week.hasData ? "default" : "secondary"}>
                        {week.hasData ? `${week.memberCount} membros` : 'Sem dados'}
                      </Badge>
                    </div>
                    {week.error && (
                      <div className="text-red-600 text-sm">Erro: {week.error}</div>
                    )}
                    {week.members.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Membros: {week.members.map((m: any) => m.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupervisorDebugInfo;