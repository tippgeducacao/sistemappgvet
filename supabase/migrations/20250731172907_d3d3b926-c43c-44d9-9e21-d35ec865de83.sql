-- Atualizar política RLS para SDRs poderem ver TODOS os agendamentos
-- Isso é necessário para verificar conflitos de horário ao criar novos agendamentos

DROP POLICY IF EXISTS "SDRs podem ver seus agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Vendedores podem ver agendamentos com eles" ON agendamentos;

-- Nova política mais permissiva para visualização de agendamentos
CREATE POLICY "Usuários autenticados podem ver agendamentos" 
ON agendamentos 
FOR SELECT 
USING (
  (sdr_id = auth.uid()) OR 
  (vendedor_id = auth.uid()) OR 
  (EXISTS ( 
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor', 'sdr', 'sdr_inbound', 'sdr_outbound')
  ))
);

-- Política para SDRs criarem agendamentos (mantida)
-- Política para vendedores atualizarem resultados (mantida)
-- Política para SDRs atualizarem seus agendamentos (mantida)