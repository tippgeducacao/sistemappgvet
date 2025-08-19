-- Permitir que supervisores vejam perfis dos membros de seus grupos
DROP POLICY IF EXISTS "Supervisors can view team profiles" ON public.profiles;

CREATE POLICY "Supervisors can view team profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  get_current_user_type() = ANY (ARRAY['admin'::text, 'secretaria'::text, 'diretor'::text]) OR
  (get_current_user_type() = 'supervisor'::text AND (
    -- Pode ver qualquer perfil se for supervisor
    user_type = ANY (ARRAY['vendedor'::text, 'sdr'::text, 'sdr_inbound'::text, 'sdr_outbound'::text]) OR
    -- Pode ver membros de seus grupos
    id IN (
      SELECT mgr.usuario_id 
      FROM membros_grupos_supervisores mgr
      JOIN grupos_supervisores gs ON gs.id = mgr.grupo_id
      WHERE gs.supervisor_id = auth.uid()
    )
  )) OR
  ((get_current_user_type() = 'vendedor'::text) AND (user_type = ANY (ARRAY['sdr'::text, 'sdr_inbound'::text, 'sdr_outbound'::text]))) OR
  ((get_current_user_type() = ANY (ARRAY['sdr'::text, 'sdr_inbound'::text, 'sdr_outbound'::text])) AND (user_type = 'vendedor'::text))
);

-- Permitir que supervisores vejam metas semanais dos membros de seus grupos
DROP POLICY IF EXISTS "Users can view all weekly goals" ON public.metas_semanais_vendedores;

CREATE POLICY "Users can view all weekly goals" 
ON public.metas_semanais_vendedores 
FOR SELECT 
USING (
  auth.role() = 'authenticated'::text AND (
    vendedor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND user_type = ANY (ARRAY['admin'::text, 'diretor'::text, 'secretaria'::text])
    ) OR
    -- Supervisores podem ver metas de membros de seus grupos
    (EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'supervisor'::text
    ) AND vendedor_id IN (
      SELECT mgr.usuario_id 
      FROM membros_grupos_supervisores mgr
      JOIN grupos_supervisores gs ON gs.id = mgr.grupo_id
      WHERE gs.supervisor_id = auth.uid()
    ))
  )
);