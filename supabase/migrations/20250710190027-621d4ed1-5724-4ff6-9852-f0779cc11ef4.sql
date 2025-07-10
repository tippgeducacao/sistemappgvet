-- Corrigir política de INSERT para respostas_formulario
-- para permitir reenvio de vendas rejeitadas
DROP POLICY IF EXISTS "Users can create form responses" ON respostas_formulario;

-- Nova política mais permissiva para INSERT
CREATE POLICY "Users can create form responses" 
ON respostas_formulario
FOR INSERT 
WITH CHECK (
  -- Permitir se o usuário é o vendedor da form_entry
  EXISTS (
    SELECT 1 
    FROM form_entries 
    WHERE form_entries.id = respostas_formulario.form_entry_id 
    AND form_entries.vendedor_id = auth.uid()
  )
  OR
  -- Permitir se o usuário é admin/secretaria/diretor
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = ANY (ARRAY['admin', 'secretaria'])
  )
  OR
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'secretaria'::app_role, 'diretor'::app_role])
  )
);