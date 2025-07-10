-- Criar política de UPDATE para respostas_formulario
-- para permitir que vendedores editem suas vendas rejeitadas
CREATE POLICY "Users can update form responses" 
ON respostas_formulario
FOR UPDATE 
USING (
  -- Verificar se o usuário autenticado pode atualizar
  auth.role() = 'authenticated' AND (
    -- Verificar se é admin, secretaria ou diretor pelo user_type
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'secretaria')
    )
    OR
    -- Verificar se tem role de admin, secretaria ou diretor
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'secretaria', 'diretor')
    )
    OR
    -- Verificar se é vendedor da form_entry
    form_entry_id IN (
      SELECT id FROM form_entries 
      WHERE vendedor_id = auth.uid()
    )
  )
)
WITH CHECK (
  -- Mesma verificação para o WITH CHECK
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'secretaria')
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'secretaria', 'diretor')
    )
    OR
    form_entry_id IN (
      SELECT id FROM form_entries 
      WHERE vendedor_id = auth.uid()
    )
  )
);