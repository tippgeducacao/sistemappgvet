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
    <Card className="w-72">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1">
          <Target className="h-3 w-3" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold text-foreground">
            {semanasConsecutivas}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className={getStatusColor(semanasConsecutivas)}>
              {getStatusText(semanasConsecutivas)}
            </Badge>
            {semanasConsecutivas > 0 && (
              <TrendingUp className="h-3 w-3 text-green-500" />
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {semanasConsecutivas === 0 
            ? "Sem sequência ativa" 
            : `${semanasConsecutivas} semana${semanasConsecutivas > 1 ? 's' : ''} anterior${semanasConsecutivas > 1 ? 'es' : ''} com meta batida`
          }
        </p>
      </CardContent>
    </Card>
  );
};

export default SemanasConsecutivasCard;