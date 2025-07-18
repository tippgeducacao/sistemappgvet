-- Adicionar campos para rastrear resultado das reuniões
ALTER TABLE public.agendamentos 
ADD COLUMN resultado_reuniao TEXT CHECK (resultado_reuniao IN ('nao_compareceu', 'compareceu_nao_comprou', 'comprou')) DEFAULT NULL,
ADD COLUMN data_resultado TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN observacoes_resultado TEXT DEFAULT NULL;

-- Criar índice para melhorar performance nas consultas de reuniões efetivas
CREATE INDEX idx_agendamentos_resultado ON public.agendamentos(sdr_id, resultado_reuniao, data_agendamento);

-- Atualizar RLS para permitir vendedores atualizarem resultado das reuniões
CREATE POLICY "Vendedores podem atualizar resultado das reuniões" 
ON public.agendamentos 
FOR UPDATE 
USING (vendedor_id = auth.uid())
WITH CHECK (vendedor_id = auth.uid());