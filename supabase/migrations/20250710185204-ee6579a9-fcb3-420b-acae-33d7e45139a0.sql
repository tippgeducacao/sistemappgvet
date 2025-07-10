-- Atualizar política de visualização das respostas do formulário para incluir diretores
DROP POLICY IF EXISTS "Users can view form responses for their entries" ON respostas_formulario;

-- Criar nova política que inclui diretores
CREATE POLICY "Users can view form responses for their entries" 
ON respostas_formulario
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM form_entries 
    WHERE form_entries.id = respostas_formulario.form_entry_id 
    AND (
      form_entries.vendedor_id = auth.uid() 
      OR EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type = ANY (ARRAY['admin', 'secretaria'])
      )
      OR EXISTS (
        SELECT 1 
        FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = ANY (ARRAY['admin'::app_role, 'secretaria'::app_role, 'diretor'::app_role])
      )
    )
  )
);