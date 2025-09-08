-- Add supervisor access to view team commissions
CREATE POLICY "Supervisores podem ver comissionamentos da equipe" 
ON public.comissionamentos_semanais 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN grupos_supervisores gs ON gs.supervisor_id = p.id
    JOIN membros_grupos_supervisores mgs ON mgs.grupo_id = gs.id
    WHERE p.id = auth.uid() 
    AND p.user_type = 'supervisor'
    AND mgs.usuario_id = comissionamentos_semanais.user_id
  )
);