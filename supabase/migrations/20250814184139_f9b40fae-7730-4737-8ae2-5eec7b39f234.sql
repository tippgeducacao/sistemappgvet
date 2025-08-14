-- Política para permitir que vendedores vejam dados básicos dos SDRs
-- Isso é necessário para exibir "SDR Responsável" nos agendamentos
CREATE POLICY "Vendedores podem ver dados básicos dos SDRs"
ON public.profiles
FOR SELECT
TO public
USING (
  (auth.role() = 'authenticated'::text) AND 
  (
    -- Usuário pode ver seu próprio perfil
    (auth.uid() = id) OR
    -- Vendedores podem ver SDRs para mostrar "SDR Responsável" 
    (
      (SELECT user_type FROM public.profiles WHERE id = auth.uid()) = 'vendedor' AND
      user_type IN ('sdr', 'sdr_inbound', 'sdr_outbound')
    ) OR
    -- SDRs podem ver vendedores para agendamentos
    (
      (SELECT user_type FROM public.profiles WHERE id = auth.uid()) IN ('sdr', 'sdr_inbound', 'sdr_outbound') AND
      user_type = 'vendedor'
    )
  )
);