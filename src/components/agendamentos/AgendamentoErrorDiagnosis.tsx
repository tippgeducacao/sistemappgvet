import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, Clock, Calendar, User, UserCheck } from 'lucide-react';

interface ErrorDiagnosisProps {
  error: string;
  vendedor?: any;
  dataAgendamento?: string;
  onForcarAgendamento?: () => void;
}

const AgendamentoErrorDiagnosis: React.FC<ErrorDiagnosisProps> = ({ 
  error, 
  vendedor, 
  dataAgendamento,
  onForcarAgendamento 
}) => {
  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes('horário de trabalho')) return 'horario';
    if (errorMessage.includes('já passou')) return 'tempo';
    if (errorMessage.includes('já possui agendamento')) return 'conflito';
    if (errorMessage.includes('não trabalha neste dia')) return 'dia';
    if (errorMessage.includes('Link da reunião')) return 'link';
    return 'geral';
  };

  const renderSuggestions = (errorType: string) => {
    switch (errorType) {
      case 'horario':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Possíveis soluções:</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Verifique o horário de trabalho do vendedor na agenda geral</li>
              <li>Escolha um horário dentro dos períodos de trabalho</li>
              <li>Considere agendar em outro dia</li>
            </ul>
          </div>
        );
      case 'tempo':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Possíveis soluções:</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Selecione uma data/hora futura</li>
              <li>Verifique se o fuso horário está correto</li>
            </ul>
          </div>
        );
      case 'conflito':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Possíveis soluções:</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Consulte a agenda geral para ver horários livres</li>
              <li>Escolha um horário diferente</li>
              <li>Considere outro vendedor especializado</li>
            </ul>
          </div>
        );
      case 'dia':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Possíveis soluções:</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Verifique os dias de trabalho na agenda geral</li>
              <li>Escolha um dia da semana em que o vendedor trabalha</li>
              <li>Considere outro vendedor que trabalhe neste dia</li>
            </ul>
          </div>
        );
      case 'link':
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Possíveis soluções:</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Preencha o campo "Link da Reunião"</li>
              <li>Use um link válido (Google Meet, Zoom, etc.)</li>
            </ul>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium">Dicas gerais:</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Verifique todos os campos obrigatórios</li>
              <li>Consulte a agenda geral para verificar disponibilidade</li>
              <li>Tente novamente em alguns instantes</li>
            </ul>
          </div>
        );
    }
  };

  const errorType = getErrorType(error);
  const getIcon = (type: string) => {
    switch (type) {
      case 'horario':
      case 'tempo':
        return Clock;
      case 'dia':
        return Calendar;
      case 'conflito':
        return User;
      default:
        return AlertTriangle;
    }
  };

  const Icon = getIcon(errorType);

  return (
    <Card className="border-destructive">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Icon className="h-5 w-5" />
          Erro no Agendamento
        </CardTitle>
        <CardDescription>
          Diagnóstico detalhado do problema encontrado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {error}
          </AlertDescription>
        </Alert>

        {renderSuggestions(errorType)}

        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Informações do Contexto</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {vendedor && (
              <div>
                <span className="text-muted-foreground">Vendedor:</span>
                <p className="font-medium">{vendedor.name}</p>
              </div>
            )}
            {dataAgendamento && (
              <div>
                <span className="text-muted-foreground">Data/Hora:</span>
                <p className="font-medium">
                  {new Date(dataAgendamento).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botão de Forçar Agendamento para erros de horário */}
        {(errorType === 'horario' || errorType === 'dia') && onForcarAgendamento && (
          <div className="border-t pt-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <UserCheck className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-800 mb-1">Forçar Agendamento</h4>
                  <p className="text-sm text-orange-700 mb-3">
                    Você pode forçar o agendamento fora do horário normal e selecionar manualmente 
                    o vendedor especializado na pós-graduação desejada.
                  </p>
                  <Button 
                    onClick={onForcarAgendamento}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    size="sm"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Forçar Agendamento
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Use o botão "Agenda Geral" para visualizar 
            a disponibilidade completa dos vendedores e suas especializações.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgendamentoErrorDiagnosis;