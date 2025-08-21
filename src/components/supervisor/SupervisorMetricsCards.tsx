
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'purple' | 'green';
  showProgress?: boolean;
  progressValue?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  color, 
  showProgress = false, 
  progressValue = 0 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500'
  };

  const textColorClasses = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    green: 'text-green-500'
  };

  return (
    <Card className="bg-card dark:bg-card border border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 ${colorClasses[color]} rounded-full`}></div>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${textColorClasses[color]}`}>
          {value}
        </div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {showProgress && (
          <Progress 
            value={Math.min(progressValue, 100)} 
            className="h-2 mt-2" 
          />
        )}
      </CardContent>
    </Card>
  );
};

interface SupervisorMetricsCardsProps {
  minhasReunioes: number;
  totalReunioesEquipe: number;
  totalMetaEquipe: number;
  percentualAtingimento: number;
  conversoes: number;
  valorComissao: number;
}

export const SupervisorMetricsCards: React.FC<SupervisorMetricsCardsProps> = ({
  minhasReunioes,
  totalReunioesEquipe,
  totalMetaEquipe,
  percentualAtingimento,
  conversoes,
  valorComissao
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MetricCard
        title="Minhas Reuniões"
        value={minhasReunioes}
        subtitle="reuniões realizadas esta semana"
        color="blue"
      />

      <MetricCard
        title="SDR Equipe"
        value={`${totalReunioesEquipe}/${totalMetaEquipe}`}
        subtitle={`${percentualAtingimento.toFixed(1)}% atingido`}
        color="purple"
        showProgress
        progressValue={percentualAtingimento}
      />

      <MetricCard
        title="Conversões"
        value={conversoes}
        subtitle="conversões da equipe"
        color="green"
      />

      <Card className="bg-card dark:bg-card border border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
              Comissão Semanal
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-500">
            R$ {valorComissao.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">comissão desta semana</p>
        </CardContent>
      </Card>
    </div>
  );
};
