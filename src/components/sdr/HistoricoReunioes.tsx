import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, ExternalLink, Eye } from 'lucide-react';
import { useAuthStore } from '@/stores/AuthStore';
import { supabase } from '@/integrations/supabase/client';
import LoadingState from '@/components/ui/loading-state';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoReuniao {
  id: string;
  lead_id: string;
  vendedor_id: string;
  data_agendamento: string;
  data_fim_agendamento?: string;
  pos_graduacao_interesse: string;
  link_reuniao: string;
  observacoes?: string;
  status: string;
  resultado_reuniao?: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou' | null;
  data_resultado?: string;
  observacoes_resultado?: string;
  created_at: string;
  updated_at: string;
  lead?: {
    nome: string;
    email?: string;
    whatsapp?: string;
  };
  vendedor?: {
    name: string;
    email: string;
  };
}

const HistoricoReunioes: React.FC = () => {
  const [reunioes, setReunioes] = useState<HistoricoReuniao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuthStore();

  const fetchHistoricoReunioes = async () => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          lead:leads!agendamentos_lead_id_fkey (
            nome,
            email,
            whatsapp
          ),
          vendedor:profiles!agendamentos_vendedor_id_fkey (
            name,
            email
          )
        `)
        .eq('sdr_id', profile.id)
        .order('data_agendamento', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico de reuniões:', error);
        return;
      }

      setReunioes((data || []) as HistoricoReuniao[]);
    } catch (error) {
      console.error('Erro ao buscar histórico de reuniões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricoReunioes();
  }, [profile?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendado':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Agendado</Badge>;
      case 'realizado':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Realizado</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResultadoBadge = (resultado: string | null) => {
    if (!resultado) return null;
    
    switch (resultado) {
      case 'comprou':
        return <Badge className="bg-green-100 text-green-800">Converteu</Badge>;
      case 'compareceu_nao_comprou':
        return <Badge className="bg-yellow-100 text-yellow-800">Compareceu</Badge>;
      case 'nao_compareceu':
        return <Badge className="bg-red-100 text-red-800">Não Compareceu</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Reuniões</CardTitle>
          <CardDescription>Todas as reuniões que você agendou</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingState message="Carregando histórico..." />
        </CardContent>
      </Card>
    );
  }

  if (reunioes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Reuniões</CardTitle>
          <CardDescription>Todas as reuniões que você agendou</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Nenhuma reunião agendada ainda</p>
            <p className="text-sm">Suas reuniões aparecerão aqui quando você começar a agendar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Reuniões</CardTitle>
        <CardDescription>
          {reunioes.length} reuniões agendadas no total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reunioes.map((reuniao) => (
            <div key={reuniao.id} className="border rounded-lg p-4 space-y-3">
              {/* Header da reunião */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{reuniao.lead?.nome}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(reuniao.data_agendamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(reuniao.data_agendamento), 'HH:mm')}
                    {reuniao.data_fim_agendamento && 
                      ` - ${format(new Date(reuniao.data_fim_agendamento), 'HH:mm')}`
                    }
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(reuniao.status)}
                  {getResultadoBadge(reuniao.resultado_reuniao)}
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Vendedor:</span> {reuniao.vendedor?.name}
                </div>
                <div>
                  <span className="font-medium">Pós-graduação:</span> {reuniao.pos_graduacao_interesse}
                </div>
                {reuniao.lead?.email && (
                  <div>
                    <span className="font-medium">Email:</span> {reuniao.lead.email}
                  </div>
                )}
                {reuniao.lead?.whatsapp && (
                  <div>
                    <span className="font-medium">WhatsApp:</span> {reuniao.lead.whatsapp}
                  </div>
                )}
              </div>

              {/* Observações */}
              {reuniao.observacoes && (
                <div className="text-sm">
                  <span className="font-medium">Observações:</span>
                  <p className="text-muted-foreground mt-1">{reuniao.observacoes}</p>
                </div>
              )}

              {/* Resultado da reunião */}
              {reuniao.observacoes_resultado && (
                <div className="text-sm">
                  <span className="font-medium">Resultado:</span>
                  <p className="text-muted-foreground mt-1">{reuniao.observacoes_resultado}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center gap-2 pt-2 border-t">
                {reuniao.link_reuniao && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={reuniao.link_reuniao} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Link da Reunião
                    </a>
                  </Button>
                )}
                {reuniao.data_resultado && (
                  <div className="text-xs text-muted-foreground ml-auto">
                    Finalizada em {format(new Date(reuniao.data_resultado), "dd/MM/yyyy 'às' HH:mm")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricoReunioes;