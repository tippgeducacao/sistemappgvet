-- Adicionar política RLS para supervisores poderem ver vendas da equipe
CREATE POLICY "Supervisores podem ver vendas da equipe" 
ON public.form_entries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN grupos_supervisores gs ON gs.supervisor_id = p.id
    JOIN membros_grupos_supervisores mgs ON mgs.grupo_id = gs.id
    WHERE p.id = auth.uid() 
    AND p.user_type = 'supervisor'
    AND (mgs.usuario_id = form_entries.vendedor_id OR mgs.usuario_id = form_entries.sdr_id)
    AND mgs.left_at IS NULL -- Apenas membros ativos
  )
);