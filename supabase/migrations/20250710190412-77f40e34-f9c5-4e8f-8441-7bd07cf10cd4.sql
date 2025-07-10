-- Vamos simplificar e corrigir a política de INSERT
-- O problema pode ser a complexidade da verificação
DROP POLICY IF EXISTS "Users can create form responses" ON respostas_formulario;

-- Criar política mais simples e direta
CREATE POLICY "Users can create form responses" 
ON respostas_formulario
FOR INSERT 
WITH CHECK (
  -- Verificar se o usuário autenticado pode inserir
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
    -- Verificar se é vendedor da form_entry (usando subquery mais simples)
    form_entry_id IN (
      SELECT id FROM form_entries 
      WHERE vendedor_id = auth.uid()
    )
  )
);