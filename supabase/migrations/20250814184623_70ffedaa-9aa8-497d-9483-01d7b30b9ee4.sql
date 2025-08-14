-- Política para permitir que vendedores vejam leads de seus agendamentos
-- Isso é necessário para exibir nomes dos leads na lista de reuniões
CREATE POLICY "Vendedores podem ver leads de seus agendamentos"
ON public.leads
FOR SELECT
TO public
USING (
  (auth.role() = 'authenticated'::text) AND 
  (
    -- Lead atribuído diretamente ao vendedor
    (vendedor_atribuido = auth.uid()) OR
    -- Lead associado a um agendamento do vendedor
    (EXISTS (
      SELECT 1 FROM public.agendamentos 
      WHERE agendamentos.lead_id = leads.id 
      AND agendamentos.vendedor_id = auth.uid()
    ))
  )
);