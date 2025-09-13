import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAgendamentoLinking } from '@/hooks/useAgendamentoLinking';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TesteVinculacao: React.FC = () => {
  const [isTestingTrigger, setIsTestingTrigger] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const {
    agendamentosSemVinculo,
    isLoadingAgendamentos,
    executarVinculacaoAutomatica,
    isExecuting
  } = useAgendamentoLinking();

  const testarTriggerAutomatico = async () => {
    setIsTestingTrigger(true);
    setTestResults([]);
    
    try {
      // Criar uma venda de teste para verificar se o trigger funciona
      const testFormData = {
        vendedor_id: '123e4567-e89b-12d3-a456-426614174000', // ID fictício para teste
        curso_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'pendente',
        pontuacao_esperada: 1.0
      };

      const { data, error } = await supabase
        .from('form_entries')
        .insert(testFormData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTestResults(prev => [...prev, `✅ Venda de teste criada: ${data.id}`]);
      
      // Aguardar um pouco para o trigger executar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestResults(prev => [...prev, `📋 Verificar os logs do banco para ver se o trigger executou`]);
      
    } catch (error: any) {
      setTestResults(prev => [...prev, `❌ Erro no teste: ${error.message}`]);
      toast.error('Erro no teste do trigger');
    } finally {
      setIsTestingTrigger(false);
    }
  };

  const verificarAgendamentosSemVinculo = async () => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          resultado_reuniao,
          form_entry_id,
          data_agendamento,
          vendedor_id,
          sdr_id,
          lead:leads!lead_id (
            nome,
            email
          ),
          vendedor:profiles!vendedor_id (
            name
          )
        `)
        .eq('resultado_reuniao', 'comprou')
        .is('form_entry_id', null)
        .order('data_agendamento', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      console.log('🔍 Agendamentos "comprou" sem vinculação:', data);
      toast.success(`Encontrados ${data?.length || 0} agendamentos sem vinculação`);
      
    } catch (error: any) {
      console.error('Erro ao verificar agendamentos:', error);
      toast.error('Erro ao verificar agendamentos');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔗 Teste de Vinculação Agendamentos → Vendas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Estatísticas */}
          <Alert>
            <AlertDescription>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Agendamentos sem vinculação:</strong><br/>
                  {isLoadingAgendamentos ? 'Carregando...' : agendamentosSemVinculo?.length || 0}
                </div>
                <div>
                  <strong>Status do trigger:</strong><br/>
                  ✅ Ativo (melhorado)
                </div>
                <div>
                  <strong>Última atualização:</strong><br/>
                  {new Date().toLocaleString()}
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Ações de teste */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={verificarAgendamentosSemVinculo}
              variant="outline"
            >
              🔍 Verificar Agendamentos
            </Button>

            <Button 
              onClick={executarVinculacaoAutomatica}
              disabled={isExecuting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExecuting ? 'Executando...' : '🔄 Executar Vinculação'}
            </Button>

            <Button 
              onClick={testarTriggerAutomatico}
              disabled={isTestingTrigger}
              variant="secondary"
            >
              {isTestingTrigger ? 'Testando...' : '🧪 Testar Trigger'}
            </Button>
          </div>

          {/* Resultados do teste */}
          {testResults.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Resultados do Teste:</h4>
              <div className="space-y-1 text-sm font-mono">
                {testResults.map((result, index) => (
                  <div key={index}>{result}</div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de agendamentos sem vinculação */}
          {agendamentosSemVinculo && agendamentosSemVinculo.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">
                📋 Agendamentos "comprou" sem vinculação ({agendamentosSemVinculo.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {agendamentosSemVinculo.slice(0, 10).map((agendamento: any) => (
                  <div key={agendamento.id} className="p-2 bg-yellow-50 rounded text-sm">
                    <strong>{agendamento.lead?.nome}</strong> - {agendamento.vendedor?.name}
                    <br />
                    <span className="text-gray-600">
                      {new Date(agendamento.data_agendamento).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};