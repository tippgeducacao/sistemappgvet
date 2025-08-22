-- Adicionar política para supervisores verem agendamentos dos membros de sua equipe
CREATE POLICY "Supervisores podem ver agendamentos da equipe"
ON public.agendamentos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.grupos_supervisores gs ON gs.supervisor_id = p.id
    JOIN public.membros_grupos_supervisores mgs ON mgs.grupo_id = gs.id
    WHERE p.id = auth.uid()
    AND p.user_type = 'supervisor'
    AND (mgs.usuario_id = agendamentos.sdr_id OR mgs.usuario_id = agendamentos.vendedor_id)
  )
);