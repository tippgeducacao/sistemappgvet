import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

  const grupo = grupos[0];

  if (!grupo || !grupo.membros) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Nenhum grupo encontrado</p>
      </div>
    );
  }

  // Calcular metas coletivas
  const totalReunioes = 10; // Mock data - deve ser calculado baseado nos agendamentos
  const metaColetiva = grupo.membros.length * 55; // Assumindo meta de 55 por SDR
  const totalVendas = 60; // Mock data - deve ser calculado baseado nas vendas
  const percentualColetivo = metaColetiva > 0 ? (totalVendas / metaColetiva) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header com informações do mês/semana */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Os meses tem o mesmo sistema de semanas que começam na quarta e terminam na terça, 
          onde o último dia da semana que é na terça acaba naquele mês aquela semana é daquele 
          mês, o padrão que já tem no sistema
        </p>
        
        <div className="flex justify-center items-center gap-8 mt-4">
          <div className="border rounded-lg px-4 py-2">
            <span className="text-sm font-medium">MÊS</span>
          </div>
          <div className="border rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-sm">←</span>
            <span className="text-sm font-medium">SEMANA</span>
            <span className="text-sm">→</span>
          </div>
        </div>
      </div>

      {/* Informações das reuniões e meta */}
      <div className="flex justify-between items-center">
        <div className="text-left">
          <p className="text-xs text-muted-foreground uppercase">
            Deve ser as reuniões comparecidas do próprio supervisor, 
            ele em si não tem meta própria, a meta dele é a soma de 
            todas as metas dos usuários do grupo dele
          </p>
          <div className="mt-2">
            <span className="text-lg font-semibold">Minhas reuniões</span>
            <div className="text-2xl font-bold">{totalReunioes}</div>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase">Sua Meta</p>
          <div className="text-lg font-semibold">{totalVendas}/{metaColetiva}</div>
          <div className="text-sm text-muted-foreground">{percentualColetivo.toFixed(1)}%</div>
        </div>
      </div>

      {/* Meta Coletiva */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-center">META COLETIVA</CardTitle>
          <p className="text-xs text-muted-foreground text-center">
            DEVE BUSCAR A IMAGEM DE PERFIL DE CADA USUÁRIO
          </p>
          <p className="text-xs text-muted-foreground text-center">
            ESSA META DEVE SER PEGA DO PAINEL INDIVIDUAL DE CADA USUÁRIO
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {grupo.membros.map((membro, index) => {
            // Mock data - estes valores devem vir da API real
            const vendas = index === 3 ? 50 : 0; // Apenas um SDR com progresso para demonstrar
            const meta = index === 3 ? 100 : 55;
            const percentual = meta > 0 ? (vendas / meta) * 100 : 0;
            
            return (
              <div key={membro.id} className="flex items-center gap-3 p-2">
                {/* Foto do perfil */}
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-background">
                    {membro.usuario?.photo_url ? (
                      <img 
                        src={membro.usuario.photo_url}
                        alt={membro.usuario?.name || 'User'}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <span 
                      className={`text-xs font-medium text-primary ${membro.usuario?.photo_url ? 'hidden' : 'block'}`}
                    >
                      {membro.usuario?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>

                {/* Nome e progresso */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{membro.usuario?.name || 'SDR'}</span>
                    <span className="text-sm font-medium">{vendas}/{meta}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Progress value={percentual} className="flex-1 h-2 mr-2" />
                    <span className="text-xs text-muted-foreground">{percentual.toFixed(0)}%</span>
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

export default SupervisorMetasColetivas;