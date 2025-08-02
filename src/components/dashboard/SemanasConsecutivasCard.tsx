import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSemanasConsecutivas } from '@/hooks/useSemanasConsecutivas';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target } from 'lucide-react';

interface SemanasConsecutivasCardProps {
  vendedorId?: string;
  title?: string;
}

const SemanasConsecutivasCard: React.FC<SemanasConsecutivasCardProps> = ({ 
  vendedorId,
  title = "Semanas Consecutivas Batendo Meta"
}) => {
  const { semanasConsecutivas, loading } = useSemanasConsecutivas(vendedorId);

  const getStatusColor = (semanas: number) => {
    if (semanas >= 4) return "bg-green-500 text-white";
    if (semanas >= 2) return "bg-yellow-500 text-white";
    return "bg-gray-500 text-white";
  };

  const getStatusText = (semanas: number) => {
    if (semanas >= 4) return "Excelente";
    if (semanas >= 2) return "Bom";
    if (semanas === 1) return "Iniciando";
    return "Sem sequência";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-20"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription className="text-sm">
          Sequência atual de semanas atingindo a meta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-foreground">
            {semanasConsecutivas}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(semanasConsecutivas)}>
              {getStatusText(semanasConsecutivas)}
            </Badge>
            {semanasConsecutivas > 0 && (
              <TrendingUp className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {semanasConsecutivas === 0 
            ? "Nenhuma sequência ativa no momento" 
            : `${semanasConsecutivas} semana${semanasConsecutivas > 1 ? 's' : ''} consecutiva${semanasConsecutivas > 1 ? 's' : ''}`
          }
        </p>
      </CardContent>
    </Card>
  );
};

export default SemanasConsecutivasCard;