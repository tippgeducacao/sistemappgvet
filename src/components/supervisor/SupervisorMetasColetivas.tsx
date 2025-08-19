import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Edit } from 'lucide-react';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';

const SupervisorMetasColetivas: React.FC = () => {
  const { grupos, loading } = useGruposSupervisores();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const grupo = grupos[0]; // Assumindo que há pelo menos um grupo

  if (!grupo || !grupo.membros) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Nenhum grupo encontrado</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">META COLETIVA</CardTitle>
        <p className="text-sm text-muted-foreground">
          Desempenho individual dos SDRs da sua equipe
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {grupo.membros.map((membro) => {
          console.log('🔍 Renderizando membro:', membro);
          console.log('🔍 URL da foto:', membro.usuario?.photo_url);
          const vendas = 0; // TODO: Buscar vendas reais
          const meta = 55; // TODO: Buscar meta real
          const percentual = meta > 0 ? (vendas / meta) * 100 : 0;
          
          return (
            <div key={membro.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {membro.usuario?.photo_url ? (
                  <img 
                    src={membro.usuario.photo_url}
                    alt={membro.usuario?.name || 'User'}
                    className="h-10 w-10 rounded-full object-cover"
                    onError={(e) => {
                      console.error('🚨 Erro ao carregar imagem:', {
                        src: membro.usuario?.photo_url,
                        nome: membro.usuario?.name,
                        error: e
                      });
                    }}
                    onLoad={() => {
                      console.log('✅ Imagem carregada com sucesso:', {
                        src: membro.usuario?.photo_url,
                        nome: membro.usuario?.name
                      });
                    }}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center">
                    {membro.usuario?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{membro.usuario?.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {membro.usuario?.user_type?.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-medium">{vendas}/{meta}</div>
                  <div className="text-sm text-muted-foreground">{percentual.toFixed(0)}%</div>
                </div>
                
                <div className="w-32">
                  <Progress value={percentual} className="h-2" />
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Precisa melhorar
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default SupervisorMetasColetivas;