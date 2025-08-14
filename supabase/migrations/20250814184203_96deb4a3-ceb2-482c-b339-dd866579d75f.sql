-- Remover a política que pode causar recursão
DROP POLICY IF EXISTS "Vendedores podem ver dados básicos dos SDRs" ON public.profiles;

-- Criar uma política mais segura usando a função existente get_current_user_type()
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
      get_current_user_type() = 'vendedor' AND
      user_type IN ('sdr', 'sdr_inbound', 'sdr_outbound')
    ) OR
    -- SDRs podem ver vendedores para agendamentos
    (
      get_current_user_type() IN ('sdr', 'sdr_inbound', 'sdr_outbound') AND
      user_type = 'vendedor'
    )
  )
);