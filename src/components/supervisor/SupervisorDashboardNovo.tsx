import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, TrendingUp, Edit } from 'lucide-react';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';

const SupervisorDashboard: React.FC = () => {
  const { grupos, loading } = useGruposSupervisores();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  const grupo = grupos[0];
  if (!grupo || !grupo.membros) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Nenhum grupo encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl font-semibold text-muted-foreground">
          Acompanhe o desempenho da sua equipe de SDRs
        </h1>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Minhas Reuniões */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-sm font-medium">Minhas Reuniões</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">10</div>
            <p className="text-sm text-muted-foreground">reuniões realizadas esta semana</p>
          </CardContent>
        </Card>

        {/* Sua Meta */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-sm font-medium">SUA META</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">10/120</div>
              <p className="text-sm text-muted-foreground">8.3% atingido</p>
              <Progress value={8.3} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Conversões */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CardTitle className="text-sm font-medium">CONVERSÕES</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">conversões da equipe</p>
          </CardContent>
        </Card>
      </div>

      {/* Meta Coletiva */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold">META COLETIVA</CardTitle>
          <p className="text-sm text-muted-foreground">
            Desempenho individual dos SDRs da sua equipe
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {grupo.membros.map((membro) => {
            // Dados mockados baseados na imagem
            const vendas = membro.usuario?.name === 'Regiane' || membro.usuario?.name === 'Debora' ? 0 : 0;
            const meta = membro.usuario?.name === 'Regiane' || membro.usuario?.name === 'Debora' ? 55 : 0;
            const percentual = meta > 0 ? (vendas / meta) * 100 : 0;
            
            return (
              <div key={membro.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                {/* Avatar e Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg border-2 border-blue-200">
                    {membro.usuario?.photo_url ? (
                      <img 
                        src={membro.usuario.photo_url}
                        alt={membro.usuario?.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <span className={`${membro.usuario?.photo_url ? 'hidden' : 'block'}`}>
                      {membro.usuario?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-base">{membro.usuario?.name}</h3>
                    <p className="text-sm text-muted-foreground">SDR</p>
                  </div>
                </div>

                {/* Métricas e Progresso */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold">{vendas}/{meta}</div>
                    <div className="text-sm text-muted-foreground">{percentual.toFixed(0)}%</div>
                  </div>
                  
                  <div className="w-32">
                    <Progress value={percentual} className="h-2" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 px-2">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Precisa melhorar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorDashboard;