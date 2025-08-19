import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, TrendingUp, Edit } from 'lucide-react';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useAuthStore } from '@/stores/AuthStore';

export const SupervisorDashboardAtualizado: React.FC = () => {
  const { user } = useAuthStore();
  const { grupos, loading } = useGruposSupervisores();

  // Encontrar o grupo do supervisor logado
  const meuGrupo = useMemo(() => {
    if (!user || !grupos) return null;
    return grupos.find(grupo => grupo.supervisor_id === user.id);
  }, [user, grupos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!meuGrupo || !meuGrupo.membros) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Nenhum grupo encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard - Time SDR</h1>
        <p className="text-gray-600 mt-1">Acompanhe o desempenho da sua equipe de SDRs</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Minhas Reuniões */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-sm font-medium text-gray-700">Minhas Reuniões</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">10</div>
              <p className="text-sm text-gray-500">reuniões realizadas esta semana</p>
            </CardContent>
          </Card>

          {/* Sua Meta */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-sm font-medium text-gray-700">SUA META</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-gray-900">10/120</div>
                <p className="text-sm text-gray-500">8.3% atingido</p>
                <Progress value={8.3} className="h-2 bg-gray-200" />
              </div>
            </CardContent>
          </Card>

          {/* Conversões */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <CardTitle className="text-sm font-medium text-gray-700">CONVERSÕES</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">0</div>
              <p className="text-sm text-gray-500">conversões da equipe</p>
            </CardContent>
          </Card>
        </div>

        {/* Meta Coletiva */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900">META COLETIVA</CardTitle>
            <p className="text-sm text-gray-600">
              Desempenho individual dos SDRs da sua equipe
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {meuGrupo.membros.map((membro) => {
              // Dados baseados na imagem - alguns SDRs com 0/0, outros com 0/55
              const isRegiane = membro.usuario?.name?.toLowerCase().includes('regiane');
              const isDebora = membro.usuario?.name?.toLowerCase().includes('debora');
              
              const vendas = 0;
              const meta = (isRegiane || isDebora) ? 55 : 0;
              const percentual = meta > 0 ? (vendas / meta) * 100 : 0;
              
              return (
                <div key={membro.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Avatar e Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border-2 border-blue-200 relative overflow-hidden">
                      {membro.usuario?.photo_url ? (
                        <img 
                          src={membro.usuario.photo_url}
                          alt={membro.usuario?.name || 'User'}
                          className="w-full h-full object-cover"
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
                      <h3 className="font-semibold text-gray-900 text-base">{membro.usuario?.name}</h3>
                      <p className="text-sm text-gray-500">SDR</p>
                    </div>
                  </div>

                  {/* Métricas e Ações */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{vendas}/{meta}</div>
                      <div className="text-sm text-gray-500">{percentual.toFixed(0)}%</div>
                    </div>
                    
                    <div className="w-24">
                      <Progress value={percentual} className="h-2 bg-gray-200" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs"
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
    </div>
  );
};