import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Agendamento } from '@/hooks/useAgendamentos';

interface ReunioesCanceladasProps {
  fetchAgendamentosCancelados: () => Promise<Agendamento[]>;
}

const ReunioesCanceladas: React.FC<ReunioesCanceladasProps> = ({
  fetchAgendamentosCancelados
}) => {
  const [agendamentosCancelados, setAgendamentosCancelados] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAgendamentosCancelados();
  }, []);

  const carregarAgendamentosCancelados = async () => {
    try {
      setLoading(true);
      const cancelados = await fetchAgendamentosCancelados();
      setAgendamentosCancelados(cancelados);
    } catch (error) {
      console.error('Erro ao carregar agendamentos cancelados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reuniões Canceladas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Reuniões Canceladas
          <Badge variant="destructive">{agendamentosCancelados.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {agendamentosCancelados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma reunião cancelada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agendamentosCancelados.map(agendamento => (
              <div
                key={agendamento.id}
                className="p-4 border border-destructive/20 rounded-lg bg-destructive/5 dark:bg-destructive/10"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-destructive" />
                      <span className="font-medium text-foreground">
                        {agendamento.lead?.nome}
                      </span>
                      <Badge variant="destructive">Cancelado</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Agendado para {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })} das {format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR })}
                      {agendamento.data_fim_agendamento && (
                        <>
                          {' às '}
                          {format(new Date(agendamento.data_fim_agendamento), 'HH:mm', { locale: ptBR })}
                        </>
                      )}
                    </div>
                    
                    <div className="text-sm text-foreground">
                      <strong>Pós-graduação:</strong> {agendamento.pos_graduacao_interesse}
                    </div>
                    
                    {agendamento.sdr && (
                      <div className="text-sm text-foreground">
                        <strong>SDR:</strong> {agendamento.sdr.name}
                      </div>
                    )}
                    
                    {agendamento.observacoes && (
                      <div className="text-sm text-foreground">
                        <strong>Observações:</strong> {agendamento.observacoes}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground">
                  Cancelado em: {format(new Date(agendamento.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReunioesCanceladas;